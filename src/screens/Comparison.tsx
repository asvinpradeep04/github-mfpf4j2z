import {
  ArrowRight,
  ArrowUp,
  ArrowDown,
  Minus,
  TrendingUp,
  CheckCircle2,
  AlertCircle,
  Target,
  Repeat,
  Home,
} from 'lucide-react';
import { Header } from '@/components/Header';
import { CompetencyIcon } from '@/components/CompetencyIcon';
import { RatingBadge } from '@/components/ui';
import { COMPETENCIES, getCompetencyName, RATING_LABELS } from '@/data/rubric';
import type { Attempt, AttemptComparison, CompetencyDelta, Rating } from '@/types';

interface ComparisonProps {
  attempt1: Attempt;
  attempt2: Attempt;
  comparison: AttemptComparison;
  onRestart: () => void;
  onExit: () => void;
}

export function Comparison({
  attempt1,
  attempt2,
  comparison,
  onRestart,
  onExit,
}: ComparisonProps) {
  const overall1 = attempt1.overallRating || 2;
  const overall2 = attempt2.overallRating || 2;

  return (
    <div className="min-h-screen bg-ink-50">
      <Header
        onLogoClick={onExit}
        rightContent={
          <span className="badge bg-green-100 text-green-700">
            <CheckCircle2 className="h-3 w-3" />
            Both Attempts Complete
          </span>
        }
      />

      <div className="mx-auto max-w-3xl px-6 py-10">
        {/* Header */}
        <div className="mb-8 animate-slide-up">
          <p className="section-label">Attempt Comparison</p>
          <h1 className="mt-2 font-serif text-3xl font-semibold text-ink-900">
            What changed between your two attempts
          </h1>
          <p className="mt-3 text-sm text-ink-500">
            {comparison.summary}
          </p>
        </div>

        {/* Practice Goal */}
        <div
          className={`card mb-6 animate-slide-up p-5 ${
            comparison.addressedPracticeGoal
              ? 'border-green-200 bg-green-50/30'
              : 'border-accent-200 bg-accent-50/30'
          }`}
          style={{ animationDelay: '60ms' }}
        >
          <div className="flex items-start gap-3">
            {comparison.addressedPracticeGoal ? (
              <CheckCircle2 className="mt-0.5 h-5 w-5 shrink-0 text-green-500" />
            ) : (
              <AlertCircle className="mt-0.5 h-5 w-5 shrink-0 text-accent-500" />
            )}
            <div>
              <p className="section-label">Practice Goal</p>
              <h3 className="mt-1 text-sm font-bold text-ink-800">
                {attempt1.practiceExercise?.targetGap}
              </h3>
              <p className="mt-1 text-sm text-ink-600">
                {comparison.addressedPracticeGoal
                  ? 'You addressed the targeted behavior in your second attempt. The evidence shows improvement in this area.'
                  : 'The second attempt did not fully address the practice goal. Behavioral change often requires multiple practice cycles.'}
              </p>
            </div>
          </div>
        </div>

        {/* Overall Score Delta */}
        <div className="card mb-6 animate-slide-up p-6" style={{ animationDelay: '120ms' }}>
          <p className="section-label mb-4">Overall Readiness</p>
          <div className="flex items-center justify-center gap-8">
            <ScoreColumn
              label="Attempt 1"
              rating={overall1 as Rating}
              caseTitle={attempt1.caseId}
            />
            <div className="flex flex-col items-center">
              <DeltaArrow delta={comparison.overallDelta} />
              <span
                className={`mt-2 text-sm font-bold ${
                  comparison.overallDelta > 0
                    ? 'text-green-600'
                    : comparison.overallDelta < 0
                    ? 'text-red-500'
                    : 'text-ink-400'
                }`}
              >
                {comparison.overallDelta > 0
                  ? `+${comparison.overallDelta.toFixed(1)}`
                  : comparison.overallDelta.toFixed(1)}
              </span>
            </div>
            <ScoreColumn
              label="Attempt 2"
              rating={overall2 as Rating}
              caseTitle={attempt2.caseId}
            />
          </div>
        </div>

        {/* Competency Deltas */}
        <div className="card mb-6 animate-slide-up p-6" style={{ animationDelay: '180ms' }}>
          <h2 className="mb-4 text-sm font-bold text-ink-800">Competency Changes</h2>
          <div className="space-y-4">
            {comparison.competencyDeltas.map((delta) => (
              <CompetencyDeltaRow key={delta.competencyId} delta={delta} />
            ))}
          </div>
        </div>

        {/* Behavioral Changes */}
        <div className="card mb-6 animate-slide-up p-6" style={{ animationDelay: '240ms' }}>
          <h2 className="mb-4 flex items-center gap-2 text-sm font-bold text-ink-800">
            <TrendingUp className="h-4 w-4 text-primary-500" />
            Behavioral Observations
          </h2>
          <div className="space-y-3">
            {comparison.behavioralChanges.map((change, i) => (
              <div
                key={i}
                className={`rounded-lg p-4 ${
                  change.improved
                    ? 'bg-green-50/50 border border-green-200'
                    : 'bg-ink-50 border border-ink-200'
                }`}
              >
                <div className="flex items-start gap-3">
                  {change.improved ? (
                    <ArrowUp className="mt-0.5 h-4 w-4 shrink-0 text-green-500" />
                  ) : (
                    <Minus className="mt-0.5 h-4 w-4 shrink-0 text-ink-400" />
                  )}
                  <div>
                    <span className="text-xs font-semibold uppercase tracking-wider text-ink-400">
                      {getCompetencyName(change.competencyId)}
                    </span>
                    <p className="mt-1 text-sm text-ink-700">{change.description}</p>
                  </div>
                </div>
              </div>
            ))}
          </div>
        </div>

        {/* Important Disclaimer */}
        <div className="mb-8 animate-slide-up rounded-lg bg-ink-100 p-4" style={{ animationDelay: '300ms' }}>
          <p className="text-xs leading-relaxed text-ink-500">
            <strong className="text-ink-600">Important:</strong> This comparison reflects
            observed improvement during the second simulation. It does not prove that the
            practice caused the improvement, nor does it guarantee future interview performance.
            Scores may also improve as candidates become familiar with the format.
          </p>
        </div>

        {/* Actions */}
        <div className="flex flex-col gap-3 animate-slide-up" style={{ animationDelay: '360ms' }}>
          <button onClick={onRestart} className="btn-primary w-full text-base py-4">
            <Repeat className="h-5 w-5" />
            Start a New Practice Cycle
          </button>
          <button onClick={onExit} className="btn-secondary w-full">
            <Home className="h-4 w-4" />
            Back to Home
          </button>
        </div>
      </div>
    </div>
  );
}

