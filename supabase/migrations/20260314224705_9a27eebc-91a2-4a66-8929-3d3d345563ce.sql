
-- Waitlist leads table for pre-signup email capture
-- NOTE: Direct anon INSERT is temporary. Must be moved behind an Edge Function
-- with IP-based rate limiting and CAPTCHA verification in production.

CREATE TABLE public.waitlist_leads (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  email text NOT NULL,
  created_at timestamptz NOT NULL DEFAULT now(),
  CONSTRAINT waitlist_leads_email_format
    CHECK (email ~* '^[a-zA-Z0-9.!#$%&''*+/=?^_{|}~-]+@[a-zA-Z0-9](?:[a-zA-Z0-9-]{0,61}[a-zA-Z0-9])?(?:\.[a-zA-Z0-9](?:[a-zA-Z0-9-]{0,61}[a-zA-Z0-9])?)+$'),
  CONSTRAINT waitlist_leads_email_length CHECK (char_length(email) <= 254),
  UNIQUE (email)
);

ALTER TABLE public.waitlist_leads ENABLE ROW LEVEL SECURITY;

-- Write-only policy: anyone can submit, nobody can read/update/delete from client
CREATE POLICY "Anyone can join waitlist"
  ON public.waitlist_leads FOR INSERT
  TO anon, authenticated
  WITH CHECK (true);
