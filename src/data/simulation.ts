import type {
  CandidateResponse,
  CompetencyId,
  EvidenceItem,
  FeedbackItem,
  FollowUp,
  PracticeExercise,
  Rating,
  CompetencyAssessment,
  AttemptComparison,
  CompetencyDelta,
  BehavioralChange,
  Attempt,
  ResponseClassification,
} from '@/types';

// ─── Response Classification ───
// Analyzes candidate text for behavioral patterns using keyword detection.

const PREMATURE_SOLUTION_SIGNALS = [
  'add a rewards', 'add rewards', 'implement a rewards', 'push notification',
  'add a feature', 'build a feature', 'add a gamification', 'gamif',
  'create a leaderboard', 'add a referral', 'loyalty program',
  'send reminders', 'add a streak', 'badge system',
];

const USER_SIGNALS = [
  'user', 'segment', 'persona', 'target audience', 'customer',
  'who is', 'which user', 'specific user', 'power user', 'new user',
  'casual user', 'demographic',
];

const PROBLEM_SIGNALS = [
  'problem', 'pain point', 'issue', 'challenge', 'need',
  'why are', 'root cause', 'underlying', 'what is causing',
  'the goal is', 'desired outcome', 'we want to',
];

const EVIDENCE_SIGNALS = [
  'data', 'research', 'survey', 'interview', 'analytics',
  'metric', 'hypothesis', 'assume', 'assumption', 'evidence',
  'study', 'feedback', 'insight', 'observation',
];

const TRADEOFF_SIGNALS = [
  'trade-off', 'tradeoff', 'alternative', 'option', 'compare',
  'prioritize', 'cost', 'effort', 'impact', 'feasibility',
  'instead of', 'on the other hand', 'however', 'downside',
  'risk', 'constraint', 'limitation',
];

const METRIC_SIGNALS = [
  'metric', 'kpi', 'measure', 'success', 'north star',
  'conversion', 'retention rate', 'engagement rate', 'daU',
  'maU', 'churn', 'ctr', 'funnel', 'baseline', 'target',
];

const STRUCTURE_SIGNALS = [
  'first', 'second', 'then', 'finally', 'step',
  'approach', 'framework', 'structure', '1.', '2.', '3.',
  'to start', 'next', 'after that', 'in summary',
];

function containsAny(text: string, signals: string[]): boolean {
  const lower = text.toLowerCase();
  return signals.some((s) => lower.includes(s));
}

function countSignals(text: string, signals: string[]): number {
  const lower = text.toLowerCase();
  return signals.filter((s) => lower.includes(s)).length;
}

