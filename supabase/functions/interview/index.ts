import { createClient } from "npm:@supabase/supabase-js@2.57.4";

// ─── CORS Headers ───
const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Methods": "GET, POST, PUT, DELETE, OPTIONS",
  "Access-Control-Allow-Headers": "Content-Type, Authorization, X-Client-Info, Apikey",
};

// ─── Config ───
const SUPABASE_URL = Deno.env.get("SUPABASE_URL") ?? "";
const SERVICE_ROLE_KEY = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY") ?? "";
const AI_GATEWAY_API_KEY = Deno.env.get("AI_GATEWAY_API_KEY") ?? "";
const REALTIME_MODEL = Deno.env.get("REALTIME_MODEL") ?? "gpt-4o-realtime-preview-2024-12-17";
const EVALUATION_MODEL = Deno.env.get("EVALUATION_MODEL") ?? "gpt-4o-2024-11-20";
const CLASSIFICATION_MODEL = Deno.env.get("CLASSIFICATION_MODEL") ?? "gpt-4o-mini-2024-07-18";

const RUBRIC_VERSION = "ps_v1.0";
const PROMPT_VERSION = "interviewer_v1.0";
const CASE_VERSION = "cases_v1.0";
const MODEL_VERSION = EVALUATION_MODEL;

const admin = createClient(SUPABASE_URL, SERVICE_ROLE_KEY, {
  auth: { persistSession: false },
});

// ─── Types ───
interface ClassificationResult {
  classification: string;
  competency: string;
  observed_behaviors: string[];
  missing_evidence: string[];
  confidence: number;
  should_follow_up: boolean;
}

interface FollowUpResult {
  question: string;
  target_competency: string;
  missing_evidence: string[];
  purpose: string;
  stop_condition: string;
}

interface EvidenceItem {
  competency: string;
  source_text: string;
  observed_behavior: string;
  impact: string;
  confidence: number;
}

interface CompetencyAssessment {
  competency_id: string;
  rating: number;
  evidence_ids: string[];
  evidence_coverage: number;
  confidence: number;
  recommendation: string;
}

interface FeedbackItem {
  type: "strength" | "gap";
  observation: string;
  why_it_mattered: string;
  what_should_change: string;
  competency_id: string;
  evidence_ids: string[];
}

interface PracticeExercise {
  target_gap: string;
  exercise_prompt: string;
  framework: string[];
  framework_label: string;
  success_condition: string;
  evaluation_criteria: string[];
  expected_behavior: string;
}

// ─── Case Bank ───
const CASES = [
  { id: "fintech_retention_1", title: "Improving Retention for a Consumer Fintech App", prompt: "You are a PM at a consumer fintech app with 2M monthly active users. Over the past quarter, 30-day retention has dropped from 45% to 31%. The executive team is concerned. Walk me through how you would approach designing a feature or initiative to improve retention.", domain: "fintech" },
  { id: "fintech_retention_2", title: "Re-engaging Lapsed Users in a Budgeting App", prompt: "You are a PM at a personal budgeting app. Users who download the app set up a budget in the first session, but 60% never return after day 7. Design an approach to re-engage these lapsed users. Walk me through your thinking.", domain: "fintech" },
  { id: "marketplace_supply_1", title: "Growing Supply in a Local Services Marketplace", prompt: "You are a PM at a marketplace connecting homeowners with local service professionals (plumbers, electricians, cleaners). On the supply side, professional sign-ups have slowed and active listings are declining. How would you design an initiative to grow and retain supply?", domain: "marketplace" },
  { id: "marketplace_supply_2", title: "Improving Match Quality in a Freelancer Marketplace", prompt: "You are a PM at a freelancer marketplace. Clients post projects but 40% of posted projects never receive a proposal from a qualified freelancer. Design an approach to improve match quality and increase the proposal rate. Walk me through your thinking.", domain: "marketplace" },
  { id: "saas_activation_1", title: "Improving Trial-to-Paid Conversion in a B2B SaaS Tool", prompt: "You are a PM at a B2B project management SaaS. Users sign up for a 14-day free trial, but only 8% convert to paid. The team believes the onboarding experience is the bottleneck. Walk me through how you would approach designing a solution to improve trial-to-paid conversion.", domain: "saas" },
  { id: "saas_activation_2", title: "Reducing Churn in a Team Collaboration Tool", prompt: "You are a PM at a team collaboration SaaS. Companies that adopt the tool show a 35% churn rate within 90 days. You suspect that teams are not reaching their 'aha moment' quickly enough. Design an initiative to reduce early churn. Walk me through your thinking.", domain: "saas" },
  { id: "consumer_engagement_1", title: "Deepening Engagement in a Health Tracking App", prompt: "You are a PM at a consumer health tracking app. Users log their meals and workouts for the first week, but daily active usage drops sharply after that. Design a feature or initiative to deepen long-term engagement. Walk me through your approach.", domain: "consumer" },
  { id: "consumer_engagement_2", title: "Increasing Content Discovery in a Short-Video App", prompt: "You are a PM at a short-form video app. New users browse for a few minutes but many leave without following any creators or returning. Design an approach to improve content discovery and first-session retention. Walk me through your thinking.", domain: "consumer" },
  { id: "general_product_1", title: "Designing a Notification Strategy for a Mobile App", prompt: "You are a PM at a mobile app with 500K daily active users. Leadership wants to increase DAU by improving the notification strategy. Walk me through how you would approach designing a notification system that drives engagement without alienating users.", domain: "general" },
  { id: "general_product_2", title: "Designing an Onboarding Flow for a New Feature", prompt: "You are a PM at a productivity app. Your team is launching a new AI-powered task suggestion feature. Adoption of new features has historically been low. Walk me through how you would design the onboarding experience to maximize adoption.", domain: "general" },
];

