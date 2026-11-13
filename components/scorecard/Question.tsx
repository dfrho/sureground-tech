import type { Question as QuestionData } from "@/content/scorecard";

/**
 * One scorecard question as a native radio group: arrow keys move between
 * answers, and the legend names the group for screen readers. These radios
 * are not inside the email form; the flow posts the chosen ids as hidden
 * inputs at the end.
 */
export function Question({
  question,
  value,
  onChange,
  headingRef,
}: {
  question: QuestionData;
  value: string | undefined;
  onChange: (answerId: string) => void;
  headingRef: React.Ref<HTMLHeadingElement>;
}) {
  return (
    <fieldset className="flex flex-col gap-3">
      <legend className="mb-4">
        <h2 ref={headingRef} tabIndex={-1} className="font-display text-h3 outline-none">
          {question.prompt}
        </h2>
      </legend>
      {question.answers.map((answer) => {
        const id = `answer-${question.id}-${answer.id}`;
        return (
          <label
            key={answer.id}
            htmlFor={id}
            className="flex min-h-11 cursor-pointer items-start gap-3 rounded-button border border-border bg-surface px-4 py-3 has-checked:border-2 has-checked:border-accent-text has-focus-visible:outline-2 has-focus-visible:outline-offset-2 has-focus-visible:outline-accent-text"
          >
            <input
              id={id}
              type="radio"
              name={`q-${question.id}`}
              value={answer.id}
              checked={value === answer.id}
              onChange={() => onChange(answer.id)}
              className="mt-1 size-5 shrink-0 accent-accent-fill"
            />
            <span>{answer.label}</span>
          </label>
        );
      })}
    </fieldset>
  );
}
