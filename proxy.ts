import { createServerClient } from "@supabase/ssr";
import type { SupabaseClient } from "@supabase/supabase-js";
import { NextResponse, type NextRequest } from "next/server";

// 先用 getClaims() 驗證 session；若失敗（例如專案仍使用舊式 HS256 JWT 密鑰，
// 或 JWKS 無法取得），改向 Supabase Auth 伺服器以 getUser() 驗證，避免登入成功後
// 又被誤判為未登入而導回 /login。
async function isSessionValid(
  supabase: SupabaseClient,
  request: NextRequest,
): Promise<boolean> {
  const { data, error } = await supabase.auth.getClaims();
  if (!error && typeof data?.claims?.sub === "string") return true;

  const { data: userData, error: userError } = await supabase.auth.getUser();
  if (!userError && userData.user) return true;

  const hasSessionCookie = request.cookies
    .getAll()
    .some((cookie) => cookie.name.startsWith("sb-"));
  if (hasSessionCookie && process.env.NODE_ENV !== "production") {
    console.error("[proxy] 已有 Supabase cookie 但驗證失敗：", {
      getClaims: error?.message,
      getUser: userError?.message,
    });
  }
  return false;
}

export async function proxy(request: NextRequest) {
  let supabaseResponse = NextResponse.next({ request });
  const supabase = createServerClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY!,
    {
      cookies: {
        getAll() {
          return request.cookies.getAll();
        },
        setAll(cookiesToSet) {
          cookiesToSet.forEach(({ name, value }) => {
            request.cookies.set(name, value);
          });
          supabaseResponse = NextResponse.next({ request });
          cookiesToSet.forEach(({ name, value, options }) => {
            supabaseResponse.cookies.set(name, value, options);
          });
        },
      },
    },
  );

  const isAuthenticated = await isSessionValid(supabase, request);
  const pathname = request.nextUrl.pathname;
  const isAuthPage = pathname === "/login" || pathname === "/register";
  const isCallback = pathname === "/auth/callback";

  if (!isAuthenticated && !isAuthPage && !isCallback) {
    const response = NextResponse.redirect(new URL("/login", request.url));
    supabaseResponse.cookies.getAll().forEach((cookie) => {
      response.cookies.set(cookie.name, cookie.value, cookie);
    });
    return response;
  }

  if (isAuthenticated && isAuthPage) {
    const response = NextResponse.redirect(new URL("/", request.url));
    supabaseResponse.cookies.getAll().forEach((cookie) => {
      response.cookies.set(cookie.name, cookie.value, cookie);
    });
    return response;
  }

  return supabaseResponse;
}

export const config = {
  matcher: ["/((?!api|_next/static|_next/image|favicon.ico).*)"],
};