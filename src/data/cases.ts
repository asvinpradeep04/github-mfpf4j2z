import type { CasePrompt, Domain } from '@/types';

// Two comparable Product Sense cases per domain.
// Each pair tests the same competencies at similar difficulty.

export const CASES: CasePrompt[] = [
  // ─── Fintech ───
  {
    id: 'fintech_retention_1',
    title: 'Improving Retention for a Consumer Fintech App',
    prompt:
      'You are a PM at a consumer fintech app with 2M monthly active users. Over the past quarter, 30-day retention has dropped from 45% to 31%. The executive team is concerned. Walk me through how you would approach designing a feature or initiative to improve retention.',
    domain: 'fintech',
    difficulty: 'Early-career',
    competencies: ['problem_framing', 'user_understanding', 'prioritization_tradeoffs', 'metrics_measurement'],
  },
  {
    id: 'fintech_retention_2',
    title: 'Re-engaging Lapsed Users in a Budgeting App',
    prompt:
      'You are a PM at a personal budgeting app. Users who download the app set up a budget in the first session, but 60% never return after day 7. Design an approach to re-engage these lapsed users. Walk me through your thinking.',
    domain: 'fintech',
    difficulty: 'Early-career',
    competencies: ['problem_framing', 'user_understanding', 'prioritization_tradeoffs', 'metrics_measurement'],
  },
  // ─── Marketplace ───
  {
    id: 'marketplace_supply_1',
    title: 'Growing Supply in a Local Services Marketplace',
    prompt:
      'You are a PM at a marketplace connecting homeowners with local service professionals (plumbers, electricians, cleaners). On the supply side, professional sign-ups have slowed and active listings are declining. How would you design an initiative to grow and retain supply?',
    domain: 'marketplace',
    difficulty: 'Early-career',
    competencies: ['problem_framing', 'user_understanding', 'prioritization_tradeoffs', 'metrics_measurement'],
  },
  {
    id: 'marketplace_supply_2',
    title: 'Improving Match Quality in a Freelancer Marketplace',
    prompt:
      'You are a PM at a freelancer marketplace. Clients post projects but 40% of posted projects never receive a proposal from a qualified freelancer. Design an approach to improve match quality and increase the proposal rate. Walk me through your thinking.',
    domain: 'marketplace',
    difficulty: 'Early-career',
    competencies: ['problem_framing', 'user_understanding', 'prioritization_tradeoffs', 'metrics_measurement'],
  },
  // ─── SaaS ───
  {
    id: 'saas_activation_1',
    title: 'Improving Trial-to-Paid Conversion in a B2B SaaS Tool',
    prompt:
      'You are a PM at a B2B project management SaaS. Users sign up for a 14-day free trial, but only 8% convert to paid. The team believes the onboarding experience is the bottleneck. Walk me through how you would approach designing a solution to improve trial-to-paid conversion.',
    domain: 'saas',
    difficulty: 'Early-career',
    competencies: ['problem_framing', 'user_understanding', 'prioritization_tradeoffs', 'metrics_measurement'],
  },
  {
    id: 'saas_activation_2',
    title: 'Reducing Churn in a Team Collaboration Tool',
    prompt:
      'You are a PM at a team collaboration SaaS. Companies that adopt the tool show a 35% churn rate within 90 days. You suspect that teams are not reaching their "aha moment" quickly enough. Design an initiative to reduce early churn. Walk me through your thinking.',
    domain: 'saas',
    difficulty: 'Early-career',
    competencies: ['problem_framing', 'user_understanding', 'prioritization_tradeoffs', 'metrics_measurement'],
  },
  // ─── Consumer ───
  {
    id: 'consumer_engagement_1',
    title: 'Deepening Engagement in a Health Tracking App',
    prompt:
      'You are a PM at a consumer health tracking app. Users log their meals and workouts for the first week, but daily active usage drops sharply after that. Design a feature or initiative to deepen long-term engagement. Walk me through your approach.',
    domain: 'consumer',
    difficulty: 'Early-career',
    competencies: ['problem_framing', 'user_understanding', 'prioritization_tradeoffs', 'metrics_measurement'],
  },
  {
    id: 'consumer_engagement_2',
    title: 'Increasing Content Discovery in a Short-Video App',
    prompt:
      'You are a PM at a short-form video app. New users browse for a few minutes but many leave without following any creators or returning. Design an approach to improve content discovery and first-session retention. Walk me through your thinking.',
    domain: 'consumer',
    difficulty: 'Early-career',
    competencies: ['problem_framing', 'user_understanding', 'prioritization_tradeoffs', 'metrics_measurement'],
  },
  // ─── General (fallback) ───
  {
    id: 'general_product_1',
    title: 'Designing a Notification Strategy for a Mobile App',
    prompt:
      'You are a PM at a mobile app with 500K daily active users. Leadership wants to increase DAU by improving the notification strategy. Walk me through how you would approach designing a notification system that drives engagement without alienating users.',
    domain: 'general',
    difficulty: 'Early-career',
    competencies: ['problem_framing', 'user_understanding', 'prioritization_tradeoffs', 'metrics_measurement'],
  },
  {
    id: 'general_product_2',
    title: 'Designing an Onboarding Flow for a New Feature',
    prompt:
      'You are a PM at a productivity app. Your team is launching a new AI-powered task suggestion feature. Adoption of new features has historically been low. Walk me through how you would design the onboarding experience to maximize adoption.',
    domain: 'general',
    difficulty: 'Early-career',
    competencies: ['problem_framing', 'user_understanding', 'prioritization_tradeoffs', 'metrics_measurement'],
  },
];

export function getCaseForDomain(domain: Domain, attempt: 1 | 2): CasePrompt {
  const domainCases = CASES.filter((c) => c.domain === domain);
  if (domainCases.length >= 2) {
    return domainCases[attempt - 1];
  }
  const generalCases = CASES.filter((c) => c.domain === 'general');
  return generalCases[attempt - 1];
}
