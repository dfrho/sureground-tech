import { site } from "@/lib/config/site";

export const dynamic = "force-static";

export function GET() {
  const body = [
    `Contact: mailto:${site.contactEmail}`,
    `Expires: ${site.securityTxtExpires}`,
    `Canonical: ${site.url}/.well-known/security.txt`,
    "Preferred-Languages: en",
    "",
  ].join("\n");

  return new Response(body, {
    headers: { "Content-Type": "text/plain; charset=utf-8" },
  });
}
