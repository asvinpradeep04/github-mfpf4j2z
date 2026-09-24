import type { Rating, CompetencyId } from '@/types';
import { RATING_LABELS, RATING_COLORS, RATING_BAR_COLORS, getCompetency, getRubricLevel } from '@/data/rubric';
import { CompetencyIcon } from '@/components/CompetencyIcon';

export function RatingBadge({ rating, size = 'md' }: { rating: Rating; size?: 'sm' | 'md' }) {
  const sizes = {
    sm: 'text-[10px] px-2 py-0.5',
    md: 'text-xs px-2.5 py-0.5',
  };
  return (
    <span className={`badge border ${RATING_COLORS[rating]} ${sizes[size]}`}>
      {rating} — {RATING_LABELS[rating]}
    </span>
  );
}

export function CompetencyBar({
  competencyId,
  rating,
  showLabel = true,
}: {
  competencyId: CompetencyId;
  rating: Rating;
  showLabel?: boolean;
}) {
  const comp = getCompetency(competencyId);
  const percentage = (rating / 4) * 100;

  return (
    <div className="space-y-1.5">
      {showLabel && (
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            <CompetencyIcon name={comp.icon} className="h-4 w-4 text-ink-400" />
            <span className="text-sm font-medium text-ink-700">{comp.name}</span>
          </div>
          <RatingBadge rating={rating} size="sm" />
        </div>
      )}
      <div className="flex gap-1">
        {[1, 2, 3, 4].map((level) => (
          <div
            key={level}
            className={`h-2 flex-1 rounded-full transition-all ${
              level <= rating ? RATING_BAR_COLORS[rating] : 'bg-ink-200'
            }`}
          />
        ))}
      </div>
      {showLabel && (
        <p className="text-xs text-ink-400">{getRubricLevel(competencyId, rating).description}</p>
      )}
    </div>
  );
}

export function ProgressBar({ current, total }: { current: number; total: number }) {
  const percentage = (current / total) * 100;
  return (
    <div className="flex items-center gap-3">
      <div className="flex-1 h-1.5 rounded-full bg-ink-200 overflow-hidden">
        <div
          className="h-full rounded-full bg-primary-500 transition-all duration-500 ease-out"
          style={{ width: `${percentage}%` }}
        />
      </div>
      <span className="text-xs font-medium text-ink-400 tabular-nums">
        {current}/{total}
      </span>
    </div>
  );
}

export function EvidenceCard({
  sourceText,
  observedBehavior,
  impact,
  confidence,
  flagged,
  onFlag,
}: {
  sourceText: string;
  observedBehavior: string;
  impact: string;
  confidence: number;
  flagged?: boolean;
  onFlag?: () => void;
}) {
  const confidencePct = Math.round(confidence * 100);
  const confidenceLabel = confidencePct >= 85 ? 'High' : confidencePct >= 70 ? 'Medium' : 'Low';
  const confidenceColor =
    confidencePct >= 85 ? 'text-green-600 bg-green-50' : confidencePct >= 70 ? 'text-accent-600 bg-accent-50' : 'text-red-600 bg-red-50';

  return (
    <div className="rounded-lg border border-ink-200 bg-ink-50/50 p-4">
      <div className="mb-2 flex items-start justify-between gap-2">
        <div className="flex items-center gap-2">
          <span className="rounded bg-ink-200 px-1.5 py-0.5 font-mono text-[10px] font-medium text-ink-500">
            {observedBehavior}
          </span>
        </div>
        <div className="flex items-center gap-2">
          <span className={`badge ${confidenceColor}`}>Confidence: {confidenceLabel}</span>
          {onFlag && (
            <button
              onClick={onFlag}
              className={`text-xs font-medium transition-colors ${
                flagged ? 'text-red-600' : 'text-ink-400 hover:text-ink-600'
              }`}
            >
              {flagged ? 'Flagged' : 'Flag'}
            </button>
          )}
        </div>
      </div>
      <blockquote className="mb-3 border-l-2 border-primary-300 pl-3 text-sm italic text-ink-600">
        "{sourceText}"
      </blockquote>
      <div>
        <p className="text-xs font-semibold uppercase tracking-wider text-ink-400">Impact</p>
        <p className="mt-1 text-sm text-ink-600">{impact}</p>
      </div>
    </div>
  );
}
