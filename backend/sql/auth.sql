-- Users and history ownership for CAP AI auth

CREATE TABLE IF NOT EXISTS users (
    id BIGINT GENERATED ALWAYS AS IDENTITY PRIMARY KEY,
    email VARCHAR(255) NOT NULL UNIQUE,
    password_hash VARCHAR(255) NOT NULL,
    full_name VARCHAR(150) NOT NULL,
    created_at TIMESTAMPTZ NOT NULL DEFAULT CURRENT_TIMESTAMP
);

ALTER TABLE analysis_history
    ADD COLUMN IF NOT EXISTS user_id BIGINT REFERENCES users(id);

ALTER TABLE analysis_history
    ADD COLUMN IF NOT EXISTS result_json JSONB;

CREATE INDEX IF NOT EXISTS idx_analysis_history_user
    ON analysis_history(user_id, created_at DESC);

-- Demo user: demo@capai.com / demo123
INSERT INTO users (email, password_hash, full_name)
SELECT
    'demo@capai.com',
    '$2b$12$f6Zxc8h5rQSZrEhQeQeQHuxMBV5QkkpS9RptbJ3IEaVojWm1d7SpO',
    'Fatim Zahra'
WHERE NOT EXISTS (
    SELECT 1 FROM users WHERE email = 'demo@capai.com'
);
