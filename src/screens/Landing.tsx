import {
  ArrowRight,
  Target,
  Users,
  Scale,
  BarChart3,
  ClipboardCheck,
  Lightbulb,
  Dumbbell,
  Repeat,
  TrendingUp,
  CheckCircle2,
  FileText,
  ShieldCheck,
} from 'lucide-react';
import { Header } from '@/components/Header';
import { COMPETENCIES } from '@/data/rubric';
import { CompetencyIcon } from '@/components/CompetencyIcon';

interface LandingProps {
  onStart: () => void;
}

const PRODUCT_LOOP = [
  { icon: ClipboardCheck, label: 'Attempt', desc: 'Complete a realistic interview' },
  { icon: FileText, label: 'Evidence', desc: 'Capture how you reason' },
  { icon: Lightbulb, label: 'Diagnosis', desc: 'Identify specific gaps' },
  { icon: Dumbbell, label: 'Practice', desc: 'Target your weakness' },
  { icon: Repeat, label: 'Reattempt', desc: 'Prove improvement' },
  { icon: TrendingUp, label: 'Measured Change', desc: 'See what shifted' },
];

const WHAT_MAKES_DIFFERENT = [
  'Stateful interview pressure — not a chatbot',
  'Evidence-linked diagnosis, not generic advice',
  'Adaptive follow-ups with a real information-gathering purpose',
  'Comparable reattempts that measure behavioral change',
];

