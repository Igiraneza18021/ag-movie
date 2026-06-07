-- Add durable audit run history and link change tracking for AG Movies admin sync jobs

CREATE TABLE IF NOT EXISTS audit_runs (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  command_key TEXT NOT NULL CHECK (command_key IN ('generate_audit', 'upload_dry_run', 'upload_apply')),
  status TEXT NOT NULL CHECK (status IN ('running', 'completed', 'failed')),
  artifact_markdown TEXT,
  summary_json JSONB NOT NULL DEFAULT '{}'::jsonb,
  log_lines JSONB NOT NULL DEFAULT '[]'::jsonb,
  started_at TIMESTAMP,
  finished_at TIMESTAMP,
  created_at TIMESTAMP DEFAULT NOW()
);

CREATE TABLE IF NOT EXISTS audit_change_log (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  audit_run_id UUID REFERENCES audit_runs(id) ON DELETE CASCADE,
  table_name TEXT NOT NULL,
  row_id UUID NOT NULL,
  field_name TEXT NOT NULL,
  match_key TEXT NOT NULL,
  old_value TEXT,
  new_value TEXT,
  reason TEXT NOT NULL,
  source_page_url TEXT,
  created_at TIMESTAMP DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_audit_runs_created_at ON audit_runs(created_at DESC);
CREATE INDEX IF NOT EXISTS idx_audit_runs_status ON audit_runs(status);
CREATE INDEX IF NOT EXISTS idx_audit_change_log_audit_run_id ON audit_change_log(audit_run_id);
CREATE INDEX IF NOT EXISTS idx_audit_change_log_table_row ON audit_change_log(table_name, row_id);

ALTER TABLE audit_runs ENABLE ROW LEVEL SECURITY;
ALTER TABLE audit_change_log ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "Service role manages audit runs" ON audit_runs;
DROP POLICY IF EXISTS "Service role manages audit change log" ON audit_change_log;

CREATE POLICY "Service role manages audit runs" ON audit_runs
  FOR ALL USING (auth.role() = 'service_role')
  WITH CHECK (auth.role() = 'service_role');

CREATE POLICY "Service role manages audit change log" ON audit_change_log
  FOR ALL USING (auth.role() = 'service_role')
  WITH CHECK (auth.role() = 'service_role');

GRANT ALL ON audit_runs TO service_role;
GRANT ALL ON audit_change_log TO service_role;
