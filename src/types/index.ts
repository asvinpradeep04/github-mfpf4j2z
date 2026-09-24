// ─── Primitive Types ───

export type Rating = 1 | 2 | 3 | 4;

export type CompetencyId =
  | 'problem_framing'
  | 'user_understanding'
  | 'prioritization_tradeoffs'
  | 'metrics_measurement';

export type Domain = 'fintech' | 'marketplace' | 'saas' | 'consumer' | 'general';

export type ExperienceLevel = '0-1' | '1-2' | '2-3' | '3+';

export type AttemptNumber = 1 | 2;

export type ResponseClassification =
  | 'ANSWER_COMPLETE'
  | 'ANSWER_PARTIAL'
  | 'MISSING_STRUCTURE'
  | 'MISSING_EVIDENCE'
  | 'PREMATURE_SOLUTION'
  | 'UNSUPPORTED_ASSUMPTION'
  | 'NEEDS_DEPTH'
  | 'STRONG_RESPONSE'
  | 'UNCLEAR_RESPONSE';

// ─── Setup ───

export interface SetupData {
  experienceLevel: ExperienceLevel;
  domain: Domain;
}

// ─── Case ───

export interface CasePrompt {
  id: string;
  title: string;
  prompt: string;
  domain: Domain;
  difficulty: string;
  competencies: CompetencyId[];
}

// ─── Competency & Rubric ───

export interface Competency {
  id: CompetencyId;
  name: string;
  shortName: string;
  description: string;
  icon: string;
}

export interface RubricLevel {
  rating: Rating;
  label: string;
  description: string;
}

export interface CompetencyRubric {
  competency: CompetencyId;
  levels: RubricLevel[];
}

// ─── Interview Messages ───

export interface InterviewMessage {
  id: string;
  role: 'interviewer' | 'candidate';
  text: string;
  competencyId?: CompetencyId;
  isFollowUp?: boolean;
  followUpPurpose?: string;
  timestamp: number;
}

// ─── Candidate Response ───

export interface CandidateResponse {
  responseId: string;
  attemptId: string;
  competencyId: CompetencyId;
  text: string;
  sequenceNumber: number;
  classification: ResponseClassification;
  createdAt: number;
}

// ─── Evidence ───

export interface EvidenceItem {
  evidenceId: string;
  responseId: string;
  competency: CompetencyId;
  sourceText: string;
  observedBehavior: string;
  impact: string;
  confidence: number;
}

// ─── Follow-Up ───

export interface FollowUp {
  targetCompetency: CompetencyId;
  missingEvidence: string[];
  purpose: string;
  question: string;
  stopCondition: string;
}

// ─── Assessment ───

export interface CompetencyAssessment {
  competencyId: CompetencyId;
  rating: Rating;
  evidenceIds: string[];
  evidenceCoverage: number;
  confidence: number;
  recommendation: string;
}

// ─── Feedback ───

export interface FeedbackItem {
  id: string;
  type: 'strength' | 'gap';
  observation: string;
  whyItMattered: string;
  whatShouldChange: string;
  competencyId: CompetencyId;
  evidenceIds: string[];
}

// ─── Practice Exercise ───

export interface PracticeExercise {
  targetGap: string;
  exercisePrompt: string;
  framework: string[];
  frameworkLabel: string;
  successCondition: string;
  evaluationCriteria: string[];
}

// ─── Attempt ───

export interface Attempt {
  attemptId: string;
  attemptNumber: AttemptNumber;
  caseId: string;
  rubricVersion: string;
  modelVersion: string;
  status: string;
  startedAt: number;
  completedAt: number;
  messages: InterviewMessage[];
  responses: CandidateResponse[];
  evidence: EvidenceItem[];
  assessments: CompetencyAssessment[];
  feedback: FeedbackItem[];
  practiceExercise: PracticeExercise | null;
  practiceResponse: string | null;
  overallRating: Rating;
}

// ─── Comparison ───

export interface CompetencyDelta {
  competencyId: CompetencyId;
  rating1: Rating;
  rating2: Rating;
  delta: number;
}

export interface BehavioralChange {
  competencyId: CompetencyId;
  description: string;
  improved: boolean;
}

export interface AttemptComparison {
  competencyDeltas: CompetencyDelta[];
  behavioralChanges: BehavioralChange[];
  overallDelta: number;
  addressedPracticeGoal: boolean;
  summary: string;
}