export function Landing({ onStart }: LandingProps) {
  return (
    <div className="min-h-screen bg-gradient-to-b from-ink-50 via-white to-ink-50">
      <Header />

      {/* Hero */}
      <section className="relative overflow-hidden">
        <div className="absolute inset-0 -z-10">
          <div className="absolute left-1/2 top-0 h-[400px] w-[600px] -translate-x-1/2 rounded-full bg-primary-100/40 blur-3xl" />
        </div>
        <div className="mx-auto max-w-4xl px-6 pt-20 pb-16 text-center">
          <div className="mb-6 inline-flex items-center gap-2 rounded-full border border-primary-200 bg-primary-50 px-4 py-1.5 text-xs font-semibold text-primary-700">
            <span className="relative flex h-2 w-2">
              <span className="absolute inline-flex h-full w-full animate-ping rounded-full bg-primary-400 opacity-75" />
              <span className="relative inline-flex h-2 w-2 rounded-full bg-primary-500" />
            </span>
            Product Sense Interview Simulator
          </div>
          <h1 className="font-serif text-4xl font-semibold leading-tight text-ink-900 sm:text-5xl">
            Practice a realistic PM interview.
            <br />
            <span className="text-primary-600">Discover what holds you back.</span>
            <br />
            Prove improvement in a second attempt.
          </h1>
          <p className="mx-auto mt-6 max-w-2xl text-lg leading-relaxed text-ink-500">
            Complete a structured Product Sense interview, receive evidence-linked feedback
            on specific behaviors, practice one targeted weakness, and see measurable change
            in a comparable second attempt.
          </p>
          <div className="mt-10 flex flex-col items-center gap-4">
            <button onClick={onStart} className="btn-primary text-base px-8 py-4">
              Start Product Sense Interview
              <ArrowRight className="h-5 w-5" />
            </button>
            <p className="text-xs text-ink-400">
              No signup required. 15–20 minutes per attempt.
            </p>
          </div>
        </div>
      </section>

      {/* Product Loop */}
      <section className="mx-auto max-w-5xl px-6 py-16">
        <div className="mb-10 text-center">
          <p className="section-label">The Practice Loop</p>
          <h2 className="mt-2 font-serif text-2xl font-semibold text-ink-800">
            A closed-loop system, not a question bank
          </h2>
        </div>
        <div className="grid grid-cols-2 gap-4 sm:grid-cols-3 lg:grid-cols-6">
          {PRODUCT_LOOP.map((step, i) => (
            <div
              key={step.label}
              className="card animate-slide-up p-4 text-center"
              style={{ animationDelay: `${i * 60}ms` }}
            >
              <div className="mx-auto mb-3 flex h-10 w-10 items-center justify-center rounded-lg bg-primary-50">
                <step.icon className="h-5 w-5 text-primary-600" />
              </div>
              <div className="text-xs font-semibold uppercase tracking-wider text-primary-600">
                {String(i + 1).padStart(2, '0')}
              </div>
              <div className="mt-1 text-sm font-bold text-ink-800">{step.label}</div>
              <div className="mt-1 text-xs text-ink-400">{step.desc}</div>
            </div>
          ))}
        </div>
      </section>

      {/* Competencies */}
      <section className="bg-white py-16">
        <div className="mx-auto max-w-4xl px-6">
          <div className="mb-10 text-center">
            <p className="section-label">What We Evaluate</p>
            <h2 className="mt-2 font-serif text-2xl font-semibold text-ink-800">
              Four core Product Sense competencies
            </h2>
            <p className="mt-3 text-sm text-ink-400">
              Each is scored against a behaviorally-anchored rubric. No competency is rated
              without sufficient evidence.
            </p>
          </div>
          <div className="grid gap-4 sm:grid-cols-2">
            {COMPETENCIES.map((comp, i) => (
              <div
                key={comp.id}
                className="card flex items-start gap-4 p-5 animate-slide-up"
                style={{ animationDelay: `${i * 80}ms` }}
              >
                <div className="flex h-11 w-11 shrink-0 items-center justify-center rounded-lg bg-primary-50">
                  <CompetencyIcon name={comp.icon} className="h-5 w-5 text-primary-600" />
                </div>
                <div>
                  <h3 className="text-sm font-bold text-ink-800">{comp.name}</h3>
                  <p className="mt-1 text-sm text-ink-500">{comp.description}</p>
                </div>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Why Different */}
      <section className="mx-auto max-w-4xl px-6 py-16">
        <div className="grid gap-8 lg:grid-cols-2">
          <div>
            <p className="section-label">Why Not Just Use ChatGPT?</p>
            <h2 className="mt-2 font-serif text-2xl font-semibold text-ink-800">
              Structured pressure, not casual chat
            </h2>
            <p className="mt-4 text-sm leading-relaxed text-ink-500">
              Candidates already have access to questions, frameworks, and AI assistants. What
              they lack is a reliable way to understand how they perform under realistic interview
              conditions, why their performance is weak, and what behavior they should change next.
            </p>
          </div>
          <div className="card p-6">
            <ul className="space-y-3">
              {WHAT_MAKES_DIFFERENT.map((item) => (
                <li key={item} className="flex items-start gap-3">
                  <CheckCircle2 className="mt-0.5 h-5 w-5 shrink-0 text-primary-500" />
                  <span className="text-sm text-ink-700">{item}</span>
                </li>
              ))}
            </ul>
          </div>
        </div>
      </section>

      {/* Trust */}
      <section className="bg-white py-16">
        <div className="mx-auto max-w-4xl px-6 text-center">
          <div className="mx-auto mb-6 flex h-12 w-12 items-center justify-center rounded-xl bg-primary-50">
            <ShieldCheck className="h-6 w-6 text-primary-600" />
          </div>
          <h2 className="font-serif text-2xl font-semibold text-ink-800">
            Every claim links to evidence
          </h2>
          <p className="mx-auto mt-4 max-w-2xl text-sm leading-relaxed text-ink-500">
            Feedback is grounded in your actual responses. You can see the exact excerpt, the
            behavior observed, why it mattered, and the recommended change. You can challenge any
            evaluation you disagree with.
          </p>
        </div>
      </section>

      {/* CTA */}
      <section className="mx-auto max-w-4xl px-6 py-20 text-center">
        <h2 className="font-serif text-3xl font-semibold text-ink-900">
          Ready to find out what's holding you back?
        </h2>
        <p className="mt-4 text-ink-500">
          One interview. One diagnosis. One practice exercise. One second chance.
        </p>
        <button onClick={onStart} className="btn-primary mt-8 text-base px-8 py-4">
          Start Product Sense Interview
          <ArrowRight className="h-5 w-5" />
        </button>
      </section>

      <footer className="border-t border-ink-200 py-8">
        <div className="mx-auto max-w-6xl px-6 text-center text-xs text-ink-400">
          AI Interview Readiness — Product Sense Simulator. This is a practice tool. Scores
          reflect simulation performance, not hiring probability.
        </div>
      </footer>
    </div>
  );
}
