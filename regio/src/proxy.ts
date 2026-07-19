import { NextRequest, NextResponse } from "next/server";

// One-shot signal consumed by LanguageContext on the next load; must match STORAGE_KEY there.
const LANGUAGE_COOKIE = "regio_language";

// Locale entry paths (e.g. app.regio.is/de) map to a frontend language code.
const PATH_TO_LANGUAGE: Record<string, string> = {
  en: "EN",
  de: "DE",
  hu: "HU",
};

export function proxy(request: NextRequest) {
  const locale = request.nextUrl.pathname.replace(/^\/+/, "").toLowerCase();
  const language = PATH_TO_LANGUAGE[locale];
  if (!language) return NextResponse.next();

  const response = NextResponse.redirect(new URL("/", request.url));
  response.cookies.set(LANGUAGE_COOKIE, language, {
    path: "/",
    maxAge: 60,
    sameSite: "lax",
  });
  return response;
}

export const config = {
  matcher: ["/en", "/de", "/hu", "/EN", "/DE", "/HU"],
};