function getCase(domain: string, attempt: number) {
  const domainCases = CASES.filter((c) => c.domain === domain);
  if (domainCases.length >= 2) return domainCases[attempt - 1];
  const generalCases = CASES.filter((c) => c.domain === "general");
  return generalCases[attempt - 1] ?? generalCases[0];
}

const COMPETENCIES = ["problem_framing", "user_understanding", "prioritization_tradeoffs", "metrics_measurement"];

const COMPETENCY_PROMPTS: Record<string, string> = {
  problem_framing: "To start — how would you frame the problem here? What is the core problem you're trying to solve, and who is most affected by it?",
  user_understanding: "Tell me more about the specific user segment you'd focus on. What do you know about their current behavior, pain points, and motivations?",
  prioritization_tradeoffs: "What approach would you take, and what alternatives did you consider? Walk me through your prioritization and the trade-offs involved.",
  metrics_measurement: "How would you measure success for this initiative? What metrics would tell you whether it's actually working?",
};

const COMPETENCY_TRANSITIONS = [
  "Good. Now let's shift to understanding the user more specifically.",
  "Let's move on to how you would prioritize and think about trade-offs.",
  "Finally, how would you measure whether your proposed approach is working?",
  "That covers all the areas I wanted to explore. Let me compile the evaluation.",
];

// ─── AI Provider Abstraction ───
async function callAI(model: string, messages: any[], schema?: any): Promise<any> {
  if (!AI_GATEWAY_API_KEY) {
    throw new Error("AI_GATEWAY_API_KEY is not configured");
  }

  const body: any = {
    model,
    messages,
    temperature: 0.3,
    max_tokens: 2000,
  };

  if (schema) {
    body.response_format = {
      type: "json_schema",
      json_schema: { name: "result", schema, strict: true },
    };
  }

  const response = await fetch("https://api.openai.com/v1/chat/completions", {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      Authorization: `Bearer ${AI_GATEWAY_API_KEY}`,
    },
    body: JSON.stringify(body),
  });

  if (!response.ok) {
    const errText = await response.text();
    throw new Error(`AI request failed (${response.status}): ${errText.substring(0, 200)}`);
  }

  const data = await response.json();
  const content = data.choices?.[0]?.message?.content;
  if (!content) throw new Error("AI returned empty response");
  return JSON.parse(content);
}

async function callAIWithRetry(model: string, messages: any[], schema?: any, retries = 1): Promise<any> {
  try {
    return await callAI(model, messages, schema);
  } catch (err) {
    if (retries > 0) {
      return await callAIWithRetry(model, messages, schema, retries - 1);
    }
    throw err;
  }
}

// ─── Schemas ───
const classificationSchema = {
  type: "object",
  properties: {
    classification: { type: "string", enum: ["ANSWER_COMPLETE", "ANSWER_PARTIAL", "MISSING_STRUCTURE", "MISSING_EVIDENCE", "PREMATURE_SOLUTION", "UNSUPPORTED_ASSUMPTION", "NEEDS_DEPTH", "STRONG_RESPONSE", "UNCLEAR_RESPONSE"] },
    competency: { type: "string" },
    observed_behaviors: { type: "array", items: { type: "string" } },
    missing_evidence: { type: "array", items: { type: "string" } },
    confidence: { type: "number" },
    should_follow_up: { type: "boolean" },
  },
  required: ["classification", "competency", "observed_behaviors", "missing_evidence", "confidence", "should_follow_up"],
  additionalProperties: false,
};

const followUpSchema = {
  type: "object",
  properties: {
    question: { type: "string" },
    target_competency: { type: "string" },
    missing_evidence: { type: "array", items: { type: "string" } },
    purpose: { type: "string" },
    stop_condition: { type: "string" },
  },
  required: ["question", "target_competency", "missing_evidence", "purpose", "stop_condition"],
  additionalProperties: false,
};

const evidenceSchema = {
  type: "object",
  properties: {
    evidence: {
      type: "array",
      items: {
        type: "object",
        properties: {
          competency: { type: "string" },
          source_text: { type: "string" },
          observed_behavior: { type: "string" },
          impact: { type: "string" },
          confidence: { type: "number" },
        },
        required: ["competency", "source_text", "observed_behavior", "impact", "confidence"],
        additionalProperties: false,
      },
    },
  },
  required: ["evidence"],
  additionalProperties: false,
};

const evaluationSchema = {
  type: "object",
  properties: {
    assessments: {
      type: "array",
      items: {
        type: "object",
        properties: {
          competency_id: { type: "string" },
          rating: { type: "integer", minimum: 1, maximum: 4 },
          evidence_coverage: { type: "number" },
          confidence: { type: "number" },
          recommendation: { type: "string" },
        },
        required: ["competency_id", "rating", "evidence_coverage", "confidence", "recommendation"],
        additionalProperties: false,
      },
    },
    feedback: {
      type: "array",
      items: {
        type: "object",
        properties: {
          type: { type: "string", enum: ["strength", "gap"] },
          observation: { type: "string" },
          why_it_mattered: { type: "string" },
          what_should_change: { type: "string" },
          competency_id: { type: "string" },
        },
        required: ["type", "observation", "why_it_mattered", "what_should_change", "competency_id"],
        additionalProperties: false,
      },
    },
    overall_rating: { type: "integer", minimum: 1, maximum: 4 },
  },
  required: ["assessments", "feedback", "overall_rating"],
  additionalProperties: false,
};

