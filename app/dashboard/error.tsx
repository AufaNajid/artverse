"use client";
import Link from "next/link";
export default function DashboardError({ reset }: { reset: () => void }) { return <div className="cms-empty"><span aria-hidden="true">✳</span><h2>Your studio needs a moment.</h2><p>We couldn’t load this page. Please try again or check the Supabase connection.</p><div className="cms-actions"><button className="cms-button" onClick={reset}>Try again</button><Link href="/setup" className="cms-button cms-button-secondary">Setup guide</Link></div></div>; }