export function classifyResponse(
  text: string,
  competencyId: CompetencyId,
): ResponseClassification {
  const trimmed = text.trim();
  if (trimmed.length < 20) return 'UNCLEAR_RESPONSE';

  switch (competencyId) {
    case 'problem_framing': {
      const hasPrematureSolution = containsAny(trimmed, PREMATURE_SOLUTION_SIGNALS);
      const hasProblem = containsAny(trimmed, PROBLEM_SIGNALS);
      const hasUser = containsAny(trimmed, USER_SIGNALS);
      const hasEvidence = containsAny(trimmed, EVIDENCE_SIGNALS);

      if (hasPrematureSolution && !hasProblem && !hasUser) return 'PREMATURE_SOLUTION';
      if (!hasProblem && !hasUser) return 'MISSING_STRUCTURE';
      if (hasProblem && hasUser && hasEvidence) return 'STRONG_RESPONSE';
      if (hasProblem && hasUser) return 'ANSWER_COMPLETE';
      if (hasProblem || hasUser) return 'ANSWER_PARTIAL';
      return 'MISSING_EVIDENCE';
    }

    case 'user_understanding': {
      const hasUser = containsAny(trimmed, USER_SIGNALS);
      const hasEvidence = containsAny(trimmed, EVIDENCE_SIGNALS);
      const hasProblem = containsAny(trimmed, PROBLEM_SIGNALS);

      if (!hasUser) return 'MISSING_STRUCTURE';
      if (hasUser && hasEvidence && hasProblem) return 'STRONG_RESPONSE';
      if (hasUser && (hasEvidence || hasProblem)) return 'ANSWER_COMPLETE';
      if (hasUser) return 'ANSWER_PARTIAL';
      return 'NEEDS_DEPTH';
    }

    case 'prioritization_tradeoffs': {
      const hasTradeoffs = containsAny(trimmed, TRADEOFF_SIGNALS);
      const hasPremature = containsAny(trimmed, PREMATURE_SOLUTION_SIGNALS);

      if (hasPremature && !hasTradeoffs) return 'PREMATURE_SOLUTION';
      if (!hasTradeoffs) return 'MISSING_EVIDENCE';
      const signalCount = countSignals(trimmed, TRADEOFF_SIGNALS);
      if (signalCount >= 3) return 'STRONG_RESPONSE';
      if (signalCount >= 2) return 'ANSWER_COMPLETE';
      return 'ANSWER_PARTIAL';
    }

    case 'metrics_measurement': {
      const hasMetrics = containsAny(trimmed, METRIC_SIGNALS);
      if (!hasMetrics) return 'MISSING_EVIDENCE';
      const signalCount = countSignals(trimmed, METRIC_SIGNALS);
      if (signalCount >= 3) return 'STRONG_RESPONSE';
      if (signalCount >= 2) return 'ANSWER_COMPLETE';
      return 'ANSWER_PARTIAL';
    }

    default:
      return 'ANSWER_PARTIAL';
  }
}

// ─── Follow-Up Generation ───
// Each competency has follow-ups tied to missing evidence.

const FOLLOW_UPS: Record<CompetencyId, FollowUp[]> = {
  problem_framing: [
    {
      targetCompetency: 'problem_framing',
      missingEvidence: ['target_user', 'problem_definition'],
      purpose: 'Test whether the candidate can define the problem before proposing a solution.',
      question:
        'Before we go further into solutions — which customer segment are you prioritizing, and what specific problem are they experiencing that this initiative should solve?',
      stopCondition: 'Advance when the candidate identifies a specific user, problem, and desired outcome.',
    },
    {
      targetCompetency: 'problem_framing',
      missingEvidence: ['desired_outcome', 'constraints'],
      purpose: 'Test whether the candidate can articulate what success looks like and what constraints apply.',
      question:
        'What would success look like for this initiative, and what constraints (technical, budget, timeline) should we be aware of?',
      stopCondition: 'Advance when the candidate defines a desired outcome and acknowledges at least one constraint.',
    },
  ],
  user_understanding: [
    {
      targetCompetency: 'user_understanding',
      missingEvidence: ['specific_segment', 'pain_points'],
      purpose: 'Test whether the candidate can move beyond generic "users" to a specific segment with real pain points.',
      question:
        'Can you be more specific about which user segment is most affected? What do you know about their current behavior and pain points?',
      stopCondition: 'Advance when the candidate names a specific segment and describes at least one concrete pain point.',
    },
    {
      targetCompetency: 'user_understanding',
      missingEvidence: ['behavioral_evidence', 'motivation'],
      purpose: 'Test whether the candidate can connect user behavior to evidence or motivation.',
      question:
        'What evidence — whether from data, research, or user feedback — leads you to believe this segment behaves the way you described?',
      stopCondition: 'Advance when the candidate references some form of evidence or reasoning for user behavior.',
    },
  ],
  prioritization_tradeoffs: [
    {
      targetCompetency: 'prioritization_tradeoffs',
      missingEvidence: ['alternatives', 'comparison'],
      purpose: 'Test whether the candidate considers alternatives before committing to one approach.',
      question:
        'What other approaches did you consider, and why did you prioritize this one over the alternatives?',
      stopCondition: 'Advance when the candidate names at least one alternative and explains their reasoning.',
    },
    {
      targetCompetency: 'prioritization_tradeoffs',
      missingEvidence: ['tradeoff_acknowledgment', 'constraint_awareness'],
      purpose: 'Test whether the candidate can articulate trade-offs and constraints.',
      question:
        'What are the key trade-offs with your chosen approach? What would you be giving up, and what constraints make this the right call?',
      stopCondition: 'Advance when the candidate identifies at least one trade-off and one constraint.',
    },
  ],
  metrics_measurement: [
    {
      targetCompetency: 'metrics_measurement',
      missingEvidence: ['success_definition', 'primary_metric'],
      purpose: 'Test whether the candidate can define what success means for this initiative.',
      question:
        'How would you measure whether this initiative is actually working? What specific metric would you track as the primary success indicator?',
      stopCondition: 'Advance when the candidate names at least one specific, relevant metric.',
    },
    {
      targetCompetency: 'metrics_measurement',
      missingEvidence: ['guardrail_metrics', 'measurement_plan'],
      purpose: 'Test whether the candidate thinks beyond a single metric to guardrail metrics and a measurement plan.',
      question:
        'Beyond the primary metric, what guardrail metrics would you watch to make sure you are not causing unintended harm? And how would you set up the measurement?',
      stopCondition: 'Advance when the candidate identifies at least one guardrail metric.',
    },
  ],
};