const practiceSchema = {
  type: "object",
  properties: {
    target_gap: { type: "string" },
    exercise_prompt: { type: "string" },
    framework: { type: "array", items: { type: "string" } },
    framework_label: { type: "string" },
    success_condition: { type: "string" },
    evaluation_criteria: { type: "array", items: { type: "string" } },
    expected_behavior: { type: "string" },
  },
  required: ["target_gap", "exercise_prompt", "framework", "framework_label", "success_condition", "evaluation_criteria", "expected_behavior"],
  additionalProperties: false,
};

const practiceEvalSchema = {
  type: "object",
  properties: {
    met: { type: "boolean" },
    met_criteria: { type: "array", items: { type: "string" } },
  },
  required: ["met", "met_criteria"],
  additionalProperties: false,
};

const comparisonSchema = {
  type: "object",
  properties: {
    competency_deltas: {
      type: "array",
      items: {
        type: "object",
        properties: {
          competency_id: { type: "string" },
          rating1: { type: "number" },
          rating2: { type: "number" },
          delta: { type: "number" },
        },
        required: ["competency_id", "rating1", "rating2", "delta"],
        additionalProperties: false,
      },
    },
    behavioral_changes: {
      type: "array",
      items: {
        type: "object",
        properties: {
          competency_id: { type: "string" },
          description: { type: "string" },
          improved: { type: "boolean" },
        },
        required: ["competency_id", "description", "improved"],
        additionalProperties: false,
      },
    },
    overall_delta: { type: "number" },
    addressed_practice_goal: { type: "boolean" },
    summary: { type: "string" },
  },
  required: ["competency_deltas", "behavioral_changes", "overall_delta", "addressed_practice_goal", "summary"],
  additionalProperties: false,
};

// ─── System Prompts ───
const INTERVIEWER_SYSTEM = `You are conducting a Product Sense interview for an early-career Product Manager position.

Your role is to evaluate how the candidate thinks. Do NOT coach the candidate during the interview.
Ask concise, purposeful questions. Do not reveal scores or competency ratings.
Do not explain what the candidate should have said. Do not unnecessarily praise the candidate.
Do not ask random follow-ups — every follow-up must have a specific information-gathering purpose.
Allow the candidate to finish speaking. Ask for clarification when evidence is missing.
Move forward when sufficient evidence has been collected.`;

function buildRubricContext(): string {
  return `RUBRIC (ps_v1.0):
1. Problem Framing: Defines problem before solution, identifies desired outcome, establishes constraints.
2. User Understanding: Identifies specific user segment, explains needs/pain points, connects problem to user behavior.
3. Prioritization & Trade-offs: Compares options, explains prioritization logic, acknowledges constraints/trade-offs.
4. Metrics & Measurement: Defines success, selects relevant metrics, connects metrics to proposed outcome.

RATINGS: 1=Emerging, 2=Developing, 3=Solid, 4=Strong`;
}

// ─── Route Handlers ───

async function handleStart(body: any): Promise<Response> {
  const { sessionId, experienceLevel, domain, attemptNumber } = body;
  const attemptNum = attemptNumber ?? 1;
  const selectedCase = getCase(domain ?? "general", attemptNum);

  // Create attempt
  const { data: attempt, error } = await admin.from("attempts").insert({
    session_id: sessionId,
    attempt_number: attemptNum,
    case_id: selectedCase.id,
    case_title: selectedCase.title,
    case_prompt: selectedCase.prompt,
    domain: domain ?? "general",
    status: "in_progress",
    current_competency_index: 0,
    rubric_version: RUBRIC_VERSION,
    model_version: MODEL_VERSION,
    prompt_version: PROMPT_VERSION,
    case_version: CASE_VERSION,
  }).select().single();

  if (error) throw new Error(`Failed to create attempt: ${error.message}`);

  // Update session with attempt reference
  if (attemptNum === 1) {
    await admin.from("sessions").update({ attempt1_id: attempt.id, status: "active", current_screen: "interview" }).eq("id", sessionId);
  } else {
    await admin.from("sessions").update({ attempt2_id: attempt.id, current_screen: "interview" }).eq("id", sessionId);
  }

  // Track event
  await admin.from("events").insert({ session_id: sessionId, event_type: attemptNum === 1 ? "interview_started" : "reattempt_started" });

  // Store initial interviewer message in transcript
  const initialPrompt = `${selectedCase.prompt}\n\n${COMPETENCY_PROMPTS.problem_framing}`;
  await admin.from("transcripts").insert({
    attempt_id: attempt.id,
    speaker: "interviewer",
    text: initialPrompt,
    competency_id: "problem_framing",
  });

  return json({ attemptId: attempt.id, case: selectedCase, initialPrompt });
}

