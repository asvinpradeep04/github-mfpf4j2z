import { useState, useRef, useEffect, useCallback } from 'react';
import { Send, Clock, Info, CheckCircle2, AlertCircle, Loader2 } from 'lucide-react';
import { Header } from '@/components/Header';
import { CompetencyIcon } from '@/components/CompetencyIcon';
import { ProgressBar } from '@/components/ui';
import { COMPETENCIES, getCompetency } from '@/data/rubric';
import {
  classifyResponse,
  shouldProbeFurther,
  getFollowUp,
  collectEvidence,
  evaluateCompetency,
  generateFeedback,
  generatePracticeExercise,
  calculateOverallRating,
  resetCounters,
} from '@/data/simulation';
import type {
  Attempt,
  AttemptNumber,
  CasePrompt,
  CompetencyId,
  EvidenceItem,
  InterviewMessage,
  CandidateResponse,
  CompetencyAssessment,
  FeedbackItem,
  PracticeExercise,
  Rating,
  SetupData,
} from '@/types';

interface InterviewProps {
  setup: SetupData;
  casePrompt: CasePrompt;
  attemptNumber: AttemptNumber;
  onComplete: (attempt: Attempt) => void;
  onExit: () => void;
}

interface InterviewState {
  currentCompetencyIndex: number;
  followUpCount: number;
  totalFollowUps: number;
  phase: 'prompt' | 'awaiting_response' | 'classifying' | 'follow_up' | 'transition' | 'complete';
  evidence: EvidenceItem[];
  responses: CandidateResponse[];
  messages: InterviewMessage[];
  assessments: CompetencyAssessment[];
}

let msgCounter = 0;
function nextMsgId() {
  return `msg_${++msgCounter}`;
}

const MAX_FOLLOWUPS_PER_COMPETENCY = 2;
const MAX_TOTAL_FOLLOWUPS = 8;

