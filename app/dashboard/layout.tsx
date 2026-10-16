import { Suspense, type ReactNode } from "react";
import { redirect } from "next/navigation";
import { connection } from "next/server";
import type { Metadata } from "next";
import { getOwnerSession } from "@/lib/cms/auth";
import DashboardShell from "@/components/dashboard/DashboardShell";
import "@/components/dashboard/dashboard.css";

export const metadata: Metadata = { title: "Artist studio", robots: { index: false, follow: false } };
async function OwnerWorkspace({ children }: { children: ReactNode }) {
  await connection();
  const session = await getOwnerSession();
  if (!session) redirect("/login");
  return <DashboardShell>{children}</DashboardShell>;
}
export default function DashboardLayout({ children }: { children: ReactNode }) {
  return <Suspense fallback={<div className="cms-route-loading" role="status"><span className="cms-eyebrow">ARTVERSE / PRIVATE STUDIO</span><p>Opening your workspace…</p></div>}><OwnerWorkspace>{children}</OwnerWorkspace></Suspense>;
}
