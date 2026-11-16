// Cloudflare Pages adapter: reuse the same authenticated handler as Netlify.
import handler from "../../netlify/functions/platform-me.mjs";
export const onRequest = ({ request, env }) => handler(request, { env });
