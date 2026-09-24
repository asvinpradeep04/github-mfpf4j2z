/*
# Create AI Interview Readiness Schema

## Overview
Creates the full persistence layer for a voice-based AI PM interview simulator.
This is a single-tenant app (no auth/sign-in) -- all data is accessible via the anon key.

## New Tables
1. `sessions` -- Top-level practice cycle (one session = landing to comparison)
2. `attempts` -- Individual interview attempts (attempt 1 and reattempt)
3. `responses` -- Candidate responses (transcribed from voice)
4. `transcripts` -- Full conversation transcript (AI + candidate turns)
5. `evidence` -- Evidence items extracted from responses
6. `competency_assessments` -- Per-competency ratings after evaluation
7. `feedback_items` -- Strengths and gaps with evidence references
8. `practice_exercises` -- Generated practice targeting weakest competency
9. `practice_responses` -- Candidate's practice submission and evaluation
10. `attempt_comparisons` -- First vs second attempt comparison
11. `events` -- Analytics funnel tracking

## Security
- RLS enabled on all tables
- All policies use `TO anon, authenticated` since this is a no-auth app
- Data is intentionally shared/public (single-tenant prototype)
*/

-- Sessions table
CREATE TABLE IF NOT EXISTS sessions (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  experience_level text NOT NULL DEFAULT '0-1',
  domain text NOT NULL DEFAULT 'general',
  status text NOT NULL DEFAULT 'active',
  current_screen text NOT NULL DEFAULT 'landing',
  attempt1_id uuid,
  attempt2_id uuid,
  insight_text text,
  insight_confirmed boolean NOT NULL DEFAULT false,
  created_at timestamptz DEFAULT now(),
  updated_at timestamptz DEFAULT now()
);

ALTER TABLE sessions ENABLE ROW LEVEL SECURITY;
DROP POLICY IF EXISTS "anon_select_sessions" ON sessions;
CREATE POLICY "anon_select_sessions" ON sessions FOR SELECT TO anon, authenticated USING (true);
DROP POLICY IF EXISTS "anon_insert_sessions" ON sessions;
CREATE POLICY "anon_insert_sessions" ON sessions FOR INSERT TO anon, authenticated WITH CHECK (true);
DROP POLICY IF EXISTS "anon_update_sessions" ON sessions;
CREATE POLICY "anon_update_sessions" ON sessions FOR UPDATE TO anon, authenticated USING (true) WITH CHECK (true);
DROP POLICY IF EXISTS "anon_delete_sessions" ON sessions;
CREATE POLICY "anon_delete_sessions" ON sessions FOR DELETE TO anon, authenticated USING (true);

-- Attempts table
CREATE TABLE IF NOT EXISTS attempts (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  session_id uuid REFERENCES sessions(id) ON DELETE CASCADE,
  attempt_number int NOT NULL DEFAULT 1,
  case_id text NOT NULL,
  case_title text NOT NULL,
  case_prompt text NOT NULL,
  domain text NOT NULL DEFAULT 'general',
  status text NOT NULL DEFAULT 'in_progress',
  current_competency_index int NOT NULL DEFAULT 0,
  follow_up_count int NOT NULL DEFAULT 0,
  total_follow_ups int NOT NULL DEFAULT 0,
  overall_rating int NOT NULL DEFAULT 1,
  rubric_version text NOT NULL DEFAULT 'ps_v1.0',
  model_version text NOT NULL DEFAULT 'unknown',
  prompt_version text NOT NULL DEFAULT 'interviewer_v1.0',
  case_version text NOT NULL DEFAULT 'cases_v1.0',
  started_at timestamptz DEFAULT now(),
  completed_at timestamptz
);

ALTER TABLE attempts ENABLE ROW LEVEL SECURITY;
DROP POLICY IF EXISTS "anon_select_attempts" ON attempts;
CREATE POLICY "anon_select_attempts" ON attempts FOR SELECT TO anon, authenticated USING (true);
DROP POLICY IF EXISTS "anon_insert_attempts" ON attempts;
CREATE POLICY "anon_insert_attempts" ON attempts FOR INSERT TO anon, authenticated WITH CHECK (true);
DROP POLICY IF EXISTS "anon_update_attempts" ON attempts;
CREATE POLICY "anon_update_attempts" ON attempts FOR UPDATE TO anon, authenticated USING (true) WITH CHECK (true);
DROP POLICY IF EXISTS "anon_delete_attempts" ON attempts;
CREATE POLICY "anon_delete_attempts" ON attempts FOR DELETE TO anon, authenticated USING (true);

