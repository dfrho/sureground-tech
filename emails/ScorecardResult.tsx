import { site } from "@/lib/config/site";
import type { ScorecardOutcome } from "@/lib/forms/scorecard-schema";

import { EmailLayout, emailColors, emailFooterText } from "./layout";

/**
 * Scorecard results, sent to the address the visitor typed. Abuse rule
 * (CLAUDE.md): this email holds only our fixed text and the score. It never
 * includes anything the visitor typed, not even their first name, so the
 * form cannot be used to send a message to someone else.
 *
 * COPY: draft
 */

export const scorecardResultSubject = "Your First Step Scorecard results";

const fitCallHref = `${site.url}/contact#book`;

export function ScorecardResult({ outcome }: { outcome: ScorecardOutcome }) {
  const serviceUrl = `${site.url}${outcome.recommendation.href}`;
  return (
    <EmailLayout preview={`Your result: ${outcome.band.name}`}>
      <p style={{ margin: "0 0 4px", color: emailColors.muted, fontSize: 13 }}>
        First Step Scorecard
      </p>
      <p style={{ margin: "0 0 8px", fontSize: 22, fontWeight: 700 }}>{outcome.band.name}</p>
      <p style={{ margin: "0 0 16px" }}>
        {`You scored ${outcome.total} out of ${outcome.max}. ${outcome.band.summary}`}
      </p>

      <table
        role="presentation"
        cellPadding={0}
        cellSpacing={0}
        width="100%"
        style={{ marginBottom: 16 }}
      >
        <tbody>
          {outcome.dimensions.map((d) => (
            <tr key={d.label}>
              <td style={{ padding: "4px 16px 4px 0", width: 110 }}>{d.label}</td>
              <td style={{ padding: "4px 0" }}>
                <table role="presentation" cellPadding={0} cellSpacing={0} width="100%">
                  <tbody>
                    <tr>
                      <td
                        style={{
                          background: emailColors.border,
                          borderRadius: 4,
                          height: 8,
                          fontSize: 0,
                          lineHeight: 0,
                        }}
                      >
                        <div
                          style={{
                            width: `${Math.round((d.score / d.max) * 100)}%`,
                            height: 8,
                            background: emailColors.link,
                            borderRadius: 4,
                          }}
                        />
                      </td>
                    </tr>
                  </tbody>
                </table>
              </td>
              <td
                style={{
                  padding: "4px 0 4px 12px",
                  whiteSpace: "nowrap",
                  color: emailColors.muted,
                }}
              >
                {`${d.score} of ${d.max}`}
              </td>
            </tr>
          ))}
        </tbody>
      </table>

      <p style={{ margin: "0 0 8px", fontWeight: 600 }}>What stands out</p>
      {outcome.observations.map((o) => (
        <p key={o} style={{ margin: "0 0 8px" }}>
          {o}
        </p>
      ))}

      <div style={{ borderTop: `1px solid ${emailColors.border}`, margin: "16px 0", height: 0 }} />

      <p style={{ margin: "0 0 4px", fontWeight: 600 }}>
        {`Your first step: ${outcome.recommendation.name}`}
      </p>
      <p style={{ margin: "0 0 4px", color: emailColors.muted }}>{outcome.recommendation.price}</p>
      <p style={{ margin: "0 0 8px" }}>{outcome.recommendation.reason}</p>
      <p style={{ margin: "0 0 16px" }}>
        <a href={serviceUrl} style={{ color: emailColors.link }}>
          {`Read about ${outcome.recommendation.name}`}
        </a>
      </p>
      <p style={{ margin: "0 0 16px" }}>
        Not sure yet? Book a free AI Fit Call and talk it through.{" "}
        <a href={fitCallHref} style={{ color: emailColors.link }}>
          Book a call
        </a>
      </p>
      <p style={{ margin: 0, color: emailColors.muted, fontSize: 13 }}>{outcome.disclaimer}</p>
    </EmailLayout>
  );
}

export function scorecardResultText(outcome: ScorecardOutcome): string {
  return [
    "First Step Scorecard",
    "",
    outcome.band.name,
    `You scored ${outcome.total} out of ${outcome.max}. ${outcome.band.summary}`,
    "",
    ...outcome.dimensions.map((d) => `${d.label}: ${d.score} of ${d.max}`),
    "",
    "What stands out",
    ...outcome.observations,
    "",
    `Your first step: ${outcome.recommendation.name}`,
    outcome.recommendation.price,
    outcome.recommendation.reason,
    `Read about it: ${site.url}${outcome.recommendation.href}`,
    "",
    `Not sure yet? Book a free AI Fit Call: ${fitCallHref}`,
    "",
    outcome.disclaimer,
    "",
    emailFooterText(),
  ].join("\n");
}
