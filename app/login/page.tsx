import type { Metadata } from "next";
import { Suspense } from "react";
import { connection } from "next/server";
import LoginForm from "@/components/dashboard/LoginForm";
import { hasCmsConfiguration } from "@/lib/cms/config";

export const metadata: Metadata = { title: "Artist sign in", robots: { index: false, follow: false } };
async function RuntimeLogin() {
  await connection();
  return <LoginForm configured={hasCmsConfiguration()} />;
}
export default function LoginPage() {
  return <Suspense fallback={<div className="cms-route-loading" role="status"><span className="cms-eyebrow">ARTVERSE / PRIVATE STUDIO</span><p>Opening your studio…</p></div>}><RuntimeLogin /></Suspense>;
}
