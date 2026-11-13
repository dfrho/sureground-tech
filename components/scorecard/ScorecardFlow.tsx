"use client";

import { useActionState, useEffect, useRef, useState } from "react";

import { submitScorecard } from "@/app/actions/scorecard";
import { buttonClass } from "@/components/site/Button";
import { questions } from "@/content/scorecard";
import type { ScorecardFormState } from "@/lib/forms/scorecard-schema";

import { EmailGate } from "./EmailGate";
import { Progress } from "./Progress";
import { Question } from "./Question";
import { ResultSummary } from "./ResultSummary";

const idle: ScorecardFormState = { status: "idle" };
const GATE = questions.length;

/**
 * The First Step Scorecard: one question per screen, then the email gate,
 * then the results. Answers live only in this component's state: never in
 * the URL or browser storage. Starting over remounts the flow.
 */
export function ScorecardFlow(props: { siteKey?: string; email: string }) {
  const [run, setRun] = useState(0);
  return <Flow key={run} {...props} onRestart={() => setRun((r) => r + 1)} />;
}

function Flow({
  siteKey,
  email,
  onRestart,
}: {
  siteKey?: string;
  email: string;
  onRestart: () => void;
}) {
  const [state, action, pending] = useActionState(submitScorecard, idle);
  const [step, setStep] = useState(0);
  const [answers, setAnswers] = useState<Record<string, string>>({});
  const headingRef = useRef<HTMLHeadingElement>(null);
  const moved = useRef(false);

  // Move focus to the new screen's heading, but not on first load.
  useEffect(() => {
    if (!moved.current) return;
    headingRef.current?.focus();
  }, [step, state]);

  const go = (next: number) => {
    moved.current = true;
    setStep(next);
  };

  if (state.status === "success") {
    return <ResultSummary outcome={state.outcome} headingRef={headingRef} onRestart={onRestart} />;
  }

  if (step >= GATE) {
    return (
      <div className="flex flex-col gap-8">
        <Progress step={GATE} total={GATE} label="Last step" />
        <EmailGate
          action={(formData) => {
            moved.current = true;
            action(formData);
          }}
          pending={pending}
          state={state}
          answers={answers}
          siteKey={siteKey}
          email={email}
          headingRef={headingRef}
          onBack={() => go(GATE - 1)}
        />
      </div>
    );
  }

  const question = questions[step];
  const value = answers[question.id];
  return (
    <form
      className="flex flex-col gap-8"
      onSubmit={(e) => {
        e.preventDefault();
        if (value) go(step + 1);
      }}
    >
      <Progress step={step} total={GATE} label={`Question ${step + 1} of ${GATE}`} />
      <Question
        key={question.id}
        question={question}
        value={value}
        onChange={(answerId) => setAnswers((a) => ({ ...a, [question.id]: answerId }))}
        headingRef={headingRef}
      />
      <div className="flex flex-col-reverse gap-3 sm:flex-row">
        {step > 0 ? (
          <button type="button" onClick={() => go(step - 1)} className={buttonClass("secondary")}>
            Back
          </button>
        ) : null}
        <button
          type="submit"
          disabled={!value}
          className={buttonClass("primary", "disabled:opacity-60")}
        >
          Next
        </button>
      </div>
    </form>
  );
}