-- Responses table (candidate transcribed responses)
CREATE TABLE IF NOT EXISTS responses (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  attempt_id uuid REFERENCES attempts(id) ON DELETE CASCADE,
  competency_id text NOT NULL,
  text text NOT NULL,
  sequence_number int NOT NULL DEFAULT 1,
  classification text NOT NULL DEFAULT 'ANSWER_PARTIAL',
  created_at timestamptz DEFAULT now()
);

ALTER TABLE responses ENABLE ROW LEVEL SECURITY;
DROP POLICY IF EXISTS "anon_select_responses" ON responses;
CREATE POLICY "anon_select_responses" ON responses FOR SELECT TO anon, authenticated USING (true);
DROP POLICY IF EXISTS "anon_insert_responses" ON responses;
CREATE POLICY "anon_insert_responses" ON responses FOR INSERT TO anon, authenticated WITH CHECK (true);
DROP POLICY IF EXISTS "anon_update_responses" ON responses;
CREATE POLICY "anon_update_responses" ON responses FOR UPDATE TO anon, authenticated USING (true) WITH CHECK (true);
DROP POLICY IF EXISTS "anon_delete_responses" ON responses;
CREATE POLICY "anon_delete_responses" ON responses FOR DELETE TO anon, authenticated USING (true);

-- Transcripts table (full conversation: AI interviewer + candidate)
CREATE TABLE IF NOT EXISTS transcripts (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  attempt_id uuid REFERENCES attempts(id) ON DELETE CASCADE,
  speaker text NOT NULL,
  text text NOT NULL,
  competency_id text,
  is_follow_up boolean NOT NULL DEFAULT false,
  follow_up_purpose text,
  response_id uuid REFERENCES responses(id) ON DELETE SET NULL,
  timestamp timestamptz DEFAULT now()
);

ALTER TABLE transcripts ENABLE ROW LEVEL SECURITY;
DROP POLICY IF EXISTS "anon_select_transcripts" ON transcripts;
CREATE POLICY "anon_select_transcripts" ON transcripts FOR SELECT TO anon, authenticated USING (true);
DROP POLICY IF EXISTS "anon_insert_transcripts" ON transcripts;
CREATE POLICY "anon_insert_transcripts" ON transcripts FOR INSERT TO anon, authenticated WITH CHECK (true);
DROP POLICY IF EXISTS "anon_update_transcripts" ON transcripts;
CREATE POLICY "anon_update_transcripts" ON transcripts FOR UPDATE TO anon, authenticated USING (true) WITH CHECK (true);
DROP POLICY IF EXISTS "anon_delete_transcripts" ON transcripts;
CREATE POLICY "anon_delete_transcripts" ON transcripts FOR DELETE TO anon, authenticated USING (true);

-- Evidence table
CREATE TABLE IF NOT EXISTS evidence (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  response_id uuid REFERENCES responses(id) ON DELETE CASCADE,
  attempt_id uuid REFERENCES attempts(id) ON DELETE CASCADE,
  competency text NOT NULL,
  source_text text NOT NULL,
  observed_behavior text NOT NULL,
  impact text NOT NULL,
  confidence float8 NOT NULL DEFAULT 0.5,
  created_at timestamptz DEFAULT now()
);

ALTER TABLE evidence ENABLE ROW LEVEL SECURITY;
DROP POLICY IF EXISTS "anon_select_evidence" ON evidence;
CREATE POLICY "anon_select_evidence" ON evidence FOR SELECT TO anon, authenticated USING (true);
DROP POLICY IF EXISTS "anon_insert_evidence" ON evidence;
CREATE POLICY "anon_insert_evidence" ON evidence FOR INSERT TO anon, authenticated WITH CHECK (true);
DROP POLICY IF EXISTS "anon_update_evidence" ON evidence;
CREATE POLICY "anon_update_evidence" ON evidence FOR UPDATE TO anon, authenticated USING (true) WITH CHECK (true);
DROP POLICY IF EXISTS "anon_delete_evidence" ON evidence;
CREATE POLICY "anon_delete_evidence" ON evidence FOR DELETE TO anon, authenticated USING (true);

-- Competency assessments table
CREATE TABLE IF NOT EXISTS competency_assessments (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  attempt_id uuid REFERENCES attempts(id) ON DELETE CASCADE,
  competency_id text NOT NULL,
  rating int NOT NULL DEFAULT 1,
  evidence_ids text[] NOT NULL DEFAULT '{}',
  evidence_coverage float8 NOT NULL DEFAULT 0,
  confidence float8 NOT NULL DEFAULT 0.5,
  recommendation text NOT NULL DEFAULT ''
);

