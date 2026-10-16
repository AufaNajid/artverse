"use client";

import Link from "next/link";
import { usePathname, useRouter } from "next/navigation";
import { useState, type ReactNode } from "react";
import { cmsRequest, errorMessage } from "./types";
import "./dashboard.css";

export default function DashboardShell({ children }: { children: ReactNode }) {
  const pathname = usePathname();
  const router = useRouter();
  const [loggingOut, setLoggingOut] = useState(false);
  const [error, setError] = useState("");
  async function logout() {
    setLoggingOut(true); setError("");
    try { await cmsRequest("/api/auth/logout", { method: "POST" }); router.replace("/login"); router.refresh(); }
    catch (cause) { setError(errorMessage(cause)); setLoggingOut(false); }
  }
  return <div className="cms-app">
    <a className="cms-skip" href="#dashboard-content">Skip to content</a>
    <aside className="cms-sidebar">
      <Link href="/dashboard" className="cms-wordmark">ARTVERSE<span>ARTIST STUDIO / PRIVATE</span></Link>
      <nav aria-label="Studio navigation">
        {[{ href: "/dashboard", icon: "◈", label: "Overview" }, { href: "/dashboard/artworks", icon: "▦", label: "Artworks" }, { href: "/dashboard/settings", icon: "✳", label: "Profile & settings" }].map(item => {
          const active = item.href === "/dashboard" ? pathname === item.href : pathname.startsWith(item.href);
          return <Link key={item.href} href={item.href} aria-current={active ? "page" : undefined} className={active ? "is-active" : ""}><span aria-hidden="true">{item.icon}</span>{item.label}<span aria-hidden="true" className="cms-nav-arrow">↗</span></Link>;
        })}
      </nav>
      <div className="cms-sidebar-bottom"><span className="cms-private"><i /> A space for your next idea</span><Link href="/" target="_blank" rel="noopener noreferrer">View portfolio <span aria-hidden="true">↗</span></Link><button onClick={logout} disabled={loggingOut}>{loggingOut ? "Signing out…" : "Sign out"}<span aria-hidden="true">↪</span></button>{error && <p className="cms-error" role="alert">{error}</p>}</div>
    </aside>
    <div className="cms-main"><header className="cms-topbar"><span><i /> OWNER WORKSPACE</span><Link href="/dashboard/artworks/new" className="cms-button cms-button-small">＋ New artwork</Link></header><main id="dashboard-content" className="cms-content">{children}</main><footer className="cms-footer"><span>Made of pixels. Managed by you.</span><span>ARTVERSE / STUDIO</span></footer></div>
  </div>;
}