export function getFollowUp(
  competencyId: CompetencyId,
  followUpIndex: number,
): FollowUp | null {
  const followUps = FOLLOW_UPS[competencyId];
  if (!followUps || followUpIndex >= followUps.length) return null;
  return followUps[followUpIndex];
}

export function shouldProbeFurther(
  classification: ResponseClassification,
  followUpCount: number,
  maxFollowUps: number = 2,
): boolean {
  if (followUpCount >= maxFollowUps) return false;
  return [
    'ANSWER_PARTIAL',
    'MISSING_STRUCTURE',
    'MISSING_EVIDENCE',
    'PREMATURE_SOLUTION',
    'UNSUPPORTED_ASSUMPTION',
    'NEEDS_DEPTH',
    'UNCLEAR_RESPONSE',
  ].includes(classification);
}

// ─── Evidence Collection ───

let evidenceCounter = 0;
let responseCounter = 0;

function generateId(prefix: string): string {
  const counter = prefix === 'ev' ? ++evidenceCounter : ++responseCounter;
  return `${prefix}_${Date.now()}_${counter}`;
}

export function resetCounters() {
  evidenceCounter = 0;
  responseCounter = 0;
}

export function collectEvidence(
  responseText: string,
  competencyId: CompetencyId,
  classification: ResponseClassification,
): EvidenceItem[] {
  const evidence: EvidenceItem[] = [];
  const responseId = generateId('resp');

  // Always collect at least one evidence item per response
  const behaviorMap: Record<ResponseClassification, { behavior: string; impact: string; confidence: number }> = {
    ANSWER_COMPLETE: {
      behavior: 'structured_answer',
      impact: 'The candidate provided a reasonably structured response covering key elements of the competency.',
      confidence: 0.82,
    },
    ANSWER_PARTIAL: {
      behavior: 'partial_answer',
      impact: 'The candidate addressed some aspects but left important elements unspecified.',
      confidence: 0.75,
    },
    MISSING_STRUCTURE: {
      behavior: 'unstructured_response',
      impact: 'The response lacked a clear logical structure, making it hard to evaluate reasoning.',
      confidence: 0.78,
    },
    MISSING_EVIDENCE: {
      behavior: 'unsupported_reasoning',
      impact: 'The candidate made claims without referencing evidence, data, or user insights.',
      confidence: 0.8,
    },
    PREMATURE_SOLUTION: {
      behavior: 'premature_solution',
      impact: 'The candidate proposed a solution before establishing which user problem mattered.',
      confidence: 0.91,
    },
    UNSUPPORTED_ASSUMPTION: {
      behavior: 'unsupported_assumption',
      impact: 'The candidate stated assumptions without acknowledging or validating them.',
      confidence: 0.85,
    },
    NEEDS_DEPTH: {
      behavior: 'surface_level_analysis',
      impact: 'The response stayed at a surface level without exploring underlying causes or motivations.',
      confidence: 0.77,
    },
    STRONG_RESPONSE: {
      behavior: 'well_structured_response',
      impact: 'The candidate demonstrated clear reasoning with evidence and structure.',
      confidence: 0.9,
    },
    UNCLEAR_RESPONSE: {
      behavior: 'unclear_response',
      impact: 'The response was too brief or unclear to evaluate effectively.',
      confidence: 0.6,
    },
  };

  const info = behaviorMap[classification];
  const excerpt = extractExcerpt(responseText);

  evidence.push({
    evidenceId: generateId('ev'),
    responseId,
    competency: competencyId,
    sourceText: excerpt,
    observedBehavior: info.behavior,
    impact: info.impact,
    confidence: info.confidence,
  });

  // Collect additional evidence for specific signals
  if (containsAny(responseText, PREMATURE_SOLUTION_SIGNALS) && competencyId === 'problem_framing') {
    evidence.push({
      evidenceId: generateId('ev'),
      responseId,
      competency: competencyId,
      sourceText: extractMatchingPhrase(responseText, PREMATURE_SOLUTION_SIGNALS),
      observedBehavior: 'solution_first_approach',
      impact: 'The candidate led with a solution before defining the problem, which risks building the wrong thing.',
      confidence: 0.93,
    });
  }

  if (containsAny(responseText, TRADEOFF_SIGNALS) && competencyId === 'prioritization_tradeoffs') {
    evidence.push({
      evidenceId: generateId('ev'),
      responseId,
      competency: competencyId,
      sourceText: extractMatchingPhrase(responseText, TRADEOFF_SIGNALS),
      observedBehavior: 'tradeoff_awareness',
      impact: 'The candidate acknowledged trade-offs, which shows mature product thinking.',
      confidence: 0.87,
    });
  }

  if (containsAny(responseText, METRIC_SIGNALS) && competencyId === 'metrics_measurement') {
    evidence.push({
      evidenceId: generateId('ev'),
      responseId,
      competency: competencyId,
      sourceText: extractMatchingPhrase(responseText, METRIC_SIGNALS),
      observedBehavior: 'metric_awareness',
      impact: 'The candidate identified relevant metrics, connecting the solution to measurable outcomes.',
      confidence: 0.86,
    });
  }

  return evidence;
}