async function handleRespond(body: any): Promise<Response> {
  const { attemptId, responseText, competencyId } = body;

  // 1. Save response FIRST (never lose a response)
  const { data: response, error: respError } = await admin.from("responses").insert({
    attempt_id: attemptId,
    competency_id: competencyId,
    text: responseText,
    sequence_number: Date.now(),
  }).select().single();
  if (respError) throw new Error(`Failed to save response: ${respError.message}`);

  // Store candidate message in transcript
  await admin.from("transcripts").insert({
    attempt_id: attemptId,
    speaker: "candidate",
    text: responseText,
    competency_id: competencyId,
    response_id: response.id,
  });

  // Get attempt for context
  const { data: attempt } = await admin.from("attempts").select().eq("id", attemptId).single();
  if (!attempt) throw new Error("Attempt not found");

  // Get previous evidence for context
  const { data: existingEvidence } = await admin.from("evidence").select().eq("attempt_id", attemptId);

  // 2. Classify response
  let classification: ClassificationResult;
  try {
    classification = await callAIWithRetry(CLASSIFICATION_MODEL, [
      { role: "system", content: `You are a response classification system for a PM interview. Analyze the candidate's response and classify it. ${buildRubricContext()}` },
      { role: "user", content: `Competency: ${competencyId}\nPrevious evidence count: ${existingEvidence?.length ?? 0}\nCandidate response: "${responseText}"\n\nClassify this response. Return JSON.` },
    ], classificationSchema);

    // Update response with classification
    await admin.from("responses").update({ classification: classification.classification }).eq("id", response.id);
  } catch (err) {
    // Fallback: still save evidence, use a safe default
    classification = {
      classification: "ANSWER_PARTIAL",
      competency: competencyId,
      observed_behaviors: [],
      missing_evidence: [],
      confidence: 0.5,
      should_follow_up: false,
    };
  }

  // 3. Extract evidence
  try {
    const evidenceResult = await callAIWithRetry(CLASSIFICATION_MODEL, [
      { role: "system", content: `Extract evidence from the candidate's PM interview response. Identify specific excerpts that demonstrate behaviors. ${buildRubricContext()}` },
      { role: "user", content: `Competency: ${competencyId}\nClassification: ${classification.classification}\nCandidate response: "${responseText}"\n\nExtract evidence items. Return JSON.` },
    ], evidenceSchema);

    // Save evidence to database
    if (evidenceResult.evidence && evidenceResult.evidence.length > 0) {
      const evidenceRows = evidenceResult.evidence.map((ev: any) => ({
        response_id: response.id,
        attempt_id: attemptId,
        competency: ev.competency,
        source_text: ev.source_text,
        observed_behavior: ev.observed_behavior,
        impact: ev.impact,
        confidence: ev.confidence,
      }));
      await admin.from("evidence").insert(evidenceRows);
    }
  } catch {
    // Evidence extraction failed — continue, response is already saved
  }

  // 4. Decide: follow-up or advance
  const currentCompIndex = attempt.current_competency_index;
  const followUpCount = attempt.follow_up_count;
  const totalFollowUps = attempt.total_follow_ups;
  const MAX_PER_COMP = 2;
  const MAX_TOTAL = 8;

  const shouldFollowUp = classification.should_follow_up &&
    followUpCount < MAX_PER_COMP &&
    totalFollowUps < MAX_TOTAL;

  if (shouldFollowUp) {
    // Generate follow-up
    let followUp: FollowUpResult;
    try {
      followUp = await callAIWithRetry(CLASSIFICATION_MODEL, [
        { role: "system", content: `Generate a follow-up question for a PM interview. The question must target specific missing evidence. ${buildRubricContext()}` },
        { role: "user", content: `Competency: ${competencyId}\nMissing evidence: ${classification.missing_evidence.join(", ")}\nPrevious response: "${responseText.substring(0, 500)}"\nFollow-up count: ${followUpCount}\n\nGenerate one purposeful follow-up question. Return JSON.` },
      ], followUpSchema);
    } catch {
      // Fallback follow-up
      followUp = {
        question: `Can you elaborate on that? Specifically, what evidence supports your reasoning here?`,
        target_competency: competencyId,
        missing_evidence: classification.missing_evidence,
        purpose: "Gather additional evidence for the current competency.",
        stop_condition: "Advance when sufficient evidence is provided.",
      };
    }

    // Store follow-up in transcript
    await admin.from("transcripts").insert({
      attempt_id: attemptId,
      speaker: "interviewer",
      text: followUp.question,
      competency_id: competencyId,
      is_follow_up: true,
      follow_up_purpose: followUp.purpose,
    });

    // Update attempt state
    await admin.from("attempts").update({
      follow_up_count: followUpCount + 1,
      total_follow_ups: totalFollowUps + 1,
    }).eq("id", attemptId);

    return json({
      type: "follow_up",
      followUp,
      classification,
      responseId: response.id,
    });
  }

  // Advance: move to next competency or complete
  const isLastCompetency = currentCompIndex >= COMPETENCIES.length - 1;

  if (isLastCompetency) {
    // Complete the interview
    await admin.from("attempts").update({
      status: "completed",
      completed_at: new Date().toISOString(),
    }).eq("id", attemptId);

    // Store completion message in transcript
    await admin.from("transcripts").insert({
      attempt_id: attemptId,
      speaker: "interviewer",
      text: COMPETENCY_TRANSITIONS[3],
    });

    // Track event
    await admin.from("events").insert({
      session_id: attempt.session_id,
      event_type: attempt.attempt_number === 1 ? "interview_completed" : "reattempt_completed",
    });

    return json({
      type: "complete",
      transitionMessage: COMPETENCY_TRANSITIONS[3],
      classification,
      responseId: response.id,
    });
  }

  // Transition to next competency
  const nextIndex = currentCompIndex + 1;
  const nextComp = COMPETENCIES[nextIndex];
  const transitionMsg = COMPETENCY_TRANSITIONS[currentCompIndex];
  const nextPrompt = COMPETENCY_PROMPTS[nextComp];

  await admin.from("transcripts").insert({
    attempt_id: attemptId,
    speaker: "interviewer",
    text: `${transitionMsg} ${nextPrompt}`,
    competency_id: nextComp,
  });

  await admin.from("attempts").update({
    current_competency_index: nextIndex,
    follow_up_count: 0,
  }).eq("id", attemptId);

  return json({
    type: "advance",
    nextCompetency: nextComp,
    transitionMessage: transitionMsg,
    nextPrompt,
    classification,
    responseId: response.id,
  });
}

