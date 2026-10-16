"use client";

import Link from "next/link";
import "./error.css";

export default function PortfolioError({ retry }: { error: Error & { digest?: string }; retry: () => void }) {
  return <main className="portfolio-error" aria-labelledby="portfolio-error-title">
    <Link className="portfolio-error-brand" href="/">✦ ARTVERSE</Link>
    <div className="portfolio-error-card">
      <div className="portfolio-error-pixels" aria-hidden="true">{Array.from({ length: 9 }, (_, index) => <span key={index} />)}</div>
      <p className="portfolio-error-label">A LITTLE PAUSE IN THE ADVENTURE</p>
      <h1 id="portfolio-error-title">This world needs<br />a moment.</h1>
      <p>The gallery couldn’t load right now. Try again in a moment to get back to the artwork.</p>
      <div className="portfolio-error-actions"><button type="button" onClick={retry}>Try again ↻</button><Link href="/">Back to the homepage ↗</Link></div>
    </div>
    <span className="portfolio-error-caption">LITTLE PIXELS. INFINITE POSSIBILITIES.</span>
  </main>;
}