function extractExcerpt(text: string, maxLen: number = 180): string {
  const trimmed = text.trim();
  if (trimmed.length <= maxLen) return trimmed;
  const truncated = trimmed.slice(0, maxLen);
  const lastSpace = truncated.lastIndexOf(' ');
  return truncated.slice(0, lastSpace > 0 ? lastSpace : maxLen) + '...';
}

function extractMatchingPhrase(text: string, signals: string[]): string {
  const lower = text.toLowerCase();
  for (const signal of signals) {
    const idx = lower.indexOf(signal);
    if (idx >= 0) {
      const start = Math.max(0, idx - 30);
      const end = Math.min(text.length, idx + signal.length + 60);
      let excerpt = text.slice(start, end).trim();
      if (start > 0) excerpt = '...' + excerpt;
      if (end < text.length) excerpt = excerpt + '...';
      return excerpt;
    }
  }
  return extractExcerpt(text);
}

// ─── Final Evaluation ───

export function evaluateCompetency(
  competencyId: CompetencyId,
  evidence: EvidenceItem[],
): CompetencyAssessment {
  const competencyEvidence = evidence.filter((e) => e.competency === competencyId);

  if (competencyEvidence.length === 0) {
    return {
      competencyId,
      rating: 1,
      evidenceIds: [],
      evidenceCoverage: 0,
      confidence: 0.3,
      recommendation: 'Insufficient evidence for a reliable rating. More probing was needed.',
    };
  }

  const behaviors = competencyEvidence.map((e) => e.observedBehavior);
  const hasPremature = behaviors.includes('premature_solution') || behaviors.includes('solution_first_approach');
  const hasStrong = behaviors.includes('well_structured_response') || behaviors.includes('tradeoff_awareness');
  const hasPartial = behaviors.includes('partial_answer') || behaviors.includes('surface_level_analysis');
  const hasMissing = behaviors.includes('unstructured_response') || behaviors.includes('unsupported_reasoning');
  const hasUnclear = behaviors.includes('unclear_response');

  const avgConfidence = competencyEvidence.reduce((sum, e) => sum + e.confidence, 0) / competencyEvidence.length;
  const evidenceCoverage = Math.min(1, competencyEvidence.length / 3);

  let rating: Rating = 2;

  if (hasUnclear && competencyEvidence.length === 1) {
    rating = 1;
  } else if (hasPremature && !hasStrong) {
    rating = 1;
  } else if (hasMissing && !hasStrong) {
    rating = 1;
  } else if (hasStrong && !hasPartial) {
    rating = 4;
  } else if (hasStrong || (hasPartial === false && !hasMissing)) {
    rating = 3;
  } else if (hasPartial) {
    rating = 2;
  }

  // Boost by one if strong evidence was collected across multiple responses
  if (competencyEvidence.length >= 3 && hasStrong) rating = Math.min(4, rating + 1) as Rating;
  // But cap at 3 if premature solution was observed
  if (hasPremature && rating > 2) rating = 2;

  const recommendations: Record<CompetencyId, string> = {
    problem_framing: 'Practice leading with the problem definition before proposing solutions.',
    user_understanding: 'Practice identifying specific user segments with concrete pain points and evidence.',
    prioritization_tradeoffs: 'Practice comparing at least two alternatives and articulating trade-offs explicitly.',
    metrics_measurement: 'Practice defining a primary success metric and at least one guardrail metric.',
  };

  return {
    competencyId,
    rating,
    evidenceIds: competencyEvidence.map((e) => e.evidenceId),
    evidenceCoverage,
    confidence: avgConfidence,
    recommendation: recommendations[competencyId],
  };
}

