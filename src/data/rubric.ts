import type { Competency, CompetencyId, CompetencyRubric, Rating } from '@/types';

export const COMPETENCIES: Competency[] = [
  {
    id: 'problem_framing',
    name: 'Problem Framing',
    shortName: 'Framing',
    description: 'Defines the problem before proposing solutions',
    icon: 'Target',
  },
  {
    id: 'user_understanding',
    name: 'User Understanding',
    shortName: 'Users',
    description: 'Identifies a specific user segment and their needs',
    icon: 'Users',
  },
  {
    id: 'prioritization_tradeoffs',
    name: 'Prioritization & Trade-offs',
    shortName: 'Trade-offs',
    description: 'Compares options and explains prioritization logic',
    icon: 'Scale',
  },
  {
    id: 'metrics_measurement',
    name: 'Metrics & Measurement',
    shortName: 'Metrics',
    description: 'Defines success and selects relevant metrics',
    icon: 'BarChart3',
  },
];

export const RUBRIC: Record<CompetencyId, CompetencyRubric> = {
  problem_framing: {
    competency: 'problem_framing',
    levels: [
      {
        rating: 1,
        label: 'Emerging',
        description:
          'Jumps to a solution with little or no definition of the user or problem.',
      },
      {
        rating: 2,
        label: 'Developing',
        description:
          'Identifies a broad problem but lacks specificity, evidence, or prioritization.',
      },
      {
        rating: 3,
        label: 'Solid',
        description:
          'Defines a reasonable user, problem, desired outcome, and relevant assumptions.',
      },
      {
        rating: 4,
        label: 'Strong',
        description:
          'Clearly frames the user, problem, evidence, outcome, constraints, and prioritization logic.',
      },
    ],
  },
  user_understanding: {
    competency: 'user_understanding',
    levels: [
      {
        rating: 1,
        label: 'Emerging',
        description:
          'References "users" generically without identifying a segment or specific needs.',
      },
      {
        rating: 2,
        label: 'Developing',
        description:
          'Identifies a user segment but lacks depth on their pain points or behaviors.',
      },
      {
        rating: 3,
        label: 'Solid',
        description:
          'Identifies a specific user segment, explains their needs, and connects the problem to user behavior.',
      },
      {
        rating: 4,
        label: 'Strong',
        description:
          'Paints a vivid picture of the target user with evidence-backed pain points, behaviors, and motivations.',
      },
    ],
  },
  prioritization_tradeoffs: {
    competency: 'prioritization_tradeoffs',
    levels: [
      {
        rating: 1,
        label: 'Emerging',
        description:
          'Proposes a single solution without considering alternatives or trade-offs.',
      },
      {
        rating: 2,
        label: 'Developing',
        description:
          'Mentions alternatives but does not explain prioritization logic or acknowledge constraints.',
      },
      {
        rating: 3,
        label: 'Solid',
        description:
          'Compares options, explains prioritization logic, and acknowledges key trade-offs.',
      },
      {
        rating: 4,
        label: 'Strong',
        description:
          'Systematically evaluates multiple options against criteria, explains trade-offs clearly, and justifies the chosen direction.',
      },
    ],
  },
  metrics_measurement: {
    competency: 'metrics_measurement',
    levels: [
      {
        rating: 1,
        label: 'Emerging',
        description:
          'Does not define success or select any metrics.',
      },
      {
        rating: 2,
        label: 'Developing',
        description:
          'Mentions generic metrics (e.g., "engagement") without connecting them to the proposed outcome.',
      },
      {
        rating: 3,
        label: 'Solid',
        description:
          'Defines success and selects relevant metrics connected to the proposed outcome.',
      },
      {
        rating: 4,
        label: 'Strong',
        description:
          'Defines a clear success criterion, selects primary and guardrail metrics, and explains how they would measure the proposed solution.',
      },
    ],
  },
};

export const RATING_LABELS: Record<Rating, string> = {
  1: 'Emerging',
  2: 'Developing',
  3: 'Solid',
  4: 'Strong',
};

export const RATING_COLORS: Record<Rating, string> = {
  1: 'bg-red-100 text-red-700 border-red-200',
  2: 'bg-accent-100 text-accent-700 border-accent-200',
  3: 'bg-primary-100 text-primary-700 border-primary-200',
  4: 'bg-green-100 text-green-700 border-green-200',
};

export const RATING_BAR_COLORS: Record<Rating, string> = {
  1: 'bg-red-400',
  2: 'bg-accent-400',
  3: 'bg-primary-500',
  4: 'bg-green-500',
};

export function getCompetency(id: CompetencyId): Competency {
  return COMPETENCIES.find((c) => c.id === id)!;
}

export function getRubricLevel(competencyId: CompetencyId, rating: Rating) {
  return RUBRIC[competencyId].levels.find((l) => l.rating === rating)!;
}

export function getCompetencyName(id: CompetencyId): string {
  return getCompetency(id).name;
}