export function Interview({ setup, casePrompt, attemptNumber, onComplete, onExit }: InterviewProps) {
  const [state, setState] = useState<InterviewState>({
    currentCompetencyIndex: 0,
    followUpCount: 0,
    totalFollowUps: 0,
    phase: 'prompt',
    evidence: [],
    responses: [],
    messages: [],
    assessments: [],
  });
  const [input, setInput] = useState('');
  const [isThinking, setIsThinking] = useState(false);
  const [startTime] = useState(Date.now());
  const [elapsedTime, setElapsedTime] = useState(0);
  const messagesEndRef = useRef<HTMLDivElement>(null);

  // Timer
  useEffect(() => {
    const interval = setInterval(() => {
      setElapsedTime(Math.floor((Date.now() - startTime) / 1000));
    }, 1000);
    return () => clearInterval(interval);
  }, [startTime]);

  // Scroll to bottom on new messages
  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [state.messages, isThinking]);

  // Present the initial case prompt on mount
  useEffect(() => {
    setState((prev) => ({
      ...prev,
      messages: [
        {
          id: nextMsgId(),
          role: 'interviewer',
          text: casePrompt.prompt,
          timestamp: Date.now(),
        },
      ],
      phase: 'awaiting_response',
    }));
  }, [casePrompt.prompt]);

  const currentCompetency = COMPETENCIES[state.currentCompetencyIndex];

  const formatTime = (seconds: number) => {
    const m = Math.floor(seconds / 60);
    const s = seconds % 60;
    return `${m}:${s.toString().padStart(2, '0')}`;
  };

  const handleSubmit = useCallback(async () => {
    if (!input.trim() || state.phase !== 'awaiting_response') return;

    const responseText = input.trim();
    setInput('');
    setIsThinking(true);

    // Add candidate message immediately
    const candidateMsg: InterviewMessage = {
      id: nextMsgId(),
      role: 'candidate',
      text: responseText,
      competencyId: currentCompetency.id,
      timestamp: Date.now(),
    };

    setState((prev) => ({
      ...prev,
      messages: [...prev.messages, candidateMsg],
      phase: 'classifying',
    }));

    // Simulate thinking delay for classification
    await new Promise((r) => setTimeout(r, 1200 + Math.random() * 800));

    // Classify the response
    const classification = classifyResponse(responseText, currentCompetency.id);

    // Collect evidence
    const newEvidence = collectEvidence(responseText, currentCompetency.id, classification);

    // Create response record
    const responseRecord: CandidateResponse = {
      responseId: newEvidence[0]?.responseId || `resp_${Date.now()}`,
      attemptId: `attempt_${attemptNumber}`,
      competencyId: currentCompetency.id,
      text: responseText,
      sequenceNumber: state.responses.length + 1,
      classification,
      createdAt: Date.now(),
    };

    // Decide: probe further or advance
    const shouldProbe = shouldProbeFurther(
      classification,
      state.followUpCount,
      MAX_FOLLOWUPS_PER_COMPETENCY,
    ) && state.totalFollowUps < MAX_TOTAL_FOLLOWUPS;

    if (shouldProbe) {
      // Generate a follow-up
      const followUp = getFollowUp(currentCompetency.id, state.followUpCount);
      if (followUp) {
        const followUpMsg: InterviewMessage = {
          id: nextMsgId(),
          role: 'interviewer',
          text: followUp.question,
          competencyId: currentCompetency.id,
          isFollowUp: true,
          followUpPurpose: followUp.purpose,
          timestamp: Date.now(),
        };

        setState((prev) => ({
          ...prev,
          evidence: [...prev.evidence, ...newEvidence],
          responses: [...prev.responses, responseRecord],
          messages: [...prev.messages, followUpMsg],
          followUpCount: prev.followUpCount + 1,
          totalFollowUps: prev.totalFollowUps + 1,
          phase: 'awaiting_response',
        }));
        setIsThinking(false);
        return;
      }
    }

    // Advance: competency complete, move to next or evaluate
    const transitionMsg: InterviewMessage = {
      id: nextMsgId(),
      role: 'interviewer',
      text: getNextCompetencyTransition(state.currentCompetencyIndex),
      timestamp: Date.now(),
    };

    const isLastCompetency = state.currentCompetencyIndex >= COMPETENCIES.length - 1;

    setState((prev) => ({
      ...prev,
      evidence: [...prev.evidence, ...newEvidence],
      responses: [...prev.responses, responseRecord],
      messages: [...prev.messages, transitionMsg],
      phase: 'transition',
    }));

    setIsThinking(false);

    // If last competency, evaluate after a short delay
    if (isLastCompetency) {
      await new Promise((r) => setTimeout(r, 1500));

      const allEvidence = [...state.evidence, ...newEvidence];
      const allResponses = [...state.responses, responseRecord];

      // Evaluate all competencies
      const assessments: CompetencyAssessment[] = COMPETENCIES.map((comp) =>
        evaluateCompetency(comp.id, allEvidence),
      );

      const feedback = generateFeedback(allEvidence, assessments);
      const practiceExercise = generatePracticeExercise(assessments, feedback);
      const overallRating = calculateOverallRating(assessments);

      const attempt: Attempt = {
        attemptId: `attempt_${attemptNumber}_${Date.now()}`,
        attemptNumber,
        caseId: casePrompt.id,
        rubricVersion: 'ps_v1.0',
        modelVersion: 'sim_v1.0',
        status: 'completed',
        startedAt: startTime,
        completedAt: Date.now(),
        messages: [...state.messages, candidateMsg, transitionMsg],
        responses: allResponses,
        evidence: allEvidence,
        assessments,
        feedback,
        practiceExercise,
        practiceResponse: null,
        overallRating,
      };

      setState((prev) => ({ ...prev, phase: 'complete' }));
      onComplete(attempt);
    } else {
      // Move to next competency after transition delay
      await new Promise((r) => setTimeout(r, 1500));

      const nextIndex = state.currentCompetencyIndex + 1;
      const nextComp = COMPETENCIES[nextIndex];
      const promptMsg: InterviewMessage = {
        id: nextMsgId(),
        role: 'interviewer',
        text: getCompetencyPrompt(nextComp.id, casePrompt),
        competencyId: nextComp.id,
        timestamp: Date.now(),
      };

      setState((prev) => ({
        ...prev,
        currentCompetencyIndex: nextIndex,
        followUpCount: 0,
        messages: [...prev.messages, promptMsg],
        phase: 'awaiting_response',
      }));
    }
  }, [input, state, currentCompetency, attemptNumber, casePrompt, startTime, onComplete]);

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      handleSubmit();
    }
  };

  return (
    <div className="flex min-h-screen flex-col bg-ink-50">
      <Header
        onLogoClick={onExit}
        rightContent={
          <div className="flex items-center gap-4">
            <div className="flex items-center gap-1.5 text-xs font-medium text-ink-500">
              <Clock className="h-3.5 w-3.5" />
              {formatTime(elapsedTime)}
            </div>
            <span className="badge bg-primary-50 text-primary-700">
              Attempt {attemptNumber}
            </span>
          </div>
        }
      />

      {/* Competency Progress Bar */}
      <div className="border-b border-ink-200 bg-white px-6 py-3">
        <div className="mx-auto flex max-w-3xl items-center gap-6">
          {COMPETENCIES.map((comp, i) => (
            <div
              key={comp.id}
              className={`flex items-center gap-2 text-xs font-medium transition-colors ${
                i === state.currentCompetencyIndex
                  ? 'text-primary-600'
                  : i < state.currentCompetencyIndex
                  ? 'text-ink-400'
                  : 'text-ink-300'
              }`}
            >
              <div
                className={`flex h-6 w-6 items-center justify-center rounded-full border-2 transition-all ${
                  i === state.currentCompetencyIndex
                    ? 'border-primary-500 bg-primary-50'
                    : i < state.currentCompetencyIndex
                    ? 'border-ink-300 bg-ink-100'
                    : 'border-ink-200'
                }`}
              >
                {i < state.currentCompetencyIndex ? (
                  <CheckCircle2 className="h-3.5 w-3.5 text-ink-400" />
                ) : (
                  <CompetencyIcon name={comp.icon} className="h-3 w-3" />
                )}
              </div>
              <span className="hidden sm:inline">{comp.shortName}</span>
            </div>
          ))}
        </div>
      </div>

      {/* Messages */}
      <div className="flex-1 overflow-y-auto">
        <div className="mx-auto max-w-3xl px-6 py-8">
          <div className="mb-6 rounded-lg border border-primary-200 bg-primary-50/50 p-4">
            <div className="flex items-start gap-3">
              <Info className="mt-0.5 h-4 w-4 shrink-0 text-primary-600" />
              <div>
                <p className="text-xs font-semibold uppercase tracking-wider text-primary-700">
                  Case: {casePrompt.title}
                </p>
                <p className="mt-1 text-xs text-ink-500">
                  Respond as you would in a real interview. The interviewer will ask follow-up
                  questions based on your answers.
                </p>
              </div>
            </div>
          </div>

          <div className="space-y-5">
            {state.messages.map((msg) => (
              <MessageBubble key={msg.id} message={msg} />
            ))}

            {isThinking && (
              <div className="flex items-center gap-2 text-sm text-ink-400 animate-fade-in">
                <Loader2 className="h-4 w-4 animate-spin" />
                <span>Interviewer is reviewing your response...</span>
              </div>
            )}

            {state.phase === 'transition' && (
              <div className="flex items-center gap-2 text-sm text-primary-600 animate-fade-in">
                <Loader2 className="h-4 w-4 animate-spin" />
                <span>Moving to next competency...</span>
              </div>
            )}

            <div ref={messagesEndRef} />
          </div>
        </div>
      </div>

      {/* Input */}
      <div className="border-t border-ink-200 bg-white px-6 py-4">
        <div className="mx-auto max-w-3xl">
          <div className="mb-2 flex items-center justify-between">
            <span className="text-xs font-medium text-ink-400">
              {currentCompetency.name}
              {state.followUpCount > 0 && (
                <span className="ml-2 text-ink-300">
                  · Follow-up {state.followUpCount}/{MAX_FOLLOWUPS_PER_COMPETENCY}
                </span>
              )}
            </span>
            <span className="text-xs text-ink-300">
              {state.totalFollowUps}/{MAX_TOTAL_FOLLOWUPS} total follow-ups
            </span>
          </div>
          <div className="flex gap-3">
            <textarea
              value={input}
              onChange={(e) => setInput(e.target.value)}
              onKeyDown={handleKeyDown}
              disabled={state.phase !== 'awaiting_response' || isThinking}
              placeholder="Type your response... (Enter to send, Shift+Enter for new line)"
              rows={3}
              className="input-field resize-none"
            />
            <button
              onClick={handleSubmit}
              disabled={!input.trim() || state.phase !== 'awaiting_response' || isThinking}
              className="btn-primary shrink-0 px-4"
            >
              <Send className="h-4 w-4" />
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}