export function generateFeedback(
  evidence: EvidenceItem[],
  assessments: CompetencyAssessment[],
): FeedbackItem[] {
  const feedback: FeedbackItem[] = [];
  let fCounter = 0;

  // Identify strengths (rating 3+)
  for (const assessment of assessments) {
    if (assessment.rating >= 3) {
      const compEvidence = evidence.filter((e) => assessment.evidenceIds.includes(e.evidenceId));
      const positiveEvidence = compEvidence.find((e) =>
        ['well_structured_response', 'tradeoff_awareness', 'metric_awareness'].includes(e.observedBehavior)
      );
      if (positiveEvidence) {
        feedback.push({
          id: `fb_${++fCounter}`,
          type: 'strength',
          observation: positiveEvidence.sourceText,
          whyItMattered: getCompetencyName(assessment.competencyId) + ' was demonstrated with structured reasoning.',
          whatShouldChange: 'Continue this approach in future interviews — it is effective.',
          competencyId: assessment.competencyId,
          evidenceIds: [positiveEvidence.evidenceId],
        });
      }
    }
  }

  // Identify gaps (rating <= 2)
  for (const assessment of assessments) {
    if (assessment.rating <= 2) {
      const compEvidence = evidence.filter((e) => assessment.evidenceIds.includes(e.evidenceId));
      const gapEvidence = compEvidence.find((e) =>
        ['premature_solution', 'solution_first_approach', 'unstructured_response', 'unsupported_reasoning', 'partial_answer', 'surface_level_analysis'].includes(e.observedBehavior)
      ) || compEvidence[0];

      if (gapEvidence) {
        const gapMap: Record<string, { what: string; change: string }> = {
          premature_solution: {
            what: 'You proposed a solution before defining the target user or the problem.',
            change: 'Start with: User -> Problem -> Evidence -> Goal -> Options -> Trade-off -> Decision.',
          },
          solution_first_approach: {
            what: 'You led with a feature idea before establishing what problem it solves.',
            change: 'Frame the problem first. Name the user, the pain point, and the desired outcome before any solution.',
          },
          unstructured_response: {
            what: 'Your response lacked a clear logical structure.',
            change: 'Use an explicit framework: state your approach, then walk through each step.',
          },
          unsupported_reasoning: {
            what: 'You made claims without referencing evidence or data.',
            change: 'For each major claim, cite what evidence supports it — even if it is a hypothesis.',
          },
          partial_answer: {
            what: 'You addressed some elements but left important aspects unspecified.',
            change: 'After your initial answer, check: did I cover the user, the problem, and the outcome?',
          },
          surface_level_analysis: {
            what: 'Your analysis stayed at a surface level without exploring underlying causes.',
            change: 'Ask "why" at least three times to get to root causes before proposing solutions.',
          },
        };

        const gapInfo = gapMap[gapEvidence.observedBehavior] || {
          what: 'This competency area needs development.',
          change: 'Practice this competency with targeted exercises.',
        };

        feedback.push({
          id: `fb_${++fCounter}`,
          type: 'gap',
          observation: gapInfo.what,
          whyItMattered: gapEvidence.impact,
          whatShouldChange: gapInfo.change,
          competencyId: assessment.competencyId,
          evidenceIds: [gapEvidence.evidenceId],
        });
      }
    }
  }

  // Limit to top 3 gaps, sorted by confidence
  const gaps = feedback.filter((f) => f.type === 'gap');
  const strengths = feedback.filter((f) => f.type === 'strength');
  const topGaps = gaps
    .sort((a, b) => {
      const aConf = evidence.find((e) => e.evidenceId === a.evidenceIds[0])?.confidence || 0;
      const bConf = evidence.find((e) => e.evidenceId === b.evidenceIds[0])?.confidence || 0;
      return bConf - aConf;
    })
    .slice(0, 3);

  return [...strengths, ...topGaps];
}

