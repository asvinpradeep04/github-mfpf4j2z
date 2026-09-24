import { useState } from 'react';
import {
  ArrowRight,
  CheckCircle2,
  AlertTriangle,
  Target,
  TrendingDown,
  Lightbulb,
  ChevronDown,
  ChevronUp,
  Flag,
  PenLine,
} from 'lucide-react';
import { Header } from '@/components/Header';
import { CompetencyIcon } from '@/components/CompetencyIcon';
import { RatingBadge, CompetencyBar, EvidenceCard } from '@/components/ui';
import { COMPETENCIES, getCompetency, getRubricLevel, RATING_LABELS } from '@/data/rubric';
import type { Attempt, EvidenceItem, FeedbackItem, Rating } from '@/types';

interface DebriefProps {
  attempt: Attempt;
  onContinue: (insightText: string) => void;
  onExit: () => void;
}

export function Debrief({ attempt, onContinue, onExit }: DebriefProps) {
  const [expandedCards, setExpandedCards] = useState<Set<string>>(new Set());
  const [flaggedEvidence, setFlaggedEvidence] = useState<Set<string>>(new Set());
  const [insightText, setInsightText] = useState('');
  const [showInsightError, setShowInsightError] = useState(false);

  const strengths = attempt.feedback.filter((f) => f.type === 'strength');
  const gaps = attempt.feedback.filter((f) => f.type === 'gap');
  const overallRating = attempt.overallRating || 2;

  const toggleCard = (id: string) => {
    setExpandedCards((prev) => {
      const next = new Set(prev);
      if (next.has(id)) next.delete(id);
      else next.add(id);
      return next;
    });
  };

  const toggleFlag = (evidenceId: string) => {
    setFlaggedEvidence((prev) => {
      const next = new Set(prev);
      if (next.has(evidenceId)) next.delete(evidenceId);
      else next.add(evidenceId);
      return next;
    });
  };

  const handleContinue = () => {
    if (insightText.trim().length < 10) {
      setShowInsightError(true);
      return;
    }
    onContinue(insightText.trim());
  };

  return (
    <div className="min-h-screen bg-ink-50">
      <Header
        onLogoClick={onExit}
        rightContent={
          <span className="badge bg-green-100 text-green-700">
            <CheckCircle2 className="h-3 w-3" />
            Attempt {attempt.attemptNumber} Complete
          </span>
        }
      />

      <div className="mx-auto max-w-3xl px-6 py-10">
        {/* Header */}
        <div className="mb-8 animate-slide-up">
          <p className="section-label">Interview Debrief</p>
          <h1 className="mt-2 font-serif text-3xl font-semibold text-ink-900">
            Here's what the evidence shows
          </h1>
          <p className="mt-3 text-sm text-ink-500">
            Every assessment below is grounded in your actual responses. You can review the
            evidence, challenge any claim you disagree with, and identify what to work on.
          </p>
        </div>

        {/* Overall Readiness */}
        <div className="card mb-6 animate-slide-up p-6" style={{ animationDelay: '60ms' }}>
          <div className="flex items-center justify-between">
            <div>
              <p className="section-label">Overall Readiness Level</p>
              <div className="mt-2 flex items-baseline gap-3">
                <span className="font-serif text-4xl font-bold text-ink-900">
                  {overallRating}
                </span>
                <span className="text-xl font-medium text-ink-500">
                  / 4 — {RATING_LABELS[overallRating as Rating]}
                </span>
              </div>
            </div>
            <div className="text-right">
              <p className="text-xs text-ink-400">This reflects your</p>
              <p className="text-xs font-medium text-ink-500">performance in this simulation.</p>
            </div>
          </div>
          <div className="mt-4 rounded-lg bg-ink-50 p-3">
            <p className="text-xs text-ink-400">
              This is not a hiring probability. It is a snapshot of how you performed under
              interview conditions on this specific case.
            </p>
          </div>
        </div>

        {/* Competency Breakdown */}
        <div className="card mb-6 animate-slide-up p-6" style={{ animationDelay: '120ms' }}>
          <h2 className="mb-4 text-sm font-bold text-ink-800">Competency Breakdown</h2>
          <div className="space-y-5">
            {attempt.assessments.map((assessment) => {
              const comp = getCompetency(assessment.competencyId);
              const level = getRubricLevel(assessment.competencyId, assessment.rating);
              return (
                <div key={assessment.competencyId}>
                  <CompetencyBar
                    competencyId={assessment.competencyId}
                    rating={assessment.rating}
                  />
                  <div className="mt-2 flex items-center gap-3 text-xs text-ink-400">
                    <span>
                      Evidence coverage: {Math.round(assessment.evidenceCoverage * 100)}%
                    </span>
                    <span>·</span>
                    <span>
                      Confidence: {Math.round(assessment.confidence * 100)}%
                    </span>
                  </div>
                </div>
              );
            })}
          </div>
        </div>

        {/* Strengths */}
        {strengths.length > 0 && (
          <div className="mb-6 animate-slide-up" style={{ animationDelay: '180ms' }}>
            <h2 className="mb-3 flex items-center gap-2 text-sm font-bold text-ink-800">
              <CheckCircle2 className="h-4 w-4 text-green-500" />
              What you did well
            </h2>
            <div className="space-y-3">
              {strengths.map((strength) => (
                <FeedbackCard
                  key={strength.id}
                  item={strength}
                  evidence={attempt.evidence}
                  expanded={expandedCards.has(strength.id)}
                  onToggle={() => toggleCard(strength.id)}
                  flaggedEvidence={flaggedEvidence}
                  onFlagEvidence={toggleFlag}
                  variant="strength"
                />
              ))}
            </div>
          </div>
        )}

        {/* Gaps */}
        <div className="mb-6 animate-slide-up" style={{ animationDelay: '240ms' }}>
          <h2 className="mb-3 flex items-center gap-2 text-sm font-bold text-ink-800">
            <AlertTriangle className="h-4 w-4 text-accent-500" />
            Top {gaps.length} behavioral {gaps.length === 1 ? 'gap' : 'gaps'} to address
          </h2>
          <div className="space-y-3">
            {gaps.map((gap) => (
              <FeedbackCard
                key={gap.id}
                item={gap}
                evidence={attempt.evidence}
                expanded={expandedCards.has(gap.id)}
                onToggle={() => toggleCard(gap.id)}
                flaggedEvidence={flaggedEvidence}
                onFlagEvidence={toggleFlag}
                variant="gap"
              />
            ))}
          </div>
        </div>

        {/* Practice Recommendation */}
        {attempt.practiceExercise && (
          <div className="card mb-8 animate-slide-up border-primary-200 bg-primary-50/30 p-6" style={{ animationDelay: '300ms' }}>
            <div className="flex items-start gap-3">
              <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-lg bg-primary-100">
                <Target className="h-5 w-5 text-primary-600" />
              </div>
              <div className="flex-1">
                <p className="section-label text-primary-600">Prioritized Practice Recommendation</p>
                <h3 className="mt-1 text-base font-bold text-ink-900">
                  {attempt.practiceExercise.targetGap}
                </h3>
                <p className="mt-2 text-sm text-ink-600">
                  {attempt.practiceExercise.exercisePrompt}
                </p>
                <div className="mt-3 rounded-lg bg-white p-3 border border-primary-200">
                  <p className="text-xs font-semibold text-primary-700">
                    Framework to follow:
                  </p>
                  <p className="mt-1 font-mono text-xs text-ink-700">
                    {attempt.practiceExercise.frameworkLabel}
                  </p>
                </div>
                <div className="mt-3 flex items-start gap-2">
                  <Lightbulb className="mt-0.5 h-4 w-4 shrink-0 text-accent-500" />
                  <div>
                    <p className="text-xs font-semibold text-ink-600">Success condition</p>
                    <p className="mt-0.5 text-xs text-ink-500">
                      {attempt.practiceExercise.successCondition}
                    </p>
                  </div>
                </div>
              </div>
            </div>
          </div>
        )}

        {/* Insight Confirmation */}
        <div className="card mb-8 animate-slide-up p-6" style={{ animationDelay: '360ms' }}>
          <div className="flex items-start gap-3">
            <PenLine className="mt-0.5 h-5 w-5 shrink-0 text-ink-400" />
            <div className="flex-1">
              <h3 className="text-sm font-bold text-ink-800">
                What is the main behavior you will change in your next interview?
              </h3>
              <p className="mt-1 text-xs text-ink-400">
                This helps us confirm you've identified a specific, actionable insight.
              </p>
              <textarea
                value={insightText}
                onChange={(e) => {
                  setInsightText(e.target.value);
                  if (showInsightError) setShowInsightError(false);
                }}
                placeholder="e.g., I will define the target user and their problem before proposing any solution..."
                rows={3}
                className="input-field mt-3 resize-none"
              />
              {showInsightError && (
                <p className="mt-2 text-xs text-red-500">
                  Please write at least one sentence describing what you'll change.
                </p>
              )}
            </div>
          </div>
        </div>

        {/* Continue */}
        <button onClick={handleContinue} className="btn-primary w-full text-base py-4">
          Continue to Practice Exercise
          <ArrowRight className="h-5 w-5" />
        </button>
      </div>
    </div>
  );
}

