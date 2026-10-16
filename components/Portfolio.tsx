"use client";

import { useEffect, useMemo, useRef, useState, type FormEvent } from "react";
import Image from "next/image";
import Link from "next/link";
import dynamic from "next/dynamic";
import { useRouter } from "next/navigation";
import { categories, type Artwork } from "@/data/artworks";
import type { PublicProfile } from "@/lib/cms/public-types";
import Icon from "./Icons";
import "./explore/explore.css";
import "./explore/teaser.css";

function previewImage(artwork: Artwork) {
  return artwork.coverImage.startsWith("/api/media/") ? artwork.frameImage : artwork.coverImage;
}

function ScenePreview() {
  return <div className="scene-preview" aria-hidden="true"><div className="preview-tower" /><div className="preview-platform" /><div className="preview-cube one" /><div className="preview-cube two" /></div>;
}

const DreamScene = dynamic(() => import("./three/DreamScene"), { ssr: false, loading: () => <ScenePreview /> });
const ExploreWorld = dynamic(() => import("./explore/ExploreWorld"), { ssr: false, loading: () => <div className="explorer-route-loading" role="status">Opening the ARTVERSE…</div> });

export default function Portfolio({ artworks, profile }: { artworks: Artwork[]; profile: PublicProfile }) {
  const instagram = profile.instagram;
  const contactHref = instagram || (profile.email ? `mailto:${profile.email}` : null);
  const instagramHandle = instagram ? `@${instagram.replace(/\/$/, "").split("/").pop()}` : null;
  const router = useRouter();
  const [category, setCategory] = useState("All work");
  const [showAll, setShowAll] = useState(false);
  const [view, setView] = useState<"grid" | "world">("grid");
  const [activeNav, setActiveNav] = useState("home");
  const [menuOpen, setMenuOpen] = useState(false);
  const [motionEnabled, setMotionEnabled] = useState(true);
  const [sound, setSound] = useState(false);
  const [character, setCharacter] = useState(0);
  const [copied, setCopied] = useState(false);
  const [handleStatus, setHandleStatus] = useState("");
  const [briefStatus, setBriefStatus] = useState("");
  const worldRef = useRef<HTMLDialogElement>(null);
  const briefRef = useRef<HTMLDialogElement>(null);
  const audioRef = useRef<AudioContext | null>(null);
  const gainRef = useRef<GainNode | null>(null);
  const motionChoice = useRef<boolean | null>(null);
  const [worldOpen, setWorldOpen] = useState(false);
  const characterArtworks = useMemo(() => artworks.filter((art) => art.category === "Characters" || art.category === "Pixel art").slice(0, 2), [artworks]);
  const characterArt = characterArtworks[Math.min(character, characterArtworks.length - 1)];
  const heroArt = artworks.find((art) => art.featured && art.category === "Pixel art") || artworks[0];
  const buddyArt = artworks.find((art) => art.slug !== heroArt?.slug && art.category === "Pixel art") || artworks.find((art) => art.slug !== heroArt?.slug);
  const galleryCategories = useMemo(() => [...new Set([...categories, ...artworks.map((art) => art.category)])], [artworks]);
  const filtered = useMemo(() => category === "All work" ? artworks.filter((art) => showAll || art.featured || !artworks.some((item) => item.featured)) : artworks.filter((art) => art.category === category), [artworks, category, showAll]);
  const worldArtworks = useMemo(() => category === "All work" ? artworks : artworks.filter((art) => art.category === category), [artworks, category]);
  const featuredCount = artworks.filter((art) => art.featured).length || artworks.length;

  useEffect(() => {
    const media = window.matchMedia("(prefers-reduced-motion: reduce)");
    const update = () => { if (motionChoice.current === null) setMotionEnabled(!media.matches); };
    let navFrame = 0;
    const updateNav = () => {
      const threshold = window.innerHeight * 0.35;
      let section = "home";
      for (const id of ["home", "work", "characters", "about", "contact"]) {
        const element = document.getElementById(id);
        if (element && element.getBoundingClientRect().top <= threshold) section = id;
      }
      setActiveNav(section);
    };
    const scheduleNav = () => { cancelAnimationFrame(navFrame); navFrame = requestAnimationFrame(updateNav); };
    const frame = requestAnimationFrame(() => { update(); updateNav(); });
    media.addEventListener("change", update);
    window.addEventListener("scroll", scheduleNav, { passive: true });
    window.addEventListener("resize", scheduleNav);
    return () => { cancelAnimationFrame(frame); cancelAnimationFrame(navFrame); media.removeEventListener("change", update); window.removeEventListener("scroll", scheduleNav); window.removeEventListener("resize", scheduleNav); };
  }, []);

  useEffect(() => {
    document.body.classList.toggle("motion-paused", !motionEnabled);
    return () => document.body.classList.remove("motion-paused");
  }, [motionEnabled]);
  useEffect(() => () => { void audioRef.current?.close(); }, []);

  async function toggleSound() {
    try {
      if (!audioRef.current) {
        const context = new AudioContext();
        const master = context.createGain();
        master.gain.value = 0;
        master.connect(context.destination);
        [130.81, 164.81, 196, 261.63].forEach((frequency, index) => {
          const oscillator = context.createOscillator();
          const voice = context.createGain();
          oscillator.type = "sine";
          oscillator.frequency.value = frequency;
          oscillator.detune.value = index * 3;
          voice.gain.value = 0.2;
          oscillator.connect(voice).connect(master);
          oscillator.start();
        });
        audioRef.current = context;
        gainRef.current = master;
      }
      await audioRef.current.resume();
      gainRef.current?.gain.setTargetAtTime(sound ? 0 : 0.065, audioRef.current.currentTime, 0.4);
      setSound(!sound);
    } catch { setSound(false); }
  }

  function openWorld() { setWorldOpen(true); worldRef.current?.showModal(); }
  function closeWorld() { worldRef.current?.close(); setWorldOpen(false); }
  function selectArtwork(slug: string) { if (!artworks.some((art) => art.slug === slug)) return; closeWorld(); router.push(`/artwork/${slug}`); }
  function browseGallery() {
    closeWorld(); setView("grid"); setShowAll(true); setCategory("All work");
    document.getElementById("work")?.scrollIntoView({ behavior: motionEnabled ? "smooth" : "instant" });
  }
  async function copyHandle() {
    try { await navigator.clipboard.writeText(instagramHandle || profile.email || profile.name); setCopied(true); setHandleStatus("Contact detail copied."); setTimeout(() => { setCopied(false); setHandleStatus(""); }, 2500); }
    catch { setHandleStatus(`Copy manually: ${instagramHandle || profile.email || profile.name}`); }
  }
  async function prepareBrief(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    const data = new FormData(event.currentTarget);
    const text = `Hi ${profile.name}! I’m ${data.get("name")}.\n\nI’d love to collaborate on ${data.get("type")}.\n\n${data.get("details")}\n\nReply to: ${data.get("email")}`;
    try { await navigator.clipboard.writeText(text); setBriefStatus(`Brief copied! ${instagram ? `Paste it into an Instagram message to ${instagramHandle}.` : profile.email ? `Email it to ${profile.email}.` : "Save it until you’re ready to get in touch."}`); }
    catch { setBriefStatus(`Your brief is ready. Copy it below:\n\n${text}`); }
  }

  return <>
    <a className="skip-link" href="#work">Skip to artwork</a>
    <header className="site-header">
      <Link className="brand" href="/" aria-label="ARTVERSE home"><span className="brand-mark"><Icon name="cube" /></span>ARTVERSE<span className="brand-dot">/ {profile.name.slice(0, 1).toUpperCase()}.</span></Link>
      <nav className={menuOpen ? "main-nav is-open" : "main-nav"} aria-label="Main navigation">
        {[ ["home", "Home"], ["work", "Work"], ["characters", "Characters"], ["about", "About"] ].filter(([id]) => id !== "characters" || characterArtworks.length > 0).map(([id, label]) => <a key={id} href={`#${id}`} onClick={() => setMenuOpen(false)} className={activeNav === id ? "active" : ""}>{label}{activeNav === id && <span className="nav-dot" />}</a>)}
      </nav>
      <a className="header-contact" href="#contact">Let’s talk <Icon name="diagonal" width="15" height="15" /></a>
      <button className="menu-toggle icon-button" aria-label={menuOpen ? "Close menu" : "Open menu"} aria-expanded={menuOpen} onClick={() => setMenuOpen(!menuOpen)}><Icon name={menuOpen ? "close" : "menu"} /></button>
    </header>

    <main>
      <section className="hero" id="home" aria-labelledby="hero-title">
        <div className="hero-grid" />
        <div className="hero-copy">
          <div className="eyebrow hero-eyebrow"><span className="tiny-spark">+</span> PLAYER 01 / {profile.name.toUpperCase()}</div>
          <h1 id="hero-title">A little pixel.<br />A whole<br /><span className="heading-three">new world<span className="title-star">✦</span>.</span></h1>
          <p>Welcome to my imagination. A playful collision<br />of pixel art, painted stories, and impossible places.</p>
          <div className="hero-actions"><a className="button lime" href="#work">Enter the portfolio <Icon name="arrow" /></a><button className="button glass" onClick={openWorld}><Icon name="cube" /> Explore in 3D</button></div>
          <div className="artist-note">{profile.avatarUrl && <span className="artist-avatar"><Image src={profile.avatarUrl} alt="" fill sizes="80px" unoptimized style={profile.avatarUrl.startsWith("/api/media/") ? { objectFit: "cover", transform: "none" } : undefined} /></span>}<span><strong>Hey, I’m {profile.name}.</strong><br />2D artist. Pixel enthusiast. World builder.</span></div>
        </div>
        <div className="hero-scene" aria-label="Interactive floating artwork installation"><DreamScene artworks={artworks} motionEnabled={motionEnabled && !worldOpen} onSelectArtwork={selectArtwork} /></div>
        <div className="scene-label"><span className="scene-indicator" /><span>WORLD 01 / PIXEL DAYDREAM</span><Icon name="cube" width="14" height="14" /></div>
        <div className="scene-caption"><span className="caption-line" /><span className="scene-caption-title">[ {heroArt?.title || "A WORLD IN THE MAKING"} ]</span><br /><span>Made of pixels. Full of personality.</span></div>
        <div className="hero-bottom"><a href="#work" className="scroll-hint"><span className="scroll-circle"><Icon name="down" width="15" height="15" /></span>SCROLL TO GET CURIOUS</a><div className="scene-controls"><span>MAKE YOURSELF AT HOME</span><button className="icon-button" onClick={toggleSound} aria-label={sound ? "Mute ambient sound" : "Enable ambient sound"} aria-pressed={sound}><Icon name={sound ? "volume" : "mute"} width="17" height="17" /></button><button className="icon-button" onClick={() => { motionChoice.current = !motionEnabled; setMotionEnabled(!motionEnabled); }} aria-label={motionEnabled ? "Pause animations" : "Play animations"} aria-pressed={!motionEnabled}><Icon name={motionEnabled ? "pause" : "play"} width="16" height="16" /></button></div></div>
      </section>
      <div className="discipline-strip" aria-label="Creative disciplines"><span>CHARACTER DESIGN</span><span className="strip-star">✳</span><span>PIXEL ART</span><span className="strip-star">✳</span><span>VISUAL STORYTELLING</span><span className="strip-star">✳</span><span>A LITTLE BIT OF MAGIC</span><span className="strip-star">✳</span></div>

      <section className="work-section page-section" id="work" aria-labelledby="work-title">
        <div className="section-top"><div><div className="eyebrow section-eyebrow"><span className="section-number">01 /</span> SELECTED WORK</div><h2 id="work-title">Small details. <span className="serif-word">Big ideas.</span></h2></div><button className="text-link all-work" onClick={() => { setShowAll(!showAll); setCategory("All work"); setView("grid"); }}>{showAll ? "Selected work" : "View all work"} <span className="count-badge">{String(showAll ? featuredCount : artworks.length).padStart(2, "0")}</span><Icon name="diagonal" width="16" height="16" /></button></div>
        <div className="work-toolbar"><div className="category-tabs" aria-label="Filter artwork"><button onClick={() => setCategory("All work")} aria-pressed={category === "All work"} className={category === "All work" ? "selected" : ""}>All work <span>{String(view === "world" || showAll ? artworks.length : featuredCount).padStart(2, "0")}</span></button>{galleryCategories.map((item) => <button key={item} onClick={() => setCategory(item)} aria-pressed={category === item} className={category === item ? "selected" : ""}>{item}</button>)}</div><div className="view-switch" aria-label="Gallery view"><button className={view === "grid" ? "selected" : ""} aria-label="Grid view" aria-pressed={view === "grid"} onClick={() => setView("grid")}><Icon name="grid" width="16" height="16" /></button><button className={view === "world" ? "selected" : ""} aria-label="3D world view" aria-pressed={view === "world"} onClick={() => setView("world")}><Icon name="cube" width="16" height="16" /></button></div></div>
        {view === "world" && !worldOpen && worldArtworks.length > 0 && <div className="gallery-world-exhibit"><ExploreWorld key={category} artworks={worldArtworks} motionEnabled={motionEnabled} onBrowseGallery={browseGallery} /></div>}
        <div className={`artwork-grid ${view === "world" ? "compact" : ""}`} aria-live="polite">{!filtered.length && <p>No artwork in this collection yet. A new world is taking shape.</p>}{filtered.map((art, index) => <Link href={`/artwork/${art.slug}`} className={`art-card art-card-${art.slug}`} key={art.slug}><div className="art-card-image" style={{ backgroundColor: art.color }}><Image src={previewImage(art)} alt={art.alt} fill sizes="(max-width: 640px) 94vw, (max-width: 1000px) 46vw, 31vw" unoptimized={art.category === "Pixel art" || art.coverImage.startsWith("/api/media/")} /><span className="art-index">{String(index + 1).padStart(2, "0")}</span><span className="art-open"><Icon name="diagonal" /></span><span className="art-type">{art.tags[0]}</span></div><div className="art-card-info"><div><h3>{art.title}</h3><p>{art.category} <span>·</span> Original artwork</p></div>{art.year && <span className="art-year">{art.year}</span>}</div></Link>)}</div>
        <div className="gallery-footnote"><span className="green-dot" /> Pixels, paintings, and peculiar little ideas.<span className="sample-note">ALL WORK BY {profile.name.toUpperCase()} ↗</span></div>
        <div className="exhibition-teaser">
          <div className="exhibition-teaser-art" aria-hidden="true"><div className="teaser-glass-steps">{[0, 1, 2, 3].map((step) => <i key={step} />)}</div><span className="teaser-crystal teaser-crystal-lime" /><span className="teaser-crystal teaser-crystal-pink" />{heroArt && <div className="teaser-frame teaser-frame-character"><Image src={heroArt.frameImage} alt="" fill sizes="170px" unoptimized /></div>}{buddyArt && <div className="teaser-frame teaser-frame-buddy"><Image src={buddyArt.frameImage} alt="" fill sizes="100px" unoptimized /></div>}<span className="teaser-world-number">WORLD 01</span></div>
          <div className="exhibition-teaser-copy"><span className="eyebrow"><Icon name="cube" width="14" height="14" /> AN INTERACTIVE EXHIBITION</span><h3>A gallery <span className="serif-word">without walls.</span></h3><p>Step inside a pixel daydream. Float between the artwork, follow your curiosity, and get lost in the little details.</p><div><button className="button blue" onClick={openWorld}>Explore in 3D <Icon name="arrow" width="17" height="17" /></button><span>{String(artworks.length).padStart(2, "0")} ARTWORKS / ONE LITTLE UNIVERSE</span></div></div>
        </div>
      </section>

      {characterArt && <section className="character-section page-section" id="characters" aria-labelledby="character-title">
        <div className="character-art" onPointerMove={(event) => { if (!motionEnabled) return; const rect = event.currentTarget.getBoundingClientRect(); event.currentTarget.style.setProperty("--pointer-x", `${(event.clientX - rect.left - rect.width / 2) / 38}deg`); event.currentTarget.style.setProperty("--pointer-y", `${-(event.clientY - rect.top - rect.height / 2) / 38}deg`); }} onPointerLeave={(event) => { event.currentTarget.style.setProperty("--pointer-x", "0deg"); event.currentTarget.style.setProperty("--pointer-y", "0deg"); }}><div className="character-image"><Image src={previewImage(characterArt)} alt={characterArt.alt} fill sizes="(max-width: 760px) 90vw, 45vw" unoptimized={characterArt.category === "Pixel art" || characterArt.coverImage.startsWith("/api/media/")} /><span className="character-image-label">CHARACTER FILE / {String(Math.min(character, characterArtworks.length - 1) + 1).padStart(3, "0")}</span></div><span className="character-floating-tag"><Icon name="spark" width="14" height="14" /> EVERY CHARACTER HAS A STORY</span></div>
        <div className="character-copy"><div className="eyebrow"><span className="section-number">02 /</span> MEET THE CHARACTERS</div><h2 id="character-title">More than pixels.<br />A little <span className="serif-word">personality.</span></h2><p>Every character starts with a spark, and ends up with a world of their own.</p><div className="character-selector" aria-label="Choose a character">{characterArtworks.map((art, i) => <button key={art.slug} aria-pressed={character === i} onClick={() => setCharacter(i)} className={character === i ? "selected" : ""}><span className="selector-thumb"><Image src={previewImage(art)} alt="" fill sizes="46px" unoptimized /></span><span>{art.title}<small>{art.category}</small></span><Icon name="arrow" width="16" height="16" /></button>)}</div><Link className="text-link" href={`/artwork/${characterArt.slug}`}>Discover this character <Icon name="diagonal" width="16" height="16" /></Link></div>
      </section>}

      <section className="about-section page-section" id="about" aria-labelledby="about-title"><div className="about-title-block"><div className="eyebrow"><span className="section-number">03 /</span> BEHIND THE PIXELS</div><h2 id="about-title">Hi, I’m <span className="serif-word">{profile.name}.</span><br />Curiosity is my superpower.</h2><div className="about-doodle" aria-hidden="true">{profile.avatarUrl && <Image src={profile.avatarUrl} alt="" width={140} height={140} unoptimized />}<span>always imagining.</span></div></div><div className="about-description"><p>{profile.bio}</p><p>ARTVERSE is my space between the digital and the hand-drawn. From electric blue pixel adventures to warm, painterly portraits — there’s always another story to explore.</p><div className="skill-tags"><span>Pixel art</span><span>Character design</span><span>Digital painting</span><span>Visual storytelling</span></div>{instagram && <a className="text-link" href={instagram} target="_blank" rel="noopener noreferrer">More from my sketchbook <Icon name="instagram" width="17" height="17" /></a>}</div></section>

      <section className="contact-section" id="contact" aria-labelledby="contact-title"><div className="contact-orbit" aria-hidden="true" /><div className="eyebrow"><span className="green-dot" /> OPEN TO NEW POSSIBILITIES</div><h2 id="contact-title">Have a world in mind?<br />Let’s <span className="serif-word">dream it up.</span></h2><p>For collaborations, commissions, or just a friendly hello.</p><div className="contact-actions">{contactHref && <a className="button lime" href={contactHref} target={instagram ? "_blank" : undefined} rel={instagram ? "noopener noreferrer" : undefined}>{instagram ? "Let’s talk on Instagram" : "Let’s talk by email"} <Icon name="diagonal" width="18" height="18" /></a>}<button className="button dark-outline" onClick={() => { setBriefStatus(""); briefRef.current?.showModal(); }}>Prepare a project brief <Icon name="arrow" width="18" height="18" /></button></div>{(instagramHandle || profile.email) && <button className="copy-handle" onClick={copyHandle}><Icon name="instagram" width="15" height="15" /> {copied ? "Copied!" : instagramHandle || profile.email}<Icon name="copy" width="13" height="13" /></button>}{instagram && profile.email && <a className="copy-handle" href={`mailto:${profile.email}`} style={{ overflowWrap: "anywhere" }}>Email: {profile.email} ↗</a>}<span className="handle-status" role="status">{handleStatus}</span></section>
    </main>

    <footer className="site-footer"><Link className="brand" href="/"><span className="brand-mark"><Icon name="cube" /></span>ARTVERSE</Link><p>Little pixels. Infinite worlds.</p><span>© 2026 {profile.name}</span><a href="#home" className="text-link">Back to the top <Icon name="diagonal" width="14" height="14" /></a></footer>

    <dialog className="exhibition-dialog" ref={worldRef} aria-label="Explore the ARTVERSE in 3D" onCancel={(event) => { if (event.target === event.currentTarget && artworks.length) event.preventDefault(); }} onClose={(event) => { if (event.target === event.currentTarget) setWorldOpen(false); }}>{worldOpen && (artworks.length ? <ExploreWorld artworks={artworks} fullScreen motionEnabled={motionEnabled} soundEnabled={sound} onToggleSound={toggleSound} onClose={closeWorld} onBrowseGallery={browseGallery} /> : <div className="explorer-route-loading"><h2>The next world is taking shape.</h2><p>New artwork will appear here soon.</p><button className="button blue" onClick={closeWorld} autoFocus>Back to the portfolio ↗</button></div>)}</dialog>
    <dialog ref={briefRef} className="brief-dialog" aria-labelledby="brief-dialog-title"><div className="brief-header"><span className="eyebrow">LET’S MAKE SOMETHING</span><button className="icon-button" aria-label="Close project brief" onClick={() => briefRef.current?.close()}><Icon name="close" /></button></div><h2 id="brief-dialog-title">A little idea.<br />A new beginning.</h2><p>Put your idea into words, then copy your brief to get the conversation started.</p><form onSubmit={prepareBrief}><label>Your name<input name="name" required maxLength={100} placeholder="How should I call you?" autoComplete="name" /></label><label>Your email<input type="email" name="email" required maxLength={200} placeholder="you@example.com" autoComplete="email" /></label><label>What are we imagining?<select name="type"><option>Pixel art</option><option>Character design</option><option>Illustration</option><option>A creative collaboration</option></select></label><label>A few details<textarea name="details" required minLength={10} maxLength={5000} placeholder="Tell me about the project, timeline, and budget…" rows={4} /></label><button type="submit" className="button lime">Copy project brief <Icon name="copy" width="17" height="17" /></button></form><p className="brief-status" role="status">{briefStatus}</p>{contactHref && <a href={contactHref} target={instagram ? "_blank" : undefined} rel={instagram ? "noopener noreferrer" : undefined} className="text-link">{instagram ? "Open Instagram" : "Open email"} <Icon name="diagonal" width="15" height="15" /></a>}</dialog>
  </>;
}

