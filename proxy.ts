import { createServerClient } from "@supabase/ssr";
import { NextResponse, type NextRequest } from "next/server";
import { cmsConfiguration, hasCmsConfiguration } from "@/lib/cms/config";

export async function proxy(request: NextRequest) {
  let response = NextResponse.next({ request });
  response.headers.set("Cache-Control", "private, no-store");
  if (!hasCmsConfiguration()) return response;
  const config = cmsConfiguration();
  const client = createServerClient(config.url, config.key, {
    cookieOptions: { httpOnly: true, sameSite: "lax", secure: process.env.NODE_ENV === "production", path: "/" },
    cookies: {
      getAll: () => request.cookies.getAll(),
      setAll: (items) => {
        items.forEach(({ name, value }) => request.cookies.set(name, value));
        response = NextResponse.next({ request });
        items.forEach(({ name, value, options }) => response.cookies.set(name, value, options));
        response.headers.set("Cache-Control", "private, no-store");
      },
    },
  });
  // This refresh is convenience only. Every private page and API verifies getUser again.
  try { await client.auth.getUser(); } catch { /* Route authentication fails closed. */ }
  return response;
}

export const config = { matcher: ["/dashboard/:path*", "/login", "/api/auth/:path*", "/api/artworks/:path*", "/api/uploads/:path*", "/api/profile/:path*", "/api/media/:path*", "/api/storage/:path*"] };