interface FeedbackCardProps {
  item: FeedbackItem;
  evidence: EvidenceItem[];
  expanded: boolean;
  onToggle: () => void;
  flaggedEvidence: Set<string>;
  onFlagEvidence: (id: string) => void;
  variant: 'strength' | 'gap';
}

function FeedbackCard({
  item,
  evidence,
  expanded,
  onToggle,
  flaggedEvidence,
  onFlagEvidence,
  variant,
}: FeedbackCardProps) {
  const itemEvidence = evidence.filter((e) => item.evidenceIds.includes(e.evidenceId));
  const comp = getCompetency(item.competencyId);

  return (
    <div
      className={`card overflow-hidden transition-all ${
        variant === 'gap' ? 'border-accent-200' : 'border-green-200'
      }`}
    >
      <button
        onClick={onToggle}
        className="flex w-full items-start gap-3 p-4 text-left hover:bg-ink-50/50 transition-colors"
      >
        <div
          className={`flex h-8 w-8 shrink-0 items-center justify-center rounded-lg ${
            variant === 'gap' ? 'bg-accent-100' : 'bg-green-100'
          }`}
        >
          {variant === 'gap' ? (
            <TrendingDown className="h-4 w-4 text-accent-600" />
          ) : (
            <CheckCircle2 className="h-4 w-4 text-green-600" />
          )}
        </div>
        <div className="flex-1">
          <div className="flex items-center gap-2">
            <span className="text-xs font-medium text-ink-400">{comp.name}</span>
          </div>
          <p className="mt-1 text-sm font-medium text-ink-800">{item.observation}</p>
          <p className="mt-1 text-xs text-ink-500">{item.whyItMattered}</p>
        </div>
        {expanded ? (
          <ChevronUp className="mt-1 h-4 w-4 shrink-0 text-ink-400" />
        ) : (
          <ChevronDown className="mt-1 h-4 w-4 shrink-0 text-ink-400" />
        )}
      </button>

      {expanded && (
        <div className="border-t border-ink-100 px-4 py-4 animate-fade-in">
          {/* Evidence */}
          {itemEvidence.length > 0 && (
            <div className="mb-4">
              <p className="mb-2 section-label">Supporting Evidence</p>
              <div className="space-y-3">
                {itemEvidence.map((ev) => (
                  <EvidenceCard
                    key={ev.evidenceId}
                    sourceText={ev.sourceText}
                    observedBehavior={ev.observedBehavior}
                    impact={ev.impact}
                    confidence={ev.confidence}
                    flagged={flaggedEvidence.has(ev.evidenceId)}
                    onFlag={() => onFlagEvidence(ev.evidenceId)}
                  />
                ))}
              </div>
            </div>
          )}

          {/* What should change */}
          <div className="rounded-lg bg-primary-50 p-3">
            <p className="section-label text-primary-600">Next time</p>
            <p className="mt-1 text-sm text-ink-700">{item.whatShouldChange}</p>
          </div>

          {/* Flag */}
          <button
            onClick={() => itemEvidence.forEach((ev) => onFlagEvidence(ev.evidenceId))}
            className="mt-3 flex items-center gap-1.5 text-xs font-medium text-ink-400 hover:text-red-500 transition-colors"
          >
            <Flag className="h-3 w-3" />
            This feedback does not reflect my answer
          </button>
        </div>
      )}
    </div>
  );
}
