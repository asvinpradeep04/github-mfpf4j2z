import { useState } from 'react';
import { ArrowRight, ArrowLeft, Target, Sparkles } from 'lucide-react';
import { Header } from '@/components/Header';
import type { ExperienceLevel, Domain, SetupData } from '@/types';

interface SetupProps {
  onComplete: (data: SetupData) => void;
  onBack: () => void;
}

const EXPERIENCE_LEVELS: { value: ExperienceLevel; label: string; desc: string }[] = [
  { value: '0-1', label: '0–1 years', desc: 'New to PM or transitioning careers' },
  { value: '1-2', label: '1–2 years', desc: 'Some PM experience, preparing for next role' },
  { value: '2-3', label: '2–3 years', desc: 'Established PM looking to sharpen skills' },
  { value: '3+', label: '3+ years', desc: 'Experienced PM preparing for senior interviews' },
];

const DOMAINS: { value: Domain; label: string; desc: string }[] = [
  { value: 'fintech', label: 'Fintech', desc: 'Payments, banking, budgeting' },
  { value: 'marketplace', label: 'Marketplace', desc: 'Two-sided platforms, gig economy' },
  { value: 'saas', label: 'SaaS', desc: 'B2B tools, productivity, collaboration' },
  { value: 'consumer', label: 'Consumer', desc: 'Social, health, content, entertainment' },
  { value: 'general', label: 'General', desc: 'No preference — use a general product case' },
];

export function Setup({ onComplete, onBack }: SetupProps) {
  const [experience, setExperience] = useState<ExperienceLevel | null>(null);
  const [domain, setDomain] = useState<Domain | null>(null);

  const canProceed = experience !== null;

  const handleBegin = () => {
    if (canProceed) {
      onComplete({
        experienceLevel: experience!,
        domain: domain || 'general',
      });
    }
  };

  return (
    <div className="min-h-screen bg-ink-50">
      <Header onLogoClick={onBack} />

      <div className="mx-auto max-w-2xl px-6 py-12">
        <div className="mb-8 animate-slide-up">
          <button onClick={onBack} className="btn-ghost mb-4 -ml-4">
            <ArrowLeft className="h-4 w-4" />
            Back
          </button>
          <p className="section-label">Step 1 of 6</p>
          <h1 className="mt-2 font-serif text-3xl font-semibold text-ink-900">
            Set up your interview
          </h1>
          <p className="mt-3 text-sm text-ink-500">
            We only collect information that changes your experience. The interview type is
            fixed to Product Sense for this practice session.
          </p>
        </div>

        {/* Interview Type (fixed) */}
        <div className="card mb-6 animate-slide-up p-5" style={{ animationDelay: '60ms' }}>
          <div className="flex items-center gap-3">
            <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-primary-50">
              <Target className="h-5 w-5 text-primary-600" />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <h3 className="text-sm font-bold text-ink-800">Interview Type</h3>
                <span className="badge bg-primary-100 text-primary-700">Fixed</span>
              </div>
              <p className="mt-0.5 text-sm text-ink-500">
                Product Sense — the most common PM interview format
              </p>
            </div>
          </div>
        </div>

        {/* Experience Level */}
        <div className="mb-6 animate-slide-up" style={{ animationDelay: '120ms' }}>
          <div className="mb-3 flex items-center gap-2">
            <h3 className="text-sm font-bold text-ink-800">Experience Level</h3>
            <span className="badge bg-red-100 text-red-700">Required</span>
          </div>
          <div className="grid gap-3 sm:grid-cols-2">
            {EXPERIENCE_LEVELS.map((level) => (
              <button
                key={level.value}
                onClick={() => setExperience(level.value)}
                className={`card p-4 text-left transition-all ${
                  experience === level.value
                    ? 'border-primary-500 ring-2 ring-primary-500/20'
                    : 'hover:border-ink-300'
                }`}
              >
                <div className="text-sm font-bold text-ink-800">{level.label}</div>
                <div className="mt-1 text-xs text-ink-400">{level.desc}</div>
              </button>
            ))}
          </div>
        </div>

        {/* Target Domain */}
        <div className="mb-8 animate-slide-up" style={{ animationDelay: '180ms' }}>
          <div className="mb-3 flex items-center gap-2">
            <h3 className="text-sm font-bold text-ink-800">Target Domain</h3>
            <span className="badge bg-ink-100 text-ink-500">Optional</span>
          </div>
          <p className="mb-3 text-xs text-ink-400">
            This selects the case scenario. You can skip this and get a general product case.
          </p>
          <div className="grid gap-3 sm:grid-cols-2">
            {DOMAINS.map((d) => (
              <button
                key={d.value}
                onClick={() => setDomain(d.value)}
                className={`card p-4 text-left transition-all ${
                  domain === d.value
                    ? 'border-primary-500 ring-2 ring-primary-500/20'
                    : 'hover:border-ink-300'
                } ${domain === null && d.value === 'general' ? 'border-ink-300' : ''}`}
              >
                <div className="text-sm font-bold text-ink-800">{d.label}</div>
                <div className="mt-1 text-xs text-ink-400">{d.desc}</div>
              </button>
            ))}
          </div>
        </div>

        {/* What to expect */}
        <div className="card mb-8 animate-slide-up p-5" style={{ animationDelay: '240ms' }}>
          <div className="flex items-start gap-3">
            <Sparkles className="mt-0.5 h-5 w-5 shrink-0 text-accent-500" />
            <div>
              <h4 className="text-sm font-bold text-ink-800">What to expect</h4>
              <ul className="mt-2 space-y-1.5 text-xs text-ink-500">
                <li>• A realistic case prompt followed by adaptive follow-up questions</li>
                <li>• The interview covers four competencies (15–20 minutes)</li>
                <li>• Your responses are analyzed for specific behaviors</li>
                <li>• You receive evidence-linked feedback and a targeted practice exercise</li>
              </ul>
            </div>
          </div>
        </div>

        <button
          onClick={handleBegin}
          disabled={!canProceed}
          className="btn-primary w-full text-base py-4"
        >
          Begin Interview
          <ArrowRight className="h-5 w-5" />
        </button>
        {!canProceed && (
          <p className="mt-3 text-center text-xs text-ink-400">
            Select your experience level to continue
          </p>
        )}
      </div>
    </div>
  );
}