function ScoreColumn({
  label,
  rating,
  caseTitle,
}: {
  label: string;
  rating: Rating;
  caseTitle: string;
}) {
  return (
    <div className="text-center">
      <p className="text-xs font-medium text-ink-400">{label}</p>
      <div className="mt-2 flex items-baseline justify-center gap-1">
        <span className="font-serif text-4xl font-bold text-ink-900">{rating}</span>
        <span className="text-lg text-ink-400">/4</span>
      </div>
      <p className="mt-1 text-xs font-medium text-ink-500">{RATING_LABELS[rating]}</p>
    </div>
  );
}

function DeltaArrow({ delta }: { delta: number }) {
  if (delta > 0) {
    return (
      <div className="flex h-12 w-12 items-center justify-center rounded-full bg-green-100">
        <ArrowUp className="h-6 w-6 text-green-600" />
      </div>
    );
  } else if (delta < 0) {
    return (
      <div className="flex h-12 w-12 items-center justify-center rounded-full bg-red-100">
        <ArrowDown className="h-6 w-6 text-red-500" />
      </div>
    );
  }
  return (
    <div className="flex h-12 w-12 items-center justify-center rounded-full bg-ink-100">
      <Minus className="h-6 w-6 text-ink-400" />
    </div>
  );
}

function CompetencyDeltaRow({ delta }: { delta: CompetencyDelta }) {
  const comp = COMPETENCIES.find((c) => c.id === delta.competencyId)!;
  const improved = delta.delta > 0;
  const declined = delta.delta < 0;

  return (
    <div className="flex items-center gap-4">
      <div className="flex h-9 w-9 shrink-0 items-center justify-center rounded-lg bg-ink-100">
        <CompetencyIcon name={comp.icon} className="h-4 w-4 text-ink-500" />
      </div>
      <div className="flex-1">
        <p className="text-sm font-medium text-ink-700">{comp.name}</p>
        <div className="mt-1 flex items-center gap-2">
          <RatingBadge rating={delta.rating1} size="sm" />
          <span className="text-ink-300">→</span>
          <RatingBadge rating={delta.rating2} size="sm" />
        </div>
      </div>
      <div
        className={`flex items-center gap-1 text-sm font-bold ${
          improved ? 'text-green-600' : declined ? 'text-red-500' : 'text-ink-400'
        }`}
      >
        {improved && <ArrowUp className="h-4 w-4" />}
        {declined && <ArrowDown className="h-4 w-4" />}
        {!improved && !declined && <Minus className="h-4 w-4" />}
        {delta.delta > 0 ? `+${delta.delta.toFixed(1)}` : delta.delta.toFixed(1)}
      </div>
    </div>
  );
}
