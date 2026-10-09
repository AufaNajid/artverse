import Link from "next/link";

export default function ArtworkLoading() {
  return (
    <div className="artwork-detail artwork-loading" aria-busy="true">
      <header className="artwork-header">
        <Link href="/" className="artwork-wordmark" aria-label="ARTVERSE home">
          <svg aria-hidden="true" width="28" height="28" viewBox="0 0 28 28"><path d="M11 2h6v7h2v2h7v6h-7v2h-2v7h-6v-7H9v-2H2v-6h7V9h2Z" fill="currentColor" /></svg>
          ARTVERSE
        </Link>
        <Link href="/#work" className="artwork-back">← Back to the good stuff</Link>
      </header>
      <main className="artwork-main">
        <section className="artwork-intro" aria-labelledby="artwork-loading-title">
          <div className="artwork-kicker"><span>SELECTED WORK / WOXIWALDIE</span></div>
          <h1 id="artwork-loading-title">Opening the artwork<span className="artwork-title-dot">.</span></h1>
          <p className="artwork-loading-status" role="status">A few pixels are falling into place…</p>
        </section>
        <div className="artwork-loading-image" aria-hidden="true"><span>LOADING ARTWORK<span className="artwork-loading-dots">…</span></span></div>
        <div className="artwork-loading-lines" aria-hidden="true"><span /><span /><span /></div>
      </main>
    </div>
  );
}
