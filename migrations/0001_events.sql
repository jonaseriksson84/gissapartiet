CREATE TABLE events (
  id          INTEGER PRIMARY KEY AUTOINCREMENT,
  session_id  TEXT    NOT NULL,
  mp_id       TEXT    NOT NULL,
  guessed_party_id TEXT NOT NULL,
  correct_party_id TEXT NOT NULL,
  was_correct INTEGER NOT NULL,
  created_at  TEXT    NOT NULL
);

CREATE INDEX idx_events_session ON events (session_id);
CREATE INDEX idx_events_mp      ON events (mp_id);
CREATE INDEX idx_events_party   ON events (correct_party_id);
