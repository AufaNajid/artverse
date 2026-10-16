import { unstable_rethrow } from "next/navigation";
import { NextResponse } from "next/server";
import { ZodError } from "zod";

import { CmsError } from "./cms-error";
export { CmsError } from "./cms-error";

export function apiError(error: unknown) {
  unstable_rethrow(error);
  const headers = { "Cache-Control": "private, no-store" };
  if (error instanceof CmsError) return NextResponse.json({ error: error.message, ...(error.fieldErrors ? { fieldErrors: error.fieldErrors } : {}) }, { status: error.status, headers });
  if (error instanceof ZodError) {
    const fieldErrors: Record<string, string[]> = {};
    for (const issue of error.issues) (fieldErrors[String(issue.path[0] ?? "form")] ??= []).push(issue.message);
    return NextResponse.json({ error: "Please check the highlighted fields.", fieldErrors }, { status: 400, headers });
  }
  if (typeof error === "object" && error !== null && "code" in error && error.code === "P2034") return NextResponse.json({ error: "The artwork changed in another request. Refresh it before saving again." }, { status: 409, headers });
  if (typeof error === "object" && error !== null && "code" in error && error.code === "P2002") return NextResponse.json({ error: "That slug is already in use.", fieldErrors: { slug: ["Choose a different slug."] } }, { status: 409, headers });
  // Never return database, storage, credentials, or provider error details to a browser.
  console.error("CMS request failed", error instanceof Error ? error.name : "UnknownError");
  return NextResponse.json({ error: "The portfolio service is unavailable. Please try again after checking the setup.", }, { status: 503, headers });
}

export function privateJson(body: unknown, status = 200) {
  return NextResponse.json(body, { status, headers: { "Cache-Control": "private, no-store" } });
}