ALTER TABLE competency_assessments ENABLE ROW LEVEL SECURITY;
DROP POLICY IF EXISTS "anon_select_assessments" ON competency_assessments;
CREATE POLICY "anon_select_assessments" ON competency_assessments FOR SELECT TO anon, authenticated USING (true);
DROP POLICY IF EXISTS "anon_insert_assessments" ON competency_assessments;
CREATE POLICY "anon_insert_assessments" ON competency_assessments FOR INSERT TO anon, authenticated WITH CHECK (true);
DROP POLICY IF EXISTS "anon_update_assessments" ON competency_assessments;
CREATE POLICY "anon_update_assessments" ON competency_assessments FOR UPDATE TO anon, authenticated USING (true) WITH CHECK (true);
DROP POLICY IF EXISTS "anon_delete_assessments" ON competency_assessments;
CREATE POLICY "anon_delete_assessments" ON competency_assessments FOR DELETE TO anon, authenticated USING (true);

-- Feedback items table
CREATE TABLE IF NOT EXISTS feedback_items (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  attempt_id uuid REFERENCES attempts(id) ON DELETE CASCADE,
  type text NOT NULL DEFAULT 'gap',
  observation text NOT NULL,
  why_it_mattered text NOT NULL,
  what_should_change text NOT NULL,
  competency_id text NOT NULL,
  evidence_ids text[] NOT NULL DEFAULT '{}',
  disputed boolean NOT NULL DEFAULT false,
  created_at timestamptz DEFAULT now()
);

ALTER TABLE feedback_items ENABLE ROW LEVEL SECURITY;
DROP POLICY IF EXISTS "anon_select_feedback" ON feedback_items;
CREATE POLICY "anon_select_feedback" ON feedback_items FOR SELECT TO anon, authenticated USING (true);
DROP POLICY IF EXISTS "anon_insert_feedback" ON feedback_items;
CREATE POLICY "anon_insert_feedback" ON feedback_items FOR INSERT TO anon, authenticated WITH CHECK (true);
DROP POLICY IF EXISTS "anon_update_feedback" ON feedback_items;
CREATE POLICY "anon_update_feedback" ON feedback_items FOR UPDATE TO anon, authenticated USING (true) WITH CHECK (true);
DROP POLICY IF EXISTS "anon_delete_feedback" ON feedback_items;
CREATE POLICY "anon_delete_feedback" ON feedback_items FOR DELETE TO anon, authenticated USING (true);

-- Practice exercises table
CREATE TABLE IF NOT EXISTS practice_exercises (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  attempt_id uuid REFERENCES attempts(id) ON DELETE CASCADE,
  target_gap text NOT NULL,
  exercise_prompt text NOT NULL,
  framework text[] NOT NULL DEFAULT '{}',
  framework_label text NOT NULL DEFAULT '',
  success_condition text NOT NULL DEFAULT '',
  evaluation_criteria text[] NOT NULL DEFAULT '{}',
  expected_behavior text NOT NULL DEFAULT '',
  created_at timestamptz DEFAULT now()
);

ALTER TABLE practice_exercises ENABLE ROW LEVEL SECURITY;
DROP POLICY IF EXISTS "anon_select_practice_ex" ON practice_exercises;
CREATE POLICY "anon_select_practice_ex" ON practice_exercises FOR SELECT TO anon, authenticated USING (true);
DROP POLICY IF EXISTS "anon_insert_practice_ex" ON practice_exercises;
CREATE POLICY "anon_insert_practice_ex" ON practice_exercises FOR INSERT TO anon, authenticated WITH CHECK (true);
DROP POLICY IF EXISTS "anon_update_practice_ex" ON practice_exercises;
CREATE POLICY "anon_update_practice_ex" ON practice_exercises FOR UPDATE TO anon, authenticated USING (true) WITH CHECK (true);
DROP POLICY IF EXISTS "anon_delete_practice_ex" ON practice_exercises;
CREATE POLICY "anon_delete_practice_ex" ON practice_exercises FOR DELETE TO anon, authenticated USING (true);

-- Practice responses table
CREATE TABLE IF NOT EXISTS practice_responses (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  attempt_id uuid REFERENCES attempts(id) ON DELETE CASCADE,
  exercise_id uuid REFERENCES practice_exercises(id) ON DELETE CASCADE,
  text text NOT NULL,
  met boolean NOT NULL DEFAULT false,
  met_criteria text[] NOT NULL DEFAULT '{}',
  created_at timestamptz DEFAULT now()
);

