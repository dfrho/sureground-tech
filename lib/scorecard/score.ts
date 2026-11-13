import {
  bands,
  DIMENSION_MAX,
  dimensionInfo,
  dimensions,
  questions,
  READY_THRESHOLD,
  readyRecommendation,
  recommendations,
  tieBreakOrder,
  TOTAL_MAX,
  type Band,
  type Dimension,
  type QuestionId,
  type Recommendation,
} from "@/content/scorecard";

/**
 * The First Step Scorecard scoring function. Pure: answers in, result out.
 * The server action calls it on validated answer ids, so the server is the
 * source of truth for every score; the browser never sends one.
 */

export type Answers = Record<QuestionId, string>;

export interface DimensionScore {
  dimension: Dimension;
  score: number;
  max: number;
}

export interface ScoreResult {
  total: number;
  max: number;
  band: Band;
  dimensions: DimensionScore[];
  /** The weakest dimension, or null when every dimension is ready. */
  weakest: Dimension | null;
  recommendation: Recommendation;
  /** Plain-language observations: up to two weak areas and one strength. */
  observations: string[];
}

export function bandFor(total: number): Band {
  if (!Number.isInteger(total) || total < 0 || total > TOTAL_MAX) {
    throw new RangeError(`Total out of range: ${total}`);
  }
  const band = bands.find((b) => total >= b.min && total <= b.max);
  if (!band) throw new RangeError(`No band for total ${total}`);
  return band;
}

function pointsFor(questionId: string, answerId: string | undefined): number {
  const question = questions.find((q) => q.id === questionId);
  const answer = question?.answers.find((a) => a.id === answerId);
  if (!question || !answer) throw new Error(`Invalid answer for ${questionId}`);
  return answer.points;
}

/** Dimensions sorted weakest first, ties broken by tieBreakOrder. */
function weakestFirst(scores: DimensionScore[]): DimensionScore[] {
  return [...scores].sort(
    (a, b) =>
      a.score - b.score || tieBreakOrder.indexOf(a.dimension) - tieBreakOrder.indexOf(b.dimension),
  );
}

export function recommend(scores: DimensionScore[]): {
  weakest: Dimension | null;
  recommendation: Recommendation;
} {
  const [weakest] = weakestFirst(scores);
  if (!weakest || weakest.score >= READY_THRESHOLD) {
    return { weakest: null, recommendation: readyRecommendation };
  }
  return { weakest: weakest.dimension, recommendation: recommendations[weakest.dimension] };
}

export function score(answers: Answers): ScoreResult {
  const byDimension = new Map<Dimension, number>(dimensions.map((d) => [d, 0]));
  for (const q of questions) {
    byDimension.set(q.dimension, byDimension.get(q.dimension)! + pointsFor(q.id, answers[q.id]));
  }

  const dimensionScores: DimensionScore[] = dimensions.map((dimension) => ({
    dimension,
    score: byDimension.get(dimension)!,
    max: DIMENSION_MAX,
  }));
  const total = dimensionScores.reduce((sum, d) => sum + d.score, 0);
  const { weakest, recommendation } = recommend(dimensionScores);

  return {
    total,
    max: TOTAL_MAX,
    band: bandFor(total),
    dimensions: dimensionScores,
    weakest,
    recommendation,
    observations: observe(dimensionScores),
  };
}

/** Observation text keys; the words live in content/scorecard.ts. */
export interface Observation {
  dimension: Dimension;
  kind: "weak" | "strong";
}

/**
 * Up to two weak areas (scoring below READY_THRESHOLD) and the strongest area
 * when it scores at least READY_THRESHOLD. Always at least one observation.
 */
export function observationKeys(scores: DimensionScore[]): Observation[] {
  const sorted = weakestFirst(scores);
  const weak: Observation[] = sorted
    .filter((d) => d.score < READY_THRESHOLD)
    .slice(0, 2)
    .map((d) => ({ dimension: d.dimension, kind: "weak" }));
  // Strongest: highest score, ties broken by tieBreakOrder.
  const strongest = [...scores].sort(
    (a, b) =>
      b.score - a.score || tieBreakOrder.indexOf(a.dimension) - tieBreakOrder.indexOf(b.dimension),
  )[0];
  const strong: Observation[] =
    strongest && strongest.score >= READY_THRESHOLD
      ? [{ dimension: strongest.dimension, kind: "strong" }]
      : [];
  return [...weak, ...strong];
}

function observe(scores: DimensionScore[]): string[] {
  return observationKeys(scores).map(({ dimension, kind }) => dimensionInfo[dimension][kind]);
}
