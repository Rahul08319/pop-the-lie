CREATE TABLE public.daily_challenge_scores (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  player_name TEXT NOT NULL CHECK (char_length(player_name) BETWEEN 1 AND 20),
  score INTEGER NOT NULL CHECK (score >= 0),
  level INTEGER NOT NULL DEFAULT 1,
  best_combo INTEGER NOT NULL DEFAULT 0,
  challenge_seed TEXT NOT NULL,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

CREATE INDEX idx_daily_scores_seed_score ON public.daily_challenge_scores (challenge_seed, score DESC);

ALTER TABLE public.daily_challenge_scores ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Anyone can view daily scores"
  ON public.daily_challenge_scores
  FOR SELECT
  USING (true);

CREATE POLICY "Anyone can submit a daily score"
  ON public.daily_challenge_scores
  FOR INSERT
  WITH CHECK (true);