async function handleGetState(attemptId: string): Promise<Response> {
  const { data: attempt, error } = await admin.from("attempts").select().eq("id", attemptId).single();
  if (error || !attempt) throw new Error("Attempt not found");

  const { data: transcripts } = await admin.from("transcripts")
    .select()
    .eq("attempt_id", attemptId)
    .order("timestamp", { ascending: true });

  const { data: responses } = await admin.from("responses")
    .select()
    .eq("attempt_id", attemptId)
    .order("created_at", { ascending: true });

  return json({
    attempt,
    transcripts: transcripts ?? [],
    responses: responses ?? [],
    currentCompetency: COMPETENCIES[attempt.current_competency_index],
  });
}

async function handleEvaluate(body: any): Promise<Response> {
  const { attemptId } = body;
  const { data: attempt, error } = await admin.from("attempts").select().eq("id", attemptId).single();
  if (error || !attempt) throw new Error("Attempt not found");

  // Gather all evidence and responses
  const { data: evidence } = await admin.from("evidence").select().eq("attempt_id", attemptId);
  const { data: responses } = await admin.from("responses").select().eq("attempt_id", attemptId);

  // Build context for evaluation
  const evidenceContext = (evidence ?? []).map((e: any) =>
    `[${e.competency}] "${e.source_text}" → ${e.observed_behavior} (confidence: ${e.confidence})`
  ).join("\n");

  const responseContext = (responses ?? []).map((r: any) =>
    `[${r.competency_id}] ${r.text.substring(0, 300)}`
  ).join("\n");

  let evaluation;
  try {
    evaluation = await callAIWithRetry(EVALUATION_MODEL, [
      { role: "system", content: `You are an evidence-first interview evaluator for a PM Product Sense interview. ${buildRubricContext()}

IMPORTANT: Rate based on OBSERVED EVIDENCE only. Never invent evidence. Each feedback item must reference actual candidate responses.` },
      { role: "user", content: `Case: ${attempt.case_title}\n\nResponses:\n${responseContext}\n\nEvidence:\n${evidenceContext}\n\nEvaluate all four competencies. Generate feedback items (strengths and gaps) with specific references to what the candidate said. Determine an overall rating. Return JSON.` },
    ], evaluationSchema);
  } catch {
    // Fallback: create basic assessments from evidence
    const assessments = COMPETENCIES.map((comp) => {
      const compEvidence = (evidence ?? []).filter((e: any) => e.competency === comp);
      return {
        competency_id: comp,
        rating: compEvidence.length > 2 ? 3 : compEvidence.length > 0 ? 2 : 1,
        evidence_coverage: Math.min(compEvidence.length / 3, 1),
        confidence: 0.5,
        recommendation: "Continue practicing this competency.",
      };
    });
    evaluation = {
      assessments,
      feedback: [],
      overall_rating: 2,
    };
  }

  // Save assessments
  const assessmentRows = evaluation.assessments.map((a: any) => ({
    attempt_id: attemptId,
    competency_id: a.competency_id,
    rating: a.rating,
    evidence_ids: (evidence ?? []).filter((e: any) => e.competency === a.competency_id).map((e: any) => e.id),
    evidence_coverage: a.evidence_coverage,
    confidence: a.confidence,
    recommendation: a.recommendation,
  }));
  await admin.from("competency_assessments").insert(assessmentRows);

  // Save feedback items
  if (evaluation.feedback && evaluation.feedback.length > 0) {
    const feedbackRows = evaluation.feedback.map((f: any) => ({
      attempt_id: attemptId,
      type: f.type,
      observation: f.observation,
      why_it_mattered: f.why_it_mattered,
      what_should_change: f.what_should_change,
      competency_id: f.competency_id,
      evidence_ids: (evidence ?? []).filter((e: any) => e.competency === f.competency_id).slice(0, 3).map((e: any) => e.id),
    }));
    await admin.from("feedback_items").insert(feedbackRows);
  }

  // Update attempt with overall rating
  await admin.from("attempts").update({ overall_rating: evaluation.overall_rating }).eq("id", attemptId);

  // Generate practice exercise
  const gaps = evaluation.feedback.filter((f: any) => f.type === "gap");
  const topGap = gaps[0]?.observation ?? "General product sense improvement";

  let practice: PracticeExercise;
  try {
    practice = await callAIWithRetry(EVALUATION_MODEL, [
      { role: "system", content: `Generate a targeted practice exercise for a PM interview candidate. The exercise must address the candidate's highest-impact weakness. ${buildRubricContext()}` },
      { role: "user", content: `Top gap: ${topGap}\nGaps: ${gaps.map((g: any) => g.observation).join("; ")}\n\nGenerate a practice exercise that targets this weakness. Include a framework, success condition, and evaluation criteria. Return JSON.` },
    ], practiceSchema);
  } catch {
    practice = {
      target_gap: topGap,
      exercise_prompt: "Approach this new product problem. Before proposing a solution, establish the user, problem, evidence, goal, options, trade-off, and decision.",
      framework: ["User", "Problem", "Evidence", "Goal", "Options", "Trade-off", "Decision"],
      framework_label: "User → Problem → Evidence → Goal → Options → Trade-off → Decision",
      success_condition: "The response defines a specific user, problem, and goal before proposing a solution.",
      evaluation_criteria: ["Defines a specific target user", "Identifies the core problem", "Establishes a desired outcome", "Considers alternatives before deciding"],
      expected_behavior: "Frame the problem before jumping to a solution.",
    };
  }

  // Save practice exercise
  const { data: practiceRow } = await admin.from("practice_exercises").insert({
    attempt_id: attemptId,
    target_gap: practice.target_gap,
    exercise_prompt: practice.exercise_prompt,
    framework: practice.framework,
    framework_label: practice.framework_label,
    success_condition: practice.success_condition,
    evaluation_criteria: practice.evaluation_criteria,
    expected_behavior: practice.expected_behavior,
  }).select().single();

  // Fetch all saved data for the response
  const { data: savedAssessments } = await admin.from("competency_assessments").select().eq("attempt_id", attemptId);
  const { data: savedFeedback } = await admin.from("feedback_items").select().eq("attempt_id", attemptId);
  const { data: savedEvidence } = await admin.from("evidence").select().eq("attempt_id", attemptId);
  const { data: savedPractice } = await admin.from("practice_exercises").select().eq("attempt_id", attemptId).maybeSingle();

  // Track event
  await admin.from("events").insert({ session_id: attempt.session_id, event_type: "feedback_viewed" });

  return json({
    attemptId,
    overallRating: evaluation.overall_rating,
    assessments: savedAssessments ?? [],
    feedback: savedFeedback ?? [],
    evidence: savedEvidence ?? [],
    practice: savedPractice,
    modelVersion: MODEL_VERSION,
    rubricVersion: RUBRIC_VERSION,
    promptVersion: PROMPT_VERSION,
  });
}

