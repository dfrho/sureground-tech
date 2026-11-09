import { describe, expect, it } from "vitest";

import { GET } from "@/app/.well-known/security.txt/route";
import { site } from "@/lib/config/site";

describe("security.txt", () => {
  it("lists the contact and an Expires date", async () => {
    const text = await GET().text();
    expect(text).toContain("Contact: mailto:david@sureground.tech");
    expect(text).toMatch(/^Expires: \d{4}-\d{2}-\d{2}T/m);
  });

  it("has an Expires date at least 30 days away and at most a year out (RFC 9116)", () => {
    const expires = new Date(site.securityTxtExpires).getTime();
    const day = 24 * 60 * 60 * 1000;
    expect(expires - Date.now()).toBeGreaterThan(30 * day);
    expect(expires - Date.now()).toBeLessThanOrEqual(366 * day);
  });
});
