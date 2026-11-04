CREATE TABLE npc_jobs (
  contract_id TEXT NOT NULL,
  match_id TEXT NOT NULL,
  round INTEGER NOT NULL,
  lease_token TEXT NOT NULL,
  lease_until INTEGER NOT NULL,
  tx_hash TEXT,
  status TEXT NOT NULL DEFAULT 'pending',
  PRIMARY KEY (contract_id, match_id, round)
);