async function handleInsight(body: any): Promise<Response> {
  const { sessionId, insightText } = body;
  await admin.from("sessions").update({
    insight_text: insightText,
    insight_confirmed: true,
  }).eq("id", sessionId);

  await admin.from("events").insert({ session_id: sessionId, event_type: "insight_confirmed" });

  return json({ success: true });
}

async function handlePracticeSubmit(body: any): Promise<Response> {
  const { attemptId, exerciseId, responseText } = body;

  // Get exercise for criteria
  const { data: exercise } = await admin.from("practice_exercises").select().eq("id", exerciseId).maybeSingle();
  if (!exercise) throw new Error("Exercise not found");

  // Evaluate
  let evalResult;
  try {
    evalResult = await callAIWithRetry(CLASSIFICATION_MODEL, [
      { role: "system", content: `Evaluate a practice response against the success criteria. ${buildRubricContext()}` },
      { role: "user", content: `Exercise: ${exercise.exercise_prompt}\nSuccess condition: ${exercise.success_condition}\nCriteria: ${exercise.evaluation_criteria.join(", ")}\nResponse: "${responseText}"\n\nEvaluate whether the response meets the success condition. Return JSON.` },
    ], practiceEvalSchema);
  } catch {
    evalResult = { met: false, met_criteria: [] };
  }

  // Save practice response
  const { data: practiceResp } = await admin.from("practice_responses").insert({
    attempt_id: attemptId,
    exercise_id: exerciseId,
    text: responseText,
    met: evalResult.met,
    met_criteria: evalResult.met_criteria,
  }).select().single();

  // Track event
  const { data: attempt } = await admin.from("attempts").select("session_id").eq("id", attemptId).single();
  if (attempt) {
    await admin.from("events").insert({ session_id: attempt.session_id, event_type: "practice_completed" });
  }

  return json({ evaluation: evalResult, practiceResponseId: practiceResp?.id });
}

async function handleReattemptStart(body: any): Promise<Response> {
  const { sessionId, domain } = body;

  // Get attempt 1 for reference
  const { data: session } = await admin.from("sessions").select().eq("id", sessionId).single();
  if (!session) throw new Error("Session not found");

  const { data: attempt1 } = await admin.from("attempts").select().eq("id", session.attempt1_id).single();

  // Select a different but comparable case
  const selectedCase = getCase(domain ?? attempt1?.domain ?? "general", 2);

  const { data: attempt2, error } = await admin.from("attempts").insert({
    session_id: sessionId,
    attempt_number: 2,
    case_id: selectedCase.id,
    case_title: selectedCase.title,
    case_prompt: selectedCase.prompt,
    domain: domain ?? attempt1?.domain ?? "general",
    status: "in_progress",
    current_competency_index: 0,
    rubric_version: RUBRIC_VERSION,
    model_version: MODEL_VERSION,
    prompt_version: PROMPT_VERSION,
    case_version: CASE_VERSION,
  }).select().single();

  if (error) throw new Error(`Failed to create reattempt: ${error.message}`);

  await admin.from("sessions").update({ attempt2_id: attempt2.id, current_screen: "interview" }).eq("id", sessionId);
  await admin.from("events").insert({ session_id: sessionId, event_type: "reattempt_started" });

  const initialPrompt = `${selectedCase.prompt}\n\n${COMPETENCY_PROMPTS.problem_framing}`;
  await admin.from("transcripts").insert({
    attempt_id: attempt2.id,
    speaker: "interviewer",
    text: initialPrompt,
    competency_id: "problem_framing",
  });

  return json({ attemptId: attempt2.id, case: selectedCase, initialPrompt });
}

