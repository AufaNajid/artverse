import Link from "next/link";

export default function NotFound() {
  return <main className="not-found-page"><span className="eyebrow">WORLD NOT FOUND / 404</span><h1>Wrong portal.<br />Same imagination.</h1><p>This little corner of the universe doesn’t exist yet.</p><Link className="button lime" href="/">Back to ARTVERSE →</Link></main>;
}
