export {
  summarizeResult,
  toGoals,
  toQuarterScores,
  type Goal,
  type QuarterResult,
  type QuarterScore,
  type ResultSummary,
} from "./model/result";
export { default as ResultSummaryView } from "./ui/ResultSummaryView";
export {
  OUTCOME_LABELS,
  outcomeOf,
  recentResults,
  type MatchResultLine,
  type Outcome,
} from "./model/form";
export { default as FormStrip } from "./ui/FormStrip";
export { default as ResultChip } from "./ui/ResultChip";
export { default as ResultRow } from "./ui/ResultRow";
