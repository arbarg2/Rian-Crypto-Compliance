ALTER TABLE public.investigation_records
  ADD COLUMN IF NOT EXISTS is_flagged boolean NOT NULL DEFAULT false,
  ADD COLUMN IF NOT EXISTS flag_reason text,
  ADD COLUMN IF NOT EXISTS flagged_at timestamptz,
  ADD COLUMN IF NOT EXISTS case_priority text NOT NULL DEFAULT 'normal';
CREATE INDEX IF NOT EXISTS idx_investigation_records_flagged ON public.investigation_records (is_flagged) WHERE is_flagged;