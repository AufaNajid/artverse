"use client";

import Image from "next/image";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { useEffect, useRef, useState, type ChangeEvent, type FormEvent } from "react";
import { categories } from "@/data/artworks";
import { CmsError, cmsRequest, errorMessage, type CmsArtwork, type CmsImage } from "./types";
import { uploadImage } from "./upload";

type EditorFields = { title: string; slug: string; category: string; description: string; alt: string; tools: string; tags: string; year: string; featured: boolean; color: string; brief: string; approach: string; coverPath: string; framePath: string; coverUrl: string; width: number; height: number; images: CmsImage[] };
const blank: EditorFields = { title: "", slug: "", category: "Pixel art", description: "", alt: "", tools: "", tags: "", year: "", featured: false, color: "#c7eff3", brief: "", approach: "", coverPath: "", framePath: "", coverUrl: "", width: 0, height: 0, images: [] };
function fieldsFrom(work: CmsArtwork): EditorFields { return { title: work.title, slug: work.slug, category: work.category, description: work.description, alt: work.alt, featured: work.featured, color: work.color, brief: work.brief, approach: work.approach, coverPath: work.coverPath || "", framePath: work.framePath || "", coverUrl: work.coverUrl || "", width: work.width || 0, height: work.height || 0, tools: work.tools.join(", "), tags: work.tags.join(", "), year: work.year ? String(work.year) : "", images: work.images || [] }; }
function slugify(value: string) { return value.toLowerCase().normalize("NFD").replace(/[\u0300-\u036f]/g, "").replace(/[^a-z0-9]+/g, "-").replace(/^-|-$/g, ""); }
function split(value: string) { return value.split(",").map(v => v.trim()).filter(Boolean); }

