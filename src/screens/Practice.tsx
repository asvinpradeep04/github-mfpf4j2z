import { useState } from 'react';
import {
  ArrowRight,
  Dumbbell,
  CheckCircle2,
  Circle,
  Target,
  Info,
  RotateCcw,
} from 'lucide-react';
import { Header } from '@/components/Header';
import { evaluatePracticeResponse } from '@/data/simulation';
import type { Attempt, PracticeExercise } from '@/types';

interface PracticeProps {
  attempt: Attempt;
  onComplete: (practiceResponse: string) => void;
  onExit: () => void;
}

export function Practice({ attempt, onComplete, onExit }: PracticeProps) {
  const exercise: PracticeExercise | null = attempt.practiceExercise;
  const [response, setResponse] = useState('');
  const [submitted, setSubmitted] = useState(false);
  const [evaluation, setEvaluation] = useState<{
    met: boolean;
    metCriteria: string[];
  } | null>(null);

  if (!exercise) {
    return (
      <div className="min-h-screen bg-ink-50">
        <Header onLogoClick={onExit} />
        <div className="mx-auto max-w-2xl px-6 py-20 text-center">
          <p className="text-ink-500">No practice exercise available.</p>
          <button onClick={() => onComplete('')} className="btn-primary mt-6">
            Continue to Reattempt
            <ArrowRight className="h-4 w-4" />
          </button>
        </div>
      </div>
    );
  }

  const handleSubmit = () => {
    if (!response.trim()) return;
    const result = evaluatePracticeResponse(response, exercise);
    setEvaluation(result);
    setSubmitted(true);
  };

  const handleContinue = () => {
    onComplete(response.trim());
  };

  const handleRetry = () => {
    setSubmitted(false);
    setEvaluation(null);
    setResponse('');
  };

  return (
    <div className="min-h-screen bg-ink-50">
      <Header
        onLogoClick={onExit}
        rightContent={
          <span className="badge bg-accent-100 text-accent-700">
            <Dumbbell className="h-3 w-3" />
            Practice Exercise
          </span>
        }
      />

      <div className="mx-auto max-w-3xl px-6 py-10">
        {/* Header */}
        <div className="mb-8 animate-slide-up">
          <p className="section-label">Targeted Practice</p>
          <h1 className="mt-2 font-serif text-3xl font-semibold text-ink-900">
            Practice your weakest area
          </h1>
          <p className="mt-3 text-sm text-ink-500">
            One focused exercise targeting your highest-impact gap. This is not reading advice —
            you need to produce a new response.
          </p>
        </div>

        {/* Target Gap */}
        <div className="card mb-6 animate-slide-up p-5" style={{ animationDelay: '60ms' }}>
          <div className="flex items-start gap-3">
            <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-lg bg-accent-100">
              <Target className="h-5 w-5 text-accent-600" />
            </div>
            <div>
              <p className="section-label">Targeting</p>
              <h3 className="mt-1 text-sm font-bold text-ink-800">{exercise.targetGap}</h3>
            </div>
          </div>
        </div>

        {/* Exercise Prompt */}
        <div className="card mb-6 animate-slide-up p-6" style={{ animationDelay: '120ms' }}>
          <h2 className="mb-3 text-sm font-bold text-ink-800">Exercise</h2>
          <p className="text-sm leading-relaxed text-ink-700">{exercise.exercisePrompt}</p>
        </div>

        {/* Framework Guidance */}
        <div className="card mb-6 animate-slide-up border-primary-200 bg-primary-50/30 p-6" style={{ animationDelay: '180ms' }}>
          <div className="flex items-start gap-3">
            <Info className="mt-0.5 h-5 w-5 shrink-0 text-primary-500" />
            <div>
              <p className="text-xs font-semibold uppercase tracking-wider text-primary-700">
                Use this framework
              </p>
              <div className="mt-3 flex flex-wrap gap-2">
                {exercise.framework.map((step, i) => (
                  <div key={step} className="flex items-center gap-2">
                    <span className="flex h-6 w-6 items-center justify-center rounded-full bg-primary-600 text-[10px] font-bold text-white">
                      {i + 1}
                    </span>
                    <span className="text-xs font-medium text-ink-700">{step}</span>
                    {i < exercise.framework.length - 1 && (
                      <span className="text-ink-300">→</span>
                    )}
                  </div>
                ))}
              </div>
            </div>
          </div>
        </div>

        {/* Success Condition */}
        <div className="card mb-6 animate-slide-up p-4" style={{ animationDelay: '240ms' }}>
          <div className="flex items-start gap-2">
            <CheckCircle2 className="mt-0.5 h-4 w-4 shrink-0 text-green-500" />
            <div>
              <p className="text-xs font-semibold text-ink-700">Success condition</p>
              <p className="mt-0.5 text-sm text-ink-600">{exercise.successCondition}</p>
            </div>
          </div>
        </div>

        {/* Response Input or Results */}
        {!submitted ? (
          <div className="animate-slide-up" style={{ animationDelay: '300ms' }}>
            <label className="mb-2 block text-sm font-bold text-ink-800">
              Your response
            </label>
            <textarea
              value={response}
              onChange={(e) => setResponse(e.target.value)}
              placeholder="Write your response using the framework above..."
              rows={10}
              className="input-field resize-y"
            />
            <div className="mt-3 flex items-center justify-between">
              <span className="text-xs text-ink-400">
                {response.trim().length} characters
              </span>
              <button
                onClick={handleSubmit}
                disabled={!response.trim()}
                className="btn-primary"
              >
                Submit Response
              </button>
            </div>
          </div>
        ) : (
          <div className="animate-slide-up space-y-4">
            {/* Evaluation */}
            <div
              className={`card p-6 ${
                evaluation?.met
                  ? 'border-green-200 bg-green-50/30'
                  : 'border-accent-200 bg-accent-50/30'
              }`}
            >
              <div className="flex items-start gap-3">
                {evaluation?.met ? (
                  <CheckCircle2 className="mt-0.5 h-6 w-6 shrink-0 text-green-500" />
                ) : (
                  <Target className="mt-0.5 h-6 w-6 shrink-0 text-accent-500" />
                )}
                <div>
                  <h3 className="text-sm font-bold text-ink-800">
                    {evaluation?.met
                      ? 'You met the success condition'
                      : 'You are on the right track — keep refining'}
                  </h3>
                  <p className="mt-1 text-sm text-ink-500">
                    {evaluation?.met
                      ? 'Your response demonstrates the target behavior. You are ready for the reattempt.'
                      : 'Your response shows some of the target behavior but does not fully meet the success condition yet.'}
                  </p>
                </div>
              </div>
            </div>

            {/* Criteria Checklist */}
            <div className="card p-5">
              <p className="mb-3 section-label">Evaluation Criteria</p>
              <div className="space-y-2.5">
                {exercise.evaluationCriteria.map((criterion) => {
                  const met = evaluation?.metCriteria.some(
                    (c) =>
                      criterion.toLowerCase().includes(c.toLowerCase().split(' ')[0]) ||
                      c.toLowerCase().includes(criterion.toLowerCase().split(' ')[0]),
                  );
                  return (
                    <div key={criterion} className="flex items-start gap-2.5">
                      {met ? (
                        <CheckCircle2 className="mt-0.5 h-4 w-4 shrink-0 text-green-500" />
                      ) : (
                        <Circle className="mt-0.5 h-4 w-4 shrink-0 text-ink-300" />
                      )}
                      <span
                        className={`text-sm ${
                          met ? 'text-ink-700' : 'text-ink-400'
                        }`}
                      >
                        {criterion}
                      </span>
                    </div>
                  );
                })}
              </div>
            </div>

            {/* Your Response */}
            <div className="card p-5">
              <p className="mb-2 section-label">Your Response</p>
              <p className="text-sm leading-relaxed text-ink-600 whitespace-pre-wrap">
                {response}
              </p>
            </div>

            {/* Actions */}
            <div className="flex gap-3">
              {!evaluation?.met && (
                <button onClick={handleRetry} className="btn-secondary">
                  <RotateCcw className="h-4 w-4" />
                  Try Again
                </button>
              )}
              <button
                onClick={handleContinue}
                className="btn-primary flex-1 text-base py-4"
              >
                Continue to Second Interview
                <ArrowRight className="h-5 w-5" />
              </button>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