function MessageBubble({ message }: { message: InterviewMessage }) {
  const isInterviewer = message.role === 'interviewer';

  if (isInterviewer) {
    return (
      <div className="flex gap-3 animate-slide-up">
        <div className="flex h-8 w-8 shrink-0 items-center justify-center rounded-full bg-primary-600 text-xs font-bold text-white">
          PM
        </div>
        <div className="flex-1">
          {message.isFollowUp && (
            <div className="mb-1.5 flex items-center gap-2">
              <span className="badge bg-accent-100 text-accent-700">
                <AlertCircle className="h-3 w-3" />
                Follow-up
              </span>
              {message.followUpPurpose && (
                <span className="text-[10px] italic text-ink-400">
                  Purpose: {message.followUpPurpose}
                </span>
              )}
            </div>
          )}
          <div className="rounded-lg rounded-tl-sm bg-white p-4 shadow-sm border border-ink-200">
            <p className="text-sm leading-relaxed text-ink-700 whitespace-pre-wrap">
              {message.text}
            </p>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="flex flex-row-reverse gap-3 animate-slide-in-right">
      <div className="flex h-8 w-8 shrink-0 items-center justify-center rounded-full bg-ink-700 text-xs font-bold text-white">
        You
      </div>
      <div className="flex-1">
        <div className="rounded-lg rounded-tr-sm bg-primary-600 p-4 shadow-sm">
          <p className="text-sm leading-relaxed text-white whitespace-pre-wrap">
            {message.text}
          </p>
        </div>
      </div>
    </div>
  );
}

function getNextCompetencyTransition(currentIndex: number): string {
  const transitions = [
    'Good. Now let\'s shift to understanding the user more specifically.',
    'Let\'s move on to how you would prioritize and think about trade-offs.',
    'Finally, how would you measure whether your proposed approach is working?',
    'That covers all the areas I wanted to explore. Let me compile the evaluation.',
  ];
  return transitions[currentIndex] || 'Let me compile the evaluation.';
}

function getCompetencyPrompt(competencyId: CompetencyId, casePrompt: CasePrompt): string {
  const prompts: Record<CompetencyId, string> = {
    problem_framing:
      'To start — how would you frame the problem here? What is the core problem you\'re trying to solve, and who is most affected by it?',
    user_understanding:
      'Tell me more about the specific user segment you\'d focus on. What do you know about their current behavior, pain points, and motivations?',
    prioritization_tradeoffs:
      'What approach would you take, and what alternatives did you consider? Walk me through your prioritization and the trade-offs involved.',
    metrics_measurement:
      'How would you measure success for this initiative? What metrics would tell you whether it\'s actually working?',
  };
  return prompts[competencyId];
}