export default function ArtworkEditor({ artworkId }: { artworkId?: string }) {
  const router = useRouter(); const [id, setId] = useState(artworkId || "");
  const [fields, setFields] = useState<EditorFields>(blank); const [saved, setSaved] = useState(JSON.stringify(blank));
  const [status, setStatus] = useState<"draft" | "published">("draft"); const [slugLocked, setSlugLocked] = useState(false);
  const [loading, setLoading] = useState(Boolean(artworkId)); const [busy, setBusy] = useState(false); const [uploading, setUploading] = useState(false); const [progress, setProgress] = useState(0); const [uploadLabel, setUploadLabel] = useState("");
  const [error, setError] = useState(""); const [notice, setNotice] = useState(""); const [fieldErrors, setFieldErrors] = useState<Record<string, string[]>>({}); const [retry, setRetry] = useState(0);
  const coverInput = useRef<HTMLInputElement>(null); const galleryInput = useRef<HTMLInputElement>(null); const latestId = useRef(id); const stagedAssets = useRef(new Map<string, string>());
  const dirty = JSON.stringify(fields) !== saved;
  useEffect(() => { if (!artworkId) return; const abort = new AbortController(); cmsRequest<{ artwork: CmsArtwork }>(`/api/artworks/${artworkId}`, { signal: abort.signal }).then(({ artwork }) => { const next = fieldsFrom(artwork); setFields(next); setSaved(JSON.stringify(next)); setStatus(artwork.status); setSlugLocked(Boolean(artwork.publishedAt) || artwork.status === "published"); setId(artwork.id); latestId.current = artwork.id; setError(""); }).catch(cause => { if (!abort.signal.aborted) setError(errorMessage(cause)); }).finally(() => { if (!abort.signal.aborted) setLoading(false); }); return () => abort.abort(); }, [artworkId, retry]);
  useEffect(() => { if (!dirty && !uploading) return; const warn = (event: BeforeUnloadEvent) => { event.preventDefault(); }; window.addEventListener("beforeunload", warn); return () => window.removeEventListener("beforeunload", warn); }, [dirty, uploading]);
  function update<K extends keyof EditorFields>(name: K, value: EditorFields[K]) { setFields(previous => ({ ...previous, [name]: value })); setNotice(""); setFieldErrors(previous => ({ ...previous, [name]: [] })); }
  function updateTitle(value: string) { setFields(previous => ({ ...previous, title: value, slug: !slugLocked && (!previous.slug || previous.slug === slugify(previous.title)) ? slugify(value) : previous.slug })); setNotice(""); setFieldErrors(previous => ({ ...previous, title: [], slug: [] })); }
  async function ensureDraft() {
    if (latestId.current) return latestId.current;
    if (!fields.title.trim() || !fields.category) throw new Error("Add a title and choose a category before uploading an image.");
    const { artwork } = await cmsRequest<{ artwork: CmsArtwork }>("/api/artworks", { method: "POST", body: JSON.stringify({ title: fields.title.trim(), category: fields.category, status: "draft" }) });
    latestId.current = artwork.id; setId(artwork.id); return artwork.id;
  }
  async function discardStaged(path: string) {
    const assetId = stagedAssets.current.get(path); if (!assetId) return;
    stagedAssets.current.delete(path);
    try { await cmsRequest("/api/uploads", { method: "DELETE", body: JSON.stringify({ id: assetId }) }); }
    catch { setError("An unused upload could not be removed. Retry image cleanup from the Overview page if storage remains full."); }
  }
  function removeGalleryImage(index: number) {
    const image = fields.images[index]; if (!image) return;
    update("images", fields.images.filter((_, position) => position !== index));
    void discardStaged(image.storagePath);
  }
  async function upload(event: ChangeEvent<HTMLInputElement>, purpose: "cover" | "gallery") {
    const files = Array.from(event.target.files || []); event.target.value = ""; if (!files.length) return;
    if (purpose === "gallery" && fields.images.length + files.length + (fields.coverPath ? 1 : 0) > 15) { setError("Each artwork can have up to 15 images, including the cover."); return; }
    if (purpose === "cover" && !fields.coverPath && fields.images.length >= 15) { setError("Remove one gallery image before adding a cover. Each artwork can have up to 15 images in total."); return; }
    setUploading(true); setError(""); setNotice("");
    try {
      const draftId = await ensureDraft();
      for (let index = 0; index < files.length; index++) {
        setUploadLabel(`Uploading ${purpose === "cover" ? "cover" : `image ${index + 1} of ${files.length}`}`); setProgress(0);
        const asset = await uploadImage(files[index], purpose, setProgress, draftId);
        stagedAssets.current.set(asset.storagePath, asset.id);
        if (purpose === "cover") { setFields(previous => ({ ...previous, coverPath: asset.storagePath, framePath: asset.framePath, coverUrl: asset.url, width: asset.width, height: asset.height })); await discardStaged(fields.coverPath); }
        else setFields(previous => ({ ...previous, images: [...previous.images, { id: asset.id, storagePath: asset.storagePath, url: asset.url, alt: "", sortOrder: previous.images.length }] }));
      }
      setNotice("Image uploaded. Save your changes to attach it to this artwork.");
    } catch (cause) { setError(errorMessage(cause)); } finally { setUploading(false); setUploadLabel(""); }
  }
  function reorderImage(index: number, direction: number) { const next = [...fields.images]; [next[index], next[index + direction]] = [next[index + direction], next[index]]; update("images", next.map((image, order) => ({ ...image, sortOrder: order }))); }
  async function persist(nextStatus: "draft" | "published") {
    setError(""); setNotice(""); setFieldErrors({});
    const validation: Record<string, string[]> = {};
    if (!fields.title.trim()) validation.title = ["Give your artwork a title."];
    if (!fields.category) validation.category = ["Choose a category."];
    if (nextStatus === "published" && !fields.coverPath) validation.coverPath = ["Upload a cover before publishing."];
    if (nextStatus === "published" && !fields.alt.trim()) validation.alt = ["Describe the cover so everyone can experience your work."];
    if (Object.keys(validation).length) { setFieldErrors(validation); setError("A few details need your attention before saving."); return; }
    setBusy(true);
    try {
      const draftId = await ensureDraft();
      const payload = { title: fields.title.trim(), slug: fields.slug || slugify(fields.title), category: fields.category, description: fields.description, coverPath: fields.coverPath || null, alt: fields.alt, featured: fields.featured, color: fields.color, brief: fields.brief, approach: fields.approach, status: nextStatus, tools: split(fields.tools), tags: split(fields.tags), year: fields.year ? Number(fields.year) : null, images: fields.images.map((image, index) => ({ storagePath: image.storagePath, alt: image.alt, sortOrder: index })) };
      const { artwork } = await cmsRequest<{ artwork: CmsArtwork }>(`/api/artworks/${draftId}`, { method: "PATCH", body: JSON.stringify(payload) });
      stagedAssets.current.clear();
      const next = fieldsFrom(artwork); setFields(next); setSaved(JSON.stringify(next)); setStatus(artwork.status); setSlugLocked(Boolean(artwork.publishedAt) || artwork.status === "published");
      setNotice(nextStatus === "published" ? "Your artwork is live in the portfolio and 3D gallery." : "Draft saved. Only you can see this artwork.");
      if (!artworkId) router.replace(`/dashboard/artworks/${draftId}/edit`);
      router.refresh();
    } catch (cause) { setError(errorMessage(cause)); if (cause instanceof CmsError) setFieldErrors(cause.fields); } finally { setBusy(false); }
  }
  function submit(event: FormEvent) { event.preventDefault(); void persist(status); }
  const locked = busy || uploading;
  if (loading) return <div className="cms-loading" role="status"><i /> Opening your artwork…</div>;
  if (artworkId && error && !fields.title) return <div className="cms-message cms-error" role="alert">{error}<button className="cms-button cms-button-secondary" onClick={() => { setLoading(true); setRetry(retry + 1); }}>Try again</button><Link href="/dashboard/artworks">Back to artworks</Link></div>;
  return <form className="cms-editor" onSubmit={submit}>
    <Link className="cms-back-link" href="/dashboard/artworks" onClick={event => { if ((dirty || uploading) && !window.confirm("Leave this artwork? Unsaved changes will be lost.")) event.preventDefault(); }}>← Back to artworks</Link>
    <div className="cms-page-heading cms-heading-compact"><div><p className="cms-eyebrow">{artworkId ? "A LITTLE POLISH" : "A NEW BEGINNING"}</p><h1>{artworkId ? "Make it yours." : "Hello, new artwork."}</h1><p>{artworkId ? "Care for the details. Let your work do the talking." : "Start with an idea. You can save it privately while it takes shape."}</p></div><span className={`cms-badge ${status}`}>{status}</span></div>
    {error && <div className="cms-message cms-error" role="alert"><div>{error}{Object.values(fieldErrors).some(messages => messages.length) && <ul className="cms-error-summary">{Object.entries(fieldErrors).filter(([, messages]) => messages.length).map(([field, messages]) => <li key={field}>{messages.join(" ")}</li>)}</ul>}</div></div>}{notice && <div className="cms-message cms-success" role="status">{notice}</div>}
    {uploading && <div className="cms-upload-progress" role="status"><span>{uploadLabel}… {progress}%</span><progress value={progress} max={100} /></div>}
    <fieldset disabled={locked} className="cms-editor-fieldset"><div className="cms-editor-grid"><div className="cms-editor-main">
      <section className="cms-panel cms-form-panel"><div className="cms-section-number">01 / THE ESSENTIALS</div><h2>A name, a story.</h2><div className="cms-form">
        <label>Artwork title <span className="cms-required">*</span><input name="title" value={fields.title} maxLength={120} onChange={event => updateTitle(event.target.value)} placeholder="A title for this little world" aria-invalid={Boolean(fieldErrors.title?.length)} /><FieldError errors={fieldErrors.title} /></label>
        <label>Portfolio URL<input name="slug" value={fields.slug} maxLength={120} onChange={event => update("slug", slugify(event.target.value))} readOnly={slugLocked} aria-describedby="slug-hint" /><small id="slug-hint">{slugLocked ? "This URL is locked because the artwork has been published before. Existing links stay reliable." : "Letters, numbers, and hyphens. This becomes permanent when first published."}</small><FieldError errors={fieldErrors.slug} /></label>
        <div className="cms-two-fields"><label>Category <span className="cms-required">*</span><select value={fields.category} onChange={event => update("category", event.target.value)}>{categories.map(category => <option key={category}>{category}</option>)}</select><FieldError errors={fieldErrors.category} /></label><label>Year<input type="number" min={1900} max={2100} value={fields.year} onChange={event => update("year", event.target.value)} placeholder="Optional" /><FieldError errors={fieldErrors.year} /></label></div>
        <label>Short description<textarea name="description" rows={3} maxLength={5000} value={fields.description} onChange={event => update("description", event.target.value)} placeholder="A few lines about the piece, its feeling, or its little universe." /><small>Shown in the artwork page and 3D focus card.</small><FieldError errors={fieldErrors.description} /></label>
      </div></section>
      <section className="cms-panel cms-form-panel"><div className="cms-section-number">02 / THE ARTWORK</div><h2>Give it a face.</h2><p className="cms-section-intro">PNG, JPG, or WebP. Up to 10 MB per image. Your original image stays intact.</p>
        <input ref={coverInput} className="cms-sr-only" type="file" accept="image/png,image/jpeg,image/webp" onChange={event => void upload(event, "cover")} tabIndex={-1} aria-label="Choose cover image" />
        <div className={`cms-cover-upload ${fields.coverUrl ? "has-cover" : ""}`} style={{ background: fields.color }}>{fields.coverUrl ? <Image src={fields.coverUrl} alt={fields.alt || "Artwork cover preview"} fill unoptimized sizes="(max-width: 700px) 100vw, 650px" /> : <div><span aria-hidden="true">▧</span><strong>Your cover goes here</strong><p>The first impression in your portfolio and 3D gallery.</p></div>}</div>
        <div className="cms-upload-actions"><button type="button" className="cms-button cms-button-secondary" onClick={() => coverInput.current?.click()}>{fields.coverPath ? "Replace cover" : "＋ Upload cover"}</button>{fields.width > 0 && <span>{fields.width} × {fields.height} px</span>}</div><FieldError errors={fieldErrors.coverPath} />
        <div className="cms-form"><label>Cover image description <span className="cms-required">*</span><textarea rows={2} value={fields.alt} maxLength={500} onChange={event => update("alt", event.target.value)} placeholder="Describe the subject, colors, and important visual details." aria-invalid={Boolean(fieldErrors.alt?.length)} /><small>Alt text helps people using screen readers. Required to publish.</small><FieldError errors={fieldErrors.alt} /></label></div>
        <div className="cms-gallery-heading"><div><h3>The extra details</h3><p>Add close-ups, sketches, or process images.</p></div><span>{fields.images.length + (fields.coverPath ? 1 : 0)} / 15 images</span></div>
        <input ref={galleryInput} className="cms-sr-only" type="file" accept="image/png,image/jpeg,image/webp" multiple onChange={event => void upload(event, "gallery")} tabIndex={-1} aria-label="Choose gallery images" />
        {fields.images.length > 0 && <div className="cms-edit-gallery">{fields.images.map((image, index) => <div className="cms-gallery-image" key={image.storagePath}><div className="cms-gallery-preview"><Image src={image.url} alt={image.alt || `Gallery image ${index + 1}`} fill unoptimized sizes="150px" /><span>{String(index + 1).padStart(2, "0")}</span></div><label><span className="cms-sr-only">Description for gallery image {index + 1}</span><input value={image.alt} placeholder="Image description" maxLength={500} onChange={event => update("images", fields.images.map((item, i) => i === index ? { ...item, alt: event.target.value } : item))} /></label><div className="cms-gallery-controls"><button type="button" aria-label={`Move image ${index + 1} earlier`} disabled={index === 0} onClick={() => reorderImage(index, -1)}>←</button><button type="button" aria-label={`Move image ${index + 1} later`} disabled={index === fields.images.length - 1} onClick={() => reorderImage(index, 1)}>→</button><button type="button" className="cms-delete-button" onClick={() => removeGalleryImage(index)}>Remove</button></div></div>)}</div>}
        <button type="button" className="cms-add-images" disabled={fields.images.length + (fields.coverPath ? 1 : 0) >= 15} onClick={() => galleryInput.current?.click()}>＋ Add gallery images</button><p className="cms-form-note">Uploads and removed images take effect when you save. Removing an image here does not change the public artwork until then.</p>
      </section>
      <section className="cms-panel cms-form-panel"><div className="cms-section-number">03 / BEHIND THE PIXELS</div><h2>Tell a little more.</h2><p className="cms-section-intro">Optional details for people who want to look closer.</p><div className="cms-form"><label>The idea<textarea rows={4} value={fields.brief} onChange={event => update("brief", event.target.value)} placeholder="What sparked this piece?" /></label><label>The approach<textarea rows={4} value={fields.approach} onChange={event => update("approach", event.target.value)} placeholder="How did you bring it to life?" /></label><label>Tools & mediums<input value={fields.tools} onChange={event => update("tools", event.target.value)} placeholder="Aseprite, Procreate, pencil…" /><small>Separate each tool or medium with a comma.</small></label><label>Tags<input value={fields.tags} onChange={event => update("tags", event.target.value)} placeholder="Character design, pixel art, portrait…" /><small>Separate each tag with a comma.</small></label></div></section>
    </div><aside className="cms-editor-aside"><section className="cms-panel cms-form-panel cms-publish-panel"><p className="cms-eyebrow">A PLACE IN YOUR WORLD</p><h2>{status === "published" ? "Out in the world." : "Ready when you are."}</h2><p>{status === "published" ? "Saved changes update the live portfolio and 3D gallery." : "Drafts are your private space. Publish only when your artwork feels ready."}</p><div className="cms-publish-checks"><span className={fields.title.trim() ? "complete" : ""}>✓ Title & category</span><span className={fields.coverPath ? "complete" : ""}>✓ Cover image</span><span className={fields.alt.trim() ? "complete" : ""}>✓ Cover description</span></div><label className="cms-checkbox"><input type="checkbox" checked={fields.featured} onChange={event => update("featured", event.target.checked)} /><span><strong>Feature this artwork</strong><small>A spot in the homepage selection.</small></span></label><label className="cms-color-field">Artwork background<div><input type="color" value={/^#[0-9a-f]{6}$/i.test(fields.color) ? fields.color : "#c7eff3"} onChange={event => update("color", event.target.value)} aria-label="Artwork background color" /><span>{fields.color}</span></div></label></section><div className="cms-editor-tip"><span aria-hidden="true">✦</span><p>A good cover description says what you see. Think subject, pose, color, and mood.</p></div>{status === "published" && <Link className="cms-text-button" target="_blank" href={`/artwork/${fields.slug}`} rel="noopener noreferrer">View published artwork ↗</Link>}</aside></div></fieldset>
    <div className="cms-savebar"><div aria-live="polite"><i className={dirty ? "is-unsaved" : ""} />{uploading ? "Uploading images…" : busy ? "Saving your artwork…" : dirty ? "You have unsaved changes" : "All changes saved"}{id && <small>{status === "published" ? "Visible in your portfolio" : "Private draft"}</small>}</div><div className="cms-actions">{status === "draft" && <button type="button" disabled={locked} className="cms-button cms-button-secondary" onClick={() => void persist("draft")}>{busy ? "Saving…" : "Save draft"}</button>}{status === "published" && <button type="button" disabled={locked} className="cms-button cms-button-secondary" onClick={() => void persist("draft")}>Unpublish</button>}<button type="button" disabled={locked} className="cms-button" onClick={() => void persist("published")}>{busy ? "Saving…" : status === "published" ? "Save changes" : "Publish artwork"}<span aria-hidden="true">↗</span></button></div></div>
  </form>;
}
function FieldError({ errors }: { errors?: string[] }) { return errors?.length ? <span className="cms-field-error">{errors.join(" ")}</span> : null; }


