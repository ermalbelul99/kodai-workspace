
ALTER TABLE public.challenges
  ADD COLUMN IF NOT EXISTS title_sq text,
  ADD COLUMN IF NOT EXISTS title_en text,
  ADD COLUMN IF NOT EXISTS description_sq text,
  ADD COLUMN IF NOT EXISTS description_en text,
  ADD COLUMN IF NOT EXISTS expected_output_sq text,
  ADD COLUMN IF NOT EXISTS expected_output_en text;

UPDATE public.challenges SET
  title_en = title,
  title_sq = title,
  description_en = description,
  description_sq = description,
  expected_output_en = expected_output,
  expected_output_sq = expected_output
WHERE title_en IS NULL;
