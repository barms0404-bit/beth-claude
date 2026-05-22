import { createBrowserClient, createServerClient } from "@supabase/ssr";
import { cookies } from "next/headers";

/**
 * Browser client — call inside Client Components.
 * Reads the anon key from NEXT_PUBLIC_* env vars (safe to expose).
 */
export function supabaseBrowser() {
  return createBrowserClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
  );
}

/**
 * Server client — call inside Server Components / Route Handlers.
 * Sessions are read from the cookie jar; writes are silent here because
 * Server Components can't mutate cookies — the middleware does that.
 */
export function supabaseServer() {
  const cookieStore = cookies();
  return createServerClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
    {
      cookies: {
        get: (name: string) => cookieStore.get(name)?.value,
        set: () => {
          /* mutated by middleware, not here */
        },
        remove: () => {
          /* mutated by middleware, not here */
        },
      },
    },
  );
}
