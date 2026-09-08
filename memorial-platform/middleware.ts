import createMiddleware from "next-intl/middleware";
import { routing } from "./i18n/routing";

export default createMiddleware(routing);

export const config = {
  /**
   * Pages only.
   *
   * `/api` is excluded on purpose: an API answers in the language the caller
   * asks for, and rewriting its path would break every client. `/go` is a set of
   * locale-agnostic marketing short links that redirect on their own, so the
   * intl middleware must not rewrite them to a locale-prefixed path. Static
   * assets and anything with a file extension are excluded so the middleware
   * does not run on images and fonts.
   */
  matcher: "/((?!api|go|_next|_vercel|.*\\..*).*)",
};
