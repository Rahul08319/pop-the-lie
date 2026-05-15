ALTER TABLE public.daily_challenge_scores ADD COLUMN IF NOT EXISTS device_id text;
CREATE UNIQUE INDEX IF NOT EXISTS daily_challenge_scores_seed_device_unique ON public.daily_challenge_scores (challenge_seed, device_id) WHERE device_id IS NOT NULL;
CREATE INDEX IF NOT EXISTS daily_challenge_scores_seed_score_idx ON public.daily_challenge_scores (challenge_seed, score DESC);