async function handleComparison(body: any): Promise<Response> {
  const { sessionId } = body;
  const { data: session } = await admin.from("sessions").select().eq("id", sessionId).single();
  if (!session) throw new Error("Session not found");

  const { data: attempt1 } = await admin.from("attempts").select().eq("id", session.attempt1_id).single();
  const { data: attempt2 } = await admin.from("attempts").select().eq("id", session.attempt2_id).single();
  if (!attempt1 || !attempt2) throw new Error("Both attempts must be completed");

  // Get assessments and evidence for both
  const { data: assess1 } = await admin.from("competency_assessments").select().eq("attempt_id", attempt1.id);
  const { data: assess2 } = await admin.from("competency_assessments").select().eq("attempt_id", attempt2.id);
  const { data: evidence1 } = await admin.from("evidence").select().eq("attempt_id", attempt1.id);
  const { data: evidence2 } = await admin.from("evidence").select().eq("attempt_id", attempt2.id);

  // Get practice exercise
  const { data: practice } = await admin.from("practice_exercises").select().eq("attempt_id", attempt1.id).maybeSingle();

  const assess1Map = new Map((assess1 ?? []).map((a: any) => [a.competency_id, a]));
  const assess2Map = new Map((assess2 ?? []).map((a: any) => [a.competency_id, a]));

  let comparison;
  try {
    comparison = await callAIWithRetry(EVALUATION_MODEL, [
      { role: "system", content: `Compare two PM interview attempts. Identify behavioral changes using evidence from both attempts. ${buildRubricContext()}

IMPORTANT: Use careful wording. Describe "observed improvement during the second simulation" — do NOT claim causal improvement.` },
      { role: "user", content: `Attempt 1 case: ${attempt1.case_title}
Attempt 1 ratings: ${COMPETENCIES.map((c) => `${c}: ${assess1Map.get(c)?.rating ?? 1}`).join(", ")}
Attempt 1 evidence: ${(evidence1 ?? []).map((e: any) => `[${e.competency}] ${e.source_text.substring(0, 100)}`).join("; ")}

Attempt 2 case: ${attempt2.case_title}
Attempt 2 ratings: ${COMPETENCIES.map((c) => `${c}: ${assess2Map.get(c)?.rating ?? 1}`).join(", ")}
Attempt 2 evidence: ${(evidence2 ?? []).map((e: any) => `[${e.competency}] ${e.source_text.substring(0, 100)}`).join("; ")}

Practice goal: ${practice?.target_gap ?? "N/A"}

Compare the two attempts. Return JSON.` },
    ], comparisonSchema);
  } catch {
    // Fallback: compute basic deltas
    const deltas = COMPETENCIES.map((c) => {
      const r1 = assess1Map.get(c)?.rating ?? 1;
      const r2 = assess2Map.get(c)?.rating ?? 1;
      return { competency_id: c, rating1: r1, rating2: r2, delta: r2 - r1 };
    });
    const overall1 = attempt1.overall_rating ?? 2;
    const overall2 = attempt2.overall_rating ?? 2;
    comparison = {
      competency_deltas: deltas,
      behavioral_changes: [],
      overall_delta: overall2 - overall1,
      addressed_practice_goal: deltas.some((d) => d.delta > 0),
      summary: "Comparison completed. See competency changes below.",
    };
  }

  // Save comparison
  await admin.from("attempt_comparisons").insert({
    session_id: sessionId,
    attempt1_id: attempt1.id,
    attempt2_id: attempt2.id,
    competency_deltas: comparison.competency_deltas,
    behavioral_changes: comparison.behavioral_changes,
    overall_delta: comparison.overall_delta,
    addressed_practice_goal: comparison.addressed_practice_goal,
    summary: comparison.summary,
  });

  await admin.from("events").insert({ session_id: sessionId, event_type: "reattempt_completed" });
  await admin.from("sessions").update({ current_screen: "comparison", status: "completed" }).eq("id", sessionId);

  return json({
    comparison,
    attempt1: { overallRating: attempt1.overall_rating, caseId: attempt1.case_id, caseTitle: attempt1.case_title },
    attempt2: { overallRating: attempt2.overall_rating, caseId: attempt2.case_id, caseTitle: attempt2.case_title },
  });
}

async function handleDispute(body: any): Promise<Response> {
  const { feedbackId } = body;
  await admin.from("feedback_items").update({ disputed: true }).eq("id", feedbackId);

  // Track event
  const { data: feedback } = await admin.from("feedback_items").select("attempt_id").eq("id", feedbackId).single();
  if (feedback) {
    const { data: attempt } = await admin.from("attempts").select("session_id").eq("id", feedback.attempt_id).single();
    if (attempt) {
      await admin.from("events").insert({ session_id: attempt.session_id, event_type: "feedback_disputed" });
    }
  }

  return json({ success: true });
}

async function handleEvent(body: any): Promise<Response> {
  const { sessionId, eventType, metadata } = body;
  await admin.from("events").insert({
    session_id: sessionId,
    event_type: eventType,
    metadata: metadata ?? {},
  });
  return json({ success: true });
}

