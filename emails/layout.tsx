import type { ReactNode } from "react";

import { site } from "@/lib/config/site";

/**
 * Shared email shell. Plain table markup rendered by @react-email/render,
 * brand palette in light mode, no images and no tracking pixels.
 */
export const emailColors = {
  bg: "#F2F2EF",
  surface: "#FFFFFF",
  text: "#0E1116",
  muted: "#4A5261",
  border: "#D9DBD3",
  link: "#2A55CC",
} as const;

const font = "'IBM Plex Sans', 'Helvetica Neue', Arial, sans-serif";

export function EmailLayout({ preview, children }: { preview: string; children?: ReactNode }) {
  return (
    <html lang="en">
      {/* eslint-disable-next-line @next/next/no-head-element -- email HTML, not a Next.js page */}
      <head>
        <meta httpEquiv="Content-Type" content="text/html; charset=UTF-8" />
        <meta name="color-scheme" content="light" />
      </head>
      <body style={{ margin: 0, padding: 0, background: emailColors.bg, fontFamily: font }}>
        <div style={{ display: "none", maxHeight: 0, overflow: "hidden" }}>{preview}</div>
        <table role="presentation" width="100%" cellPadding={0} cellSpacing={0}>
          <tbody>
            <tr>
              <td align="center" style={{ padding: "24px 12px" }}>
                <table
                  role="presentation"
                  width="100%"
                  cellPadding={0}
                  cellSpacing={0}
                  style={{
                    maxWidth: 600,
                    background: emailColors.surface,
                    border: `1px solid ${emailColors.border}`,
                    borderRadius: 10,
                  }}
                >
                  <tbody>
                    <tr>
                      <td style={{ padding: "24px 28px 0", fontSize: 20, fontWeight: 700 }}>
                        <span style={{ color: emailColors.text }}>Sure</span>
                        <span style={{ color: emailColors.link }}>Ground</span>
                      </td>
                    </tr>
                    <tr>
                      <td
                        style={{
                          padding: "16px 28px 24px",
                          color: emailColors.text,
                          fontSize: 16,
                          lineHeight: "24px",
                        }}
                      >
                        {children}
                      </td>
                    </tr>
                  </tbody>
                </table>
                <p style={{ color: emailColors.muted, fontSize: 13, margin: "16px 0 0" }}>
                  {`${site.name}, ${site.location}. `}
                  <a href={`${site.url}/legal/privacy`} style={{ color: emailColors.link }}>
                    Privacy policy
                  </a>
                </p>
              </td>
            </tr>
          </tbody>
        </table>
      </body>
    </html>
  );
}

export function emailFooterText(): string {
  return `${site.name}, ${site.location}. Privacy policy: ${site.url}/legal/privacy`;
}