export function generatePracticeExercise(
  assessments: CompetencyAssessment[],
  feedback: FeedbackItem[],
): PracticeExercise {
  // Find the lowest-rated competency
  const sorted = [...assessments].sort((a, b) => a.rating - b.rating);
  const weakest = sorted[0];

  const exercises: Record<CompetencyId, PracticeExercise> = {
    problem_framing: {
      targetGap: 'Premature solution selection',
      exercisePrompt:
        'Answer the following product question using a structured approach. A new social media platform is losing users after their first week. Design an approach to improve first-week retention.',
      framework: ['User', 'Problem', 'Evidence', 'Goal', 'Options', 'Trade-off', 'Decision'],
      frameworkLabel: 'User -> Problem -> Evidence -> Goal -> Options -> Trade-off -> Decision',
      successCondition:
        'Your response defines a specific user and problem before suggesting any solution.',
      evaluationCriteria: [
        'Identifies a specific user segment before proposing solutions',
        'Defines the problem with evidence or reasoning',
        'States a desired outcome or goal',
        'Considers at least two options before deciding',
      ],
    },
    user_understanding: {
      targetGap: 'Surface-level user analysis',
      exercisePrompt:
        'A meal delivery app is seeing high order frequency in week 1 but a sharp drop-off by week 3. Describe the target user segment most likely to churn and design an approach to retain them.',
      framework: ['Segment', 'Pain points', 'Behavior', 'Evidence', 'Motivation', 'Need', 'Solution'],
      frameworkLabel: 'Segment -> Pain points -> Behavior -> Evidence -> Motivation -> Need -> Solution',
      successCondition:
        'Your response names a specific user segment and describes at least one concrete pain point with evidence.',
      evaluationCriteria: [
        'Names a specific, non-generic user segment',
        'Describes concrete pain points, not just "they leave"',
        'References some form of evidence or reasoning',
        'Connects user motivation to the proposed approach',
      ],
    },
    prioritization_tradeoffs: {
      targetGap: 'Missing trade-off analysis',
      exercisePrompt:
        'Your team can only build one of three features this quarter: an onboarding redesign, a referral program, or a personalized feed. Walk through how you would prioritize and which you would choose.',
      framework: ['Options', 'Criteria', 'Impact', 'Effort', 'Trade-offs', 'Constraints', 'Decision'],
      frameworkLabel: 'Options -> Criteria -> Impact -> Effort -> Trade-offs -> Constraints -> Decision',
      successCondition:
        'Your response compares at least two alternatives and articulates specific trade-offs.',
      evaluationCriteria: [
        'Explicitly compares multiple options',
        'Defines prioritization criteria',
        'Acknowledges what is given up by the chosen option',
        'Identifies at least one constraint',
      ],
    },
    metrics_measurement: {
      targetGap: 'Undefined success metrics',
      exercisePrompt:
        'You are launching a new feature that lets users create collaborative playlists in a music app. Define how you would measure whether this feature is successful.',
      framework: ['Goal', 'Primary metric', 'Guardrail metrics', 'Baseline', 'Target', 'Timeframe', 'Measurement plan'],
      frameworkLabel: 'Goal -> Primary metric -> Guardrail metrics -> Baseline -> Target -> Timeframe -> Measurement plan',
      successCondition:
        'Your response defines a primary success metric and at least one guardrail metric.',
      evaluationCriteria: [
        'Defines a clear primary success metric',
        'Identifies at least one guardrail metric',
        'Connects metrics to the feature goal',
        'Mentions how the measurement would be set up',
      ],
    },
  };

  return exercises[weakest.competencyId];
}

