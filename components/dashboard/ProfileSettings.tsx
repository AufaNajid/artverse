"use client";

import Image from "next/image";
import Link from "next/link";
import { useEffect, useRef, useState, type ChangeEvent, type FormEvent } from "react";
import { CmsError, cmsRequest, errorMessage, type CmsProfile } from "./types";
import { uploadImage } from "./upload";

const empty: CmsProfile = { name: "", bio: "", avatarPath: null, avatarUrl: null, instagram: "", email: "" };
function normalize(profile: CmsProfile): CmsProfile { return { ...empty, ...profile, email: profile.email || "" }; }
export default function ProfileSettings() {
  const [profile, setProfile] = useState<CmsProfile>(empty); const [saved, setSaved] = useState(JSON.stringify(empty));
  const [loading, setLoading] = useState(true); const [busy, setBusy] = useState(false); const [uploading, setUploading] = useState(false); const [progress, setProgress] = useState(0);
  const [error, setError] = useState(""); const [notice, setNotice] = useState(""); const [fieldErrors, setFieldErrors] = useState<Record<string, string[]>>({}); const [retry, setRetry] = useState(0); const input = useRef<HTMLInputElement>(null); const stagedAvatar = useRef<string | null>(null);
  const dirty = JSON.stringify(profile) !== saved;
  useEffect(() => { const abort = new AbortController(); cmsRequest<{ profile: CmsProfile }>("/api/profile", { signal: abort.signal }).then(({ profile: value }) => { const next = normalize(value); setProfile(next); setSaved(JSON.stringify(next)); setError(""); }).catch(cause => { if (!abort.signal.aborted) setError(errorMessage(cause)); }).finally(() => { if (!abort.signal.aborted) setLoading(false); }); return () => abort.abort(); }, [retry]);
  useEffect(() => { if (!dirty && !uploading) return; const warn = (event: BeforeUnloadEvent) => event.preventDefault(); window.addEventListener("beforeunload", warn); return () => window.removeEventListener("beforeunload", warn); }, [dirty, uploading]);
  function update<K extends keyof CmsProfile>(key: K, value: CmsProfile[K]) { setProfile(previous => ({ ...previous, [key]: value })); setNotice(""); setFieldErrors(previous => ({ ...previous, [key]: [] })); }
  async function discardStagedAvatar() {
    const assetId = stagedAvatar.current; stagedAvatar.current = null; if (!assetId) return;
    try { await cmsRequest("/api/uploads", { method: "DELETE", body: JSON.stringify({ id: assetId }) }); }
    catch { setError("An unused avatar upload could not be removed. Retry image cleanup from Overview if storage remains full."); }
  }
  function removeAvatar() { update("avatarPath", null); update("avatarUrl", null); void discardStagedAvatar(); }
  async function upload(event: ChangeEvent<HTMLInputElement>) {
    const file = event.target.files?.[0]; event.target.value = ""; if (!file) return; setUploading(true); setError(""); setNotice(""); setProgress(0);
    try { const asset = await uploadImage(file, "avatar", setProgress); await discardStagedAvatar(); stagedAvatar.current = asset.id; setProfile(previous => ({ ...previous, avatarPath: asset.storagePath, avatarUrl: asset.url })); setNotice("Avatar uploaded. Save your profile to make it public."); }
    catch (cause) { setError(errorMessage(cause)); } finally { setUploading(false); }
  }
  async function save(event: FormEvent) {
    event.preventDefault(); setBusy(true); setError(""); setNotice(""); setFieldErrors({});
    try { const { profile: next } = await cmsRequest<{ profile: CmsProfile }>("/api/profile", { method: "PATCH", body: JSON.stringify({ name: profile.name, bio: profile.bio, avatarPath: profile.avatarPath, instagram: profile.instagram, email: profile.email }) }); stagedAvatar.current = null; setProfile(normalize(next)); setSaved(JSON.stringify(normalize(next))); setNotice("Profile saved. Your portfolio is up to date."); }
    catch (cause) { setError(errorMessage(cause)); if (cause instanceof CmsError) setFieldErrors(cause.fields); } finally { setBusy(false); }
  }
  if (loading) return <div className="cms-loading" role="status"><i /> Getting your profile ready…</div>;
  return <><div className="cms-page-heading cms-heading-compact"><div><p className="cms-eyebrow">THE PERSON BEHIND THE PIXELS / 03</p><h1>A little about you.</h1><p>The details that turn a collection into your portfolio.</p></div><span className="cms-heading-spark" aria-hidden="true">✦</span></div>
    {error && <div className="cms-message cms-error" role="alert">{error}<button type="button" className="cms-text-button" onClick={() => { setLoading(true); setRetry(retry + 1); }}>Reload profile →</button></div>}{notice && <div className="cms-message cms-success" role="status">{notice}</div>}
    <form className="cms-settings-form" onSubmit={save}><fieldset disabled={busy || uploading} className="cms-editor-fieldset"><section className="cms-panel cms-form-panel"><div className="cms-section-number">01 / YOUR ARTIST PROFILE</div><h2>Put a face to the name.</h2><div className="cms-avatar-row"><div className="cms-avatar">{profile.avatarUrl ? <Image src={profile.avatarUrl} alt="Your artist avatar" fill unoptimized sizes="104px" /> : <span aria-hidden="true">{profile.name ? profile.name.slice(0, 2).toUpperCase() : "✦"}</span>}</div><div><button type="button" className="cms-button cms-button-secondary" onClick={() => input.current?.click()}>{profile.avatarPath ? "Change avatar" : "Upload avatar"}</button>{profile.avatarPath && <button type="button" className="cms-text-button cms-avatar-remove" onClick={removeAvatar}>Remove</button>}<p className="cms-form-note">PNG, JPG, or WebP. Up to 10 MB.</p></div><input ref={input} type="file" className="cms-sr-only" tabIndex={-1} accept="image/png,image/jpeg,image/webp" onChange={event => void upload(event)} aria-label="Choose artist avatar" /></div>
      {uploading && <div className="cms-upload-progress" role="status"><span>Uploading avatar… {progress}%</span><progress value={progress} max={100} /></div>}
      <div className="cms-form"><label>Artist name <span className="cms-required">*</span><input value={profile.name} onChange={event => update("name", event.target.value)} required maxLength={80} placeholder="Your name in this little world" /><ErrorText values={fieldErrors.name} /></label><label>Your bio<textarea rows={6} value={profile.bio} onChange={event => update("bio", event.target.value)} maxLength={3000} placeholder="What do you make? What makes you curious? Tell visitors a little about yourself." /><small>A short introduction for the about section of your portfolio.</small><ErrorText values={fieldErrors.bio} /></label></div>
    </section><section className="cms-panel cms-form-panel"><div className="cms-section-number">02 / STAY IN TOUCH</div><h2>Leave a way to say hello.</h2><p className="cms-section-intro">These details appear publicly on your portfolio. Leave a field empty to hide it.</p><div className="cms-form"><label>Instagram handle<div className="cms-input-prefix"><span aria-hidden="true">@</span><input value={profile.instagram} onChange={event => update("instagram", event.target.value.replace(/^@/, ""))} placeholder="woxiwaldie" autoComplete="off" /></div><ErrorText values={fieldErrors.instagram} /></label><label>Public contact email<input type="email" value={profile.email} onChange={event => update("email", event.target.value)} placeholder="hello@example.com" autoComplete="email" /><small>This is your public contact address. It does not change your private sign-in account.</small><ErrorText values={fieldErrors.email} /></label></div></section></fieldset>
      <div className="cms-settings-footer"><p className="cms-form-note" aria-live="polite">{dirty ? "You have unsaved profile changes." : "Your profile is up to date."}</p><button className="cms-button" type="submit" disabled={busy || uploading}>{busy ? "Saving profile…" : "Save profile"} <span aria-hidden="true">↗</span></button></div>
    </form><div className="cms-note-strip"><span aria-hidden="true">◈</span><p><strong>Keep your studio private.</strong> Manage the owner’s login and password in your Supabase project.</p><Link href="/setup">Setup guide ↗</Link></div>
  </>;
}
function ErrorText({ values }: { values?: string[] }) { return values?.length ? <span className="cms-field-error">{values.join(" ")}</span> : null; }


