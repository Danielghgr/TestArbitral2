import { createServerClient, type CookieOptions } from "@supabase/ssr";
import { NextResponse, type NextRequest } from "next/server";

export async function middleware(request: NextRequest) {
  let response = NextResponse.next({ request: { headers: request.headers } });

  const supabase = createServerClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
    {
      cookies: {
        get(name: string) {
          return request.cookies.get(name)?.value;
        },
        set(name: string, value: string, options: CookieOptions) {
          response.cookies.set({ name, value, ...options });
        },
        remove(name: string, options: CookieOptions) {
          response.cookies.set({ name, value: "", ...options });
        }
      }
    }
  );

  const {
    data: { user }
  } = await supabase.auth.getUser();

  const path = request.nextUrl.pathname;
  const isProtected =
    path.startsWith("/test") ||
    path.startsWith("/admin") ||
    path.startsWith("/cuenta") ||
    path.startsWith("/mis-resultados");

  if (isProtected && !user) {
    const url = request.nextUrl.clone();
    url.pathname = "/login";
    url.searchParams.set("redirect", path);
    return NextResponse.redirect(url);
  }

  // Comprobación de rol para /admin: admin entra en todo, responsable solo
  // en /admin/resultados, y cualquier otro rol no entra (el layout de /admin
  // vuelve a comprobarlo por si acaso, pero así evitamos un "flash" de contenido).
  if (path.startsWith("/admin") && user) {
    const { data: profile } = await supabase
      .from("profiles")
      .select("rol")
      .eq("id", user.id)
      .single();

    if (profile?.rol === "admin") {
      // acceso completo
    } else if (profile?.rol === "responsable") {
      if (!path.startsWith("/admin/resultados")) {
        const url = request.nextUrl.clone();
        url.pathname = "/admin/resultados";
        return NextResponse.redirect(url);
      }
    } else {
      const url = request.nextUrl.clone();
      url.pathname = "/test";
      return NextResponse.redirect(url);
    }
  }

  return response;
}

export const config = {
  matcher: ["/test/:path*", "/admin/:path*", "/cuenta/:path*", "/mis-resultados/:path*"]
};