// ─── Comparison ───

export function compareAttempts(
  attempt1: Attempt,
  attempt2: Attempt,
  practiceExercise: PracticeExercise | null,
): AttemptComparison {
  const competencyDeltas: CompetencyDelta[] = [];
  const behavioralChanges: BehavioralChange[] = [];

  for (const assessment1 of attempt1.assessments) {
    const assessment2 = attempt2.assessments.find(
      (a) => a.competencyId === assessment1.competencyId
    );
    if (!assessment2) continue;

    const delta = assessment2.rating - assessment1.rating;
    competencyDeltas.push({
      competencyId: assessment1.competencyId,
      rating1: assessment1.rating,
      rating2: assessment2.rating,
      delta,
    });

    // Generate behavioral change observations
    if (delta > 0) {
      behavioralChanges.push({
        competencyId: assessment1.competencyId,
        description: getImprovementDescription(assessment1.competencyId, assessment1.rating, assessment2.rating),
        improved: true,
      });
    } else if (delta < 0) {
      behavioralChanges.push({
        competencyId: assessment1.competencyId,
        description: `Your ${getCompetencyName(assessment1.competencyId).toLowerCase()} was weaker in the second attempt compared to the first.`,
        improved: false,
      });
    } else {
      behavioralChanges.push({
        competencyId: assessment1.competencyId,
        description: `Your ${getCompetencyName(assessment1.competencyId).toLowerCase()} remained consistent across both attempts.`,
        improved: false,
      });
    }
  }

  const overall1 = attempt1.assessments.reduce((s, a) => s + a.rating, 0) / attempt1.assessments.length;
  const overall2 = attempt2.assessments.reduce((s, a) => s + a.rating, 0) / attempt2.assessments.length;
  const overallDelta = overall2 - overall1;

  // Check if the candidate addressed the practice goal
  let addressedPracticeGoal = false;
  if (practiceExercise && attempt2.evidence.length > 0) {
    const weakestCompetency = attempt1.assessments.sort((a, b) => a.rating - b.rating)[0];
    const attempt2Assessment = attempt2.assessments.find(
      (a) => a.competencyId === weakestCompetency.competencyId
    );
    addressedPracticeGoal = attempt2Assessment ? attempt2Assessment.rating > weakestCompetency.rating : false;
  }

  const improvedCount = behavioralChanges.filter((b) => b.improved).length;
  let summary: string;
  if (overallDelta > 0.5) {
    summary = 'Observed meaningful improvement during the second simulation, particularly in the targeted competency area.';
  } else if (overallDelta > 0) {
    summary = 'Observed modest improvement during the second simulation. Some behaviors shifted in the right direction.';
  } else if (overallDelta === 0) {
    summary = 'Performance was consistent across both attempts. The targeted practice may need more repetition to produce visible change.';
  } else {
    summary = 'The second attempt did not show improvement. This is normal — behavioral change takes deliberate practice over multiple sessions.';
  }

  return {
    competencyDeltas,
    behavioralChanges,
    overallDelta,
    addressedPracticeGoal,
    summary,
  };
}

