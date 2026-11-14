import { questions } from "@/content/scorecard";
import type { ScorecardInput, ScorecardOutcome } from "@/lib/forms/scorecard-schema";

import { EmailLayout, emailColors, emailFooterText } from "./layout";

/**
 * Scorecard lead notification to David. Visitor values are rendered as
 * escaped text by React. Sent only to CONTACT_TO_EMAIL.
 */

function answerRows(data: ScorecardInput): [string, string, number][] {
  return questions.map((q) => {
    const answer = q.answers.find((a) => a.id === data[q.id]);
    return [q.prompt, answer?.label ?? "", answer?.points ?? 0];
  });
}

function leadRows(data: ScorecardInput): [string, string][] {
  return [
    ["First name", data.firstName],
    ["Email", data.email],
    ["Company", data.company],
    ["Company size", data.size],
    ["Role", data.role],
    ["Who builds AI", data.team],
  ];
}

const cell = { padding: "2px 16px 2px 0", verticalAlign: "top" } as const;

export function ScorecardLeadNotify({
  data,
  outcome,
}: {
  data: ScorecardInput;
  outcome: ScorecardOutcome;
}) {
  return (
    <EmailLayout preview={`Scorecard lead: ${outcome.band.name}`}>
      <p style={{ margin: "0 0 16px", fontWeight: 600 }}>New First Step Scorecard lead</p>
      <table role="presentation" cellPadding={0} cellSpacing={0} style={{ marginBottom: 16 }}>
        <tbody>
          {leadRows(data).map(([label, value]) => (
            <tr key={label}>
              <td style={{ ...cell, color: emailColors.muted }}>{label}</td>
              <td style={cell}>{value}</td>
            </tr>
          ))}
        </tbody>
      </table>

      <p style={{ margin: "0 0 8px", fontWeight: 600 }}>
        {`${outcome.band.name}: ${outcome.total} of ${outcome.max}`}
      </p>
      <p style={{ margin: "0 0 8px" }}>
        {outcome.dimensions.map((d) => `${d.label} ${d.score}/${d.max}`).join(", ")}
      </p>
      <p style={{ margin: "0 0 16px" }}>
        {`Recommended: ${outcome.recommendation.name} (${outcome.recommendation.price})`}
      </p>

      <table
        role="presentation"
        cellPadding={0}
        cellSpacing={0}
        style={{ borderTop: `1px solid ${emailColors.border}`, paddingTop: 8 }}
      >
        <tbody>
          {answerRows(data).map(([prompt, label, points]) => (
            <tr key={prompt}>
              <td style={{ ...cell, paddingTop: 8 }}>
                <span style={{ color: emailColors.muted }}>{prompt}</span>
                <br />
                {`${label} (${points})`}
              </td>
            </tr>
          ))}
        </tbody>
      </table>
      <p style={{ color: emailColors.muted, fontSize: 13, margin: "16px 0 0" }}>
        The visitor was emailed their results. Reply to this email to write to them directly.
      </p>
    </EmailLayout>
  );
}

export function scorecardLeadText(data: ScorecardInput, outcome: ScorecardOutcome): string {
  return [
    "New First Step Scorecard lead",
    "",
    ...leadRows(data).map(([label, value]) => `${label}: ${value}`),
    "",
    `${outcome.band.name}: ${outcome.total} of ${outcome.max}`,
    outcome.dimensions.map((d) => `${d.label} ${d.score}/${d.max}`).join(", "),
    `Recommended: ${outcome.recommendation.name} (${outcome.recommendation.price})`,
    "",
    ...answerRows(data).flatMap(([prompt, label, points]) => [prompt, `  ${label} (${points})`]),
    "",
    "The visitor was emailed their results. Reply to this email to write to them directly.",
    "",
    emailFooterText(),
  ].join("\n");
}

export function scorecardLeadSubject(data: ScorecardInput, outcome: ScorecardOutcome): string {
  return `Scorecard: ${outcome.band.name} (${outcome.total}/${outcome.max}) from ${data.company}`;
}