async function handleGetTranscript(attemptId: string): Promise<Response> {
  const { data: transcripts, error } = await admin.from("transcripts")
    .select()
    .eq("attempt_id", attemptId)
    .order("timestamp", { ascending: true });
  if (error) throw new Error(`Failed to fetch transcript: ${error.message}`);
  return json({ transcripts: transcripts ?? [] });
}

async function handleGetEvaluation(attemptId: string): Promise<Response> {
  const { data: attempt } = await admin.from("attempts").select().eq("id", attemptId).single();
  if (!attempt) throw new Error("Attempt not found");

  const { data: assessments } = await admin.from("competency_assessments").select().eq("attempt_id", attemptId);
  const { data: feedback } = await admin.from("feedback_items").select().eq("attempt_id", attemptId);
  const { data: evidence } = await admin.from("evidence").select().eq("attempt_id", attemptId);
  const { data: practice } = await admin.from("practice_exercises").select().eq("attempt_id", attemptId).maybeSingle();

  return json({
    attemptId,
    overallRating: attempt.overall_rating,
    assessments: assessments ?? [],
    feedback: feedback ?? [],
    evidence: evidence ?? [],
    practice,
    modelVersion: attempt.model_version,
    rubricVersion: attempt.rubric_version,
    promptVersion: attempt.prompt_version,
  });
}

// ─── Realtime Token ───
async function handleRealtimeToken(body: any): Promise<Response> {
  if (!AI_GATEWAY_API_KEY) {
    return json({ error: "AI_GATEWAY_API_KEY is not configured. Add it in your Supabase project under Edge Functions > Secrets." }, 500);
  }

  // OpenAI Realtime API token endpoint
  const response = await fetch("https://api.openai.com/v1/realtime/sessions", {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      Authorization: `Bearer ${AI_GATEWAY_API_KEY}`,
    },
    body: JSON.stringify({
      model: REALTIME_MODEL,
      voice: "alloy",
      instructions: INTERVIEWER_SYSTEM + "\n\n" + buildRubricContext(),
    }),
  });

  if (!response.ok) {
    const errText = await response.text();
    return json({ error: `Failed to create realtime session: ${errText.substring(0, 200)}` }, 500);
  }

  const session = await response.json();
  return json({ token: session.client_secret?.value ?? session.id, sessionId: session.id, model: REALTIME_MODEL });
}

// ─── AI Verification ───
async function handleVerifyAI(): Promise<Response> {
  if (!AI_GATEWAY_API_KEY) {
    return json({ configured: false, error: "AI_GATEWAY_API_KEY is not set" });
  }

  try {
    const response = await fetch("https://api.openai.com/v1/chat/completions", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        Authorization: `Bearer ${AI_GATEWAY_API_KEY}`,
      },
      body: JSON.stringify({
        model: CLASSIFICATION_MODEL,
        messages: [{ role: "user", content: "Reply with exactly: OK" }],
        max_tokens: 5,
      }),
    });

    if (!response.ok) {
      const errText = await response.text();
      return json({ configured: true, success: false, error: `API request failed (${response.status}): ${errText.substring(0, 100)}` });
    }

    const data = await response.json();
    const content = data.choices?.[0]?.message?.content;
    return json({ configured: true, success: true, model: CLASSIFICATION_MODEL, response: content });
  } catch (err: any) {
    return json({ configured: true, success: false, error: err.message });
  }
}

// ─── Utilities ───
function json(data: any, status = 200): Response {
  return new Response(JSON.stringify(data), {
    status,
    headers: { ...corsHeaders, "Content-Type": "application/json" },
  });
}

function route(path: string, method: string, body: any): Promise<Response> | Response {
  // POST /interview?action=start
  const action = body?.action ?? "";

  if (method === "OPTIONS") {
    return new Response(null, { status: 200, headers: corsHeaders });
  }

  if (action === "start") return handleStart(body);
  if (action === "respond") return handleRespond(body);
  if (action === "state") return handleGetState(body.attemptId);
  if (action === "evaluate") return handleEvaluate(body);
  if (action === "insight") return handleInsight(body);
  if (action === "practice-submit") return handlePracticeSubmit(body);
  if (action === "reattempt-start") return handleReattemptStart(body);
  if (action === "comparison") return handleComparison(body);
  if (action === "dispute") return handleDispute(body);
  if (action === "event") return handleEvent(body);
  if (action === "transcript") return handleGetTranscript(body.attemptId);
  if (action === "evaluation") return handleGetEvaluation(body.attemptId);
  if (action === "realtime-token") return handleRealtimeToken(body);
  if (action === "verify-ai") return handleVerifyAI();

  return json({ error: `Unknown action: ${action}` }, 400);
}

// ─── Main Handler ───
Deno.serve(async (req: Request) => {
  if (req.method === "OPTIONS") {
    return new Response(null, { status: 200, headers: corsHeaders });
  }

  try {
    let body: any = {};
    if (req.method === "POST") {
      body = await req.json();
    } else if (req.method === "GET") {
      const url = new URL(req.url);
      body = {
        action: url.searchParams.get("action") ?? "",
        attemptId: url.searchParams.get("attemptId") ?? "",
        sessionId: url.searchParams.get("sessionId") ?? "",
      };
    }

    return await route(req.url, req.method, body);
  } catch (err: any) {
    return json({ error: err.message }, 500);
  }
});
