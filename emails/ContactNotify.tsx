import type { ContactInput } from "@/lib/forms/contact-schema";

import { EmailLayout, emailColors, emailFooterText } from "./layout";

/**
 * Notification to David for a contact form message. Every visitor value is
 * rendered as escaped text by React; nothing is built as an HTML string.
 * Sent only to CONTACT_TO_EMAIL, never to the visitor.
 */
export function ContactNotify({ data }: { data: ContactInput }) {
  const rows: [string, string][] = [
    ["Name", data.name],
    ["Email", data.email],
    ["Company", data.company || "Not given"],
    ["Topic", data.topic],
  ];
  return (
    <EmailLayout preview={`New message: ${data.topic}`}>
      <p style={{ margin: "0 0 16px", fontWeight: 600 }}>New contact form message</p>
      <table role="presentation" cellPadding={0} cellSpacing={0} style={{ marginBottom: 16 }}>
        <tbody>
          {rows.map(([label, value]) => (
            <tr key={label}>
              <td
                style={{
                  color: emailColors.muted,
                  padding: "2px 16px 2px 0",
                  verticalAlign: "top",
                }}
              >
                {label}
              </td>
              <td style={{ padding: "2px 0" }}>{value}</td>
            </tr>
          ))}
        </tbody>
      </table>
      <div
        style={{
          whiteSpace: "pre-wrap",
          borderTop: `1px solid ${emailColors.border}`,
          paddingTop: 16,
        }}
      >
        {data.message}
      </div>
      <p style={{ color: emailColors.muted, fontSize: 13, margin: "16px 0 0" }}>
        Reply to this email to answer the sender directly.
      </p>
    </EmailLayout>
  );
}

export function contactNotifyText(data: ContactInput): string {
  return [
    "New contact form message",
    "",
    `Name: ${data.name}`,
    `Email: ${data.email}`,
    `Company: ${data.company || "Not given"}`,
    `Topic: ${data.topic}`,
    "",
    data.message,
    "",
    "Reply to this email to answer the sender directly.",
    "",
    emailFooterText(),
  ].join("\n");
}

export function contactNotifySubject(data: ContactInput): string {
  return `Contact: ${data.topic} from ${data.name}`;
}