function getImprovementDescription(competencyId: CompetencyId, r1: Rating, r2: Rating): string {
  const descriptions: Record<CompetencyId, string> = {
    problem_framing:
      r2 >= 3
        ? 'Your second response established a problem definition and target user before proposing a solution. This was not present in the first attempt.'
        : 'Your second response showed more awareness of the problem space, though it could still be more structured.',
    user_understanding:
      r2 >= 3
        ? 'In the second attempt, you identified a specific user segment with concrete pain points, which was missing in the first response.'
        : 'Your second response showed more specificity about users, though it could go deeper.',
    prioritization_tradeoffs:
      r2 >= 3
        ? 'Your second response explicitly compared alternatives and acknowledged trade-offs, which was absent in the first attempt.'
        : 'Your second response showed more awareness of alternatives, though trade-offs could be more explicit.',
    metrics_measurement:
      r2 >= 3
        ? 'In the second attempt, you defined clear success metrics and connected them to the proposed outcome, which was missing in the first response.'
        : 'Your second response included more metric awareness, though it could be more specific.',
  };
  return descriptions[competencyId];
}

function getCompetencyName(id: CompetencyId): string {
  const names: Record<CompetencyId, string> = {
    problem_framing: 'Problem Framing',
    user_understanding: 'User Understanding',
    prioritization_tradeoffs: 'Prioritization & Trade-offs',
    metrics_measurement: 'Metrics & Measurement',
  };
  return names[id];
}

// ─── Practice Evaluation ───

export function evaluatePracticeResponse(
  text: string,
  exercise: PracticeExercise,
): { met: boolean; metCriteria: string[] } {
  const lower = text.toLowerCase();
  const metCriteria: string[] = [];

  if (containsAny(lower, USER_SIGNALS)) metCriteria.push('Identifies a specific user segment');
  if (containsAny(lower, PROBLEM_SIGNALS) || containsAny(lower, ['pain', 'need', 'issue'])) metCriteria.push('Defines the problem');
  if (containsAny(lower, EVIDENCE_SIGNALS)) metCriteria.push('References evidence');
  if (containsAny(lower, TRADEOFF_SIGNALS) || containsAny(lower, ['option', 'alternative', 'compare'])) metCriteria.push('Considers alternatives');

  // Check if solution comes after problem framing
  const hasProblemFirst = (() => {
    const problemIdx = lower.search(/problem|pain|need|user/);
    const solutionIdx = lower.search(/build|add|implement|feature|solution|create/);
    return problemIdx >= 0 && (solutionIdx === -1 || problemIdx < solutionIdx);
  })();

  if (hasProblemFirst) metCriteria.push('Frames the problem before proposing solutions');

  const met = metCriteria.length >= 2;
  return { met, metCriteria };
}

// ─── Overall Readiness ───

export function calculateOverallRating(assessments: CompetencyAssessment[]): Rating {
  if (assessments.length === 0) return 1;
  const avg = assessments.reduce((s, a) => s + a.rating, 0) / assessments.length;
  return Math.round(avg) as Rating;
}
