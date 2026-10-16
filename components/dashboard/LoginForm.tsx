"use client";

import Link from "next/link";
import { useRouter } from "next/navigation";
import { useState, type FormEvent } from "react";
import { cmsRequest, errorMessage } from "./types";
import "./dashboard.css";

export default function LoginForm({ configured }: { configured: boolean }) {
  const router = useRouter();
  const [email, setEmail] = useState(""); const [password, setPassword] = useState("");
  const [busy, setBusy] = useState(false); const [error, setError] = useState("");
  const [showPassword, setShowPassword] = useState(false);
  async function submit(event: FormEvent) {
    event.preventDefault(); setBusy(true); setError("");
    try { await cmsRequest("/api/auth/login", { method: "POST", body: JSON.stringify({ email, password }) }); router.replace("/dashboard"); router.refresh(); }
    catch (cause) { setError(errorMessage(cause)); setBusy(false); }
  }
  return <main className="cms-login">
    <Link href="/" className="cms-wordmark">ARTVERSE<span>BACK TO THE PORTFOLIO ↗</span></Link>
    <div className="cms-login-wrap"><div className="cms-login-art" aria-hidden="true"><div className="cms-pixel-window"><span>YOUR NEXT LITTLE WORLD</span><div className="cms-pixel-face"><i /><i /><b>⌣</b></div><div className="cms-pixel-dot" /></div><span className="cms-login-spark cms-spark-one">✦</span><span className="cms-login-spark cms-spark-two">✦</span><span className="cms-art-label">LESS ADMIN. MORE CREATING.</span></div>
      <section className="cms-login-card"><p className="cms-eyebrow">THE ARTIST ENTRANCE</p><h1>Welcome to<br />your studio.</h1><p className="cms-intro">A little room to care for your work, share new worlds, and make this portfolio yours.</p>
        {!configured ? <div className="cms-setup-note"><span className="cms-status">SETUP NEEDED</span><h2>Connect your studio first.</h2><p>Add your Supabase project and owner account to enable private sign-in. Your public portfolio is still available.</p><Link href="/setup" className="cms-button">Supabase setup guide <span aria-hidden="true">↗</span></Link></div> : <form onSubmit={submit} className="cms-form">
          <label>Email address<input name="email" type="email" autoComplete="username" required value={email} onChange={e => setEmail(e.target.value)} placeholder="you@example.com" disabled={busy} /></label>
          <div><label htmlFor="cms-login-password">Password</label><div className="cms-password"><input id="cms-login-password" name="password" type={showPassword ? "text" : "password"} autoComplete="current-password" required value={password} onChange={e => setPassword(e.target.value)} disabled={busy} /><button type="button" onClick={() => setShowPassword(!showPassword)} aria-label={showPassword ? "Hide password" : "Show password"}>{showPassword ? "Hide" : "Show"}</button></div></div>
          {error && <p className="cms-message cms-error" role="alert">{error}</p>}
          <button type="submit" className="cms-button cms-login-submit" disabled={busy}>{busy ? "Opening your studio…" : "Enter the studio"}<span aria-hidden="true">→</span></button>
          <p className="cms-form-note">Private access for the portfolio owner. Need help connecting your account? <Link href="/setup">Open the setup guide ↗</Link>. To reset your password, use your Supabase project’s owner account controls.</p>
        </form>}
      </section></div><p className="cms-login-foot">YOUR ART. YOUR SPACE. YOUR PACE.</p>
  </main>;
}
