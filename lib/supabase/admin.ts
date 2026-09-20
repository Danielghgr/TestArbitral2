import { createClient as createSupabaseClient } from "@supabase/supabase-js";

// ATENCIÓN: usa la SUPABASE_SERVICE_ROLE_KEY, que se salta la seguridad (RLS).
// Este archivo solo debe importarse desde código que corre en el servidor
// (Route Handlers dentro de app/api/**), nunca desde un Client Component.
export function createAdminClient() {
  return createSupabaseClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.SUPABASE_SERVICE_ROLE_KEY!,
    { auth: { autoRefreshToken: false, persistSession: false } }
  );
}
