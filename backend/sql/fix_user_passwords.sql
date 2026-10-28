-- Fix password_hash: must be bcrypt, not plain text
-- Passwords after this script:
--   yazidazhar@gmail.com  ->  yazid2004@
--   demo@capai.com        ->  fati2004@  (or use demo123 with the demo hash below)

UPDATE users
SET password_hash = '$2b$12$S3O/o13lmbo83nrODrit6u28oS1TIwkuAMDnjeMyqJ2EZBQq1aIQa',
    full_name = 'yazid'
WHERE lower(email) = lower('yazidazhar@gmail.com');

-- If the row was not saved yet, insert it:
INSERT INTO users (email, password_hash, full_name)
SELECT
    'yazidazhar@gmail.com',
    '$2b$12$S3O/o13lmbo83nrODrit6u28oS1TIwkuAMDnjeMyqJ2EZBQq1aIQa',
    'yazid'
WHERE NOT EXISTS (
    SELECT 1 FROM users WHERE lower(email) = lower('yazidazhar@gmail.com')
);

-- Restore Fatim Zahra / demo account with password: fati2004@
UPDATE users
SET password_hash = '$2b$12$TpECmq1tshBJf4ZlPq7QhuHvXqqzUAaLluT4d20d4ZGgDpOHYMfqC'
WHERE lower(email) = lower('demo@capai.com');