ALTER TABLE practice_responses ENABLE ROW LEVEL SECURITY;
DROP POLICY IF EXISTS "anon_select_practice_resp" ON practice_responses;
CREATE POLICY "anon_select_practice_resp" ON practice_responses FOR SELECT TO anon, authenticated USING (true);
DROP POLICY IF EXISTS "anon_insert_practice_resp" ON practice_responses;
CREATE POLICY "anon_insert_practice_resp" ON practice_responses FOR INSERT TO anon, authenticated WITH CHECK (true);
DROP POLICY IF EXISTS "anon_update_practice_resp" ON practice_responses;
CREATE POLICY "anon_update_practice_resp" ON practice_responses FOR UPDATE TO anon, authenticated USING (true) WITH CHECK (true);
DROP POLICY IF EXISTS "anon_delete_practice_resp" ON practice_responses;
CREATE POLICY "anon_delete_practice_resp" ON practice_responses FOR DELETE TO anon, authenticated USING (true);

-- Attempt comparisons table
CREATE TABLE IF NOT EXISTS attempt_comparisons (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  session_id uuid REFERENCES sessions(id) ON DELETE CASCADE,
  attempt1_id uuid REFERENCES attempts(id) ON DELETE CASCADE,
  attempt2_id uuid REFERENCES attempts(id) ON DELETE CASCADE,
  competency_deltas jsonb NOT NULL DEFAULT '[]',
  behavioral_changes jsonb NOT NULL DEFAULT '[]',
  overall_delta float8 NOT NULL DEFAULT 0,
  addressed_practice_goal boolean NOT NULL DEFAULT false,
  summary text NOT NULL DEFAULT '',
  created_at timestamptz DEFAULT now()
);

ALTER TABLE attempt_comparisons ENABLE ROW LEVEL SECURITY;
DROP POLICY IF EXISTS "anon_select_comparisons" ON attempt_comparisons;
CREATE POLICY "anon_select_comparisons" ON attempt_comparisons FOR SELECT TO anon, authenticated USING (true);
DROP POLICY IF EXISTS "anon_insert_comparisons" ON attempt_comparisons;
CREATE POLICY "anon_insert_comparisons" ON attempt_comparisons FOR INSERT TO anon, authenticated WITH CHECK (true);
DROP POLICY IF EXISTS "anon_update_comparisons" ON attempt_comparisons;
CREATE POLICY "anon_update_comparisons" ON attempt_comparisons FOR UPDATE TO anon, authenticated USING (true) WITH CHECK (true);
DROP POLICY IF EXISTS "anon_delete_comparisons" ON attempt_comparisons;
CREATE POLICY "anon_delete_comparisons" ON attempt_comparisons FOR DELETE TO anon, authenticated USING (true);

-- Events table (analytics funnel)
CREATE TABLE IF NOT EXISTS events (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  session_id uuid REFERENCES sessions(id) ON DELETE CASCADE,
  event_type text NOT NULL,
  metadata jsonb NOT NULL DEFAULT '{}',
  created_at timestamptz DEFAULT now()
);

ALTER TABLE events ENABLE ROW LEVEL SECURITY;
DROP POLICY IF EXISTS "anon_select_events" ON events;
CREATE POLICY "anon_select_events" ON events FOR SELECT TO anon, authenticated USING (true);
DROP POLICY IF EXISTS "anon_insert_events" ON events;
CREATE POLICY "anon_insert_events" ON events FOR INSERT TO anon, authenticated WITH CHECK (true);
DROP POLICY IF EXISTS "anon_update_events" ON events;
CREATE POLICY "anon_update_events" ON events FOR UPDATE TO anon, authenticated USING (true) WITH CHECK (true);
DROP POLICY IF EXISTS "anon_delete_events" ON events;
CREATE POLICY "anon_delete_events" ON events FOR DELETE TO anon, authenticated USING (true);

-- Indexes for common queries
CREATE INDEX IF NOT EXISTS idx_attempts_session ON attempts(session_id);
CREATE INDEX IF NOT EXISTS idx_responses_attempt ON responses(attempt_id);
CREATE INDEX IF NOT EXISTS idx_transcripts_attempt ON transcripts(attempt_id);
CREATE INDEX IF NOT EXISTS idx_evidence_attempt ON evidence(attempt_id);
CREATE INDEX IF NOT EXISTS idx_evidence_response ON evidence(response_id);
CREATE INDEX IF NOT EXISTS idx_assessments_attempt ON competency_assessments(attempt_id);
CREATE INDEX IF NOT EXISTS idx_feedback_attempt ON feedback_items(attempt_id);
CREATE INDEX IF NOT EXISTS idx_events_session ON events(session_id);
CREATE INDEX IF NOT EXISTS idx_practice_ex_attempt ON practice_exercises(attempt_id);
CREATE INDEX IF NOT EXISTS idx_practice_resp_attempt ON practice_responses(attempt_id);
