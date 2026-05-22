import { type NextRequest, NextResponse } from "next/server";
import { createServerClient, type CookieOptions } from "@supabase/ssr";

/**
 * Supabase session refresh middleware.
 *
 * Today: refreshes the Supabase auth cookie on every request, leaving routes
 * fully accessible. The login UI doesn't exist yet, so gating /dashboard would
 * lock everyone out.
 *
 * When the login UI lands, uncomment the redirect block below to enforce auth
 * on the protected paths.
 */
export async function middleware(req: NextRequest) {
  const res = NextResponse.next({ request: req });

  if (!process.env.NEXT_PUBLIC_SUPABASE_URL || !process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY) {
    return res; // Supabase not configured — pass through.
  }

  const supabase = createServerClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY,
    {
      cookies: {
        get(name: string) {
          return req.cookies.get(name)?.value;
        },
        set(name: string, value: string, options: CookieOptions) {
          res.cookies.set({ name, value, ...options });
        },
        remove(name: string, options: CookieOptions) {
          res.cookies.set({ name, value: "", ...options });
        },
      },
    },
  );

  // Refresh expired session cookies. Side effect: writes new cookie via `set`.
  await supabase.auth.getUser();

  // --- Enforcement block — enable when /login exists -----------------------
  // const { data: { user } } = await supabase.auth.getUser();
  // const protectedRoute =
  //   req.nextUrl.pathname.startsWith("/dashboard") ||
  //   req.nextUrl.pathname.startsWith("/stock");
  // if (!user && protectedRoute) {
  //   const url = req.nextUrl.clone();
  //   url.pathname = "/login";
  //   url.searchParams.set("next", req.nextUrl.pathname);
  //   return NextResponse.redirect(url);
  // }

  return res;
}

export const config = {
  matcher: ["/((?!_next/static|_next/image|favicon.ico|.*\\.(?:svg|png|jpg|jpeg|ico)$).*)"],
};
