-- 1. Create the database (Postgres requires this to be a separate command)
-- Run this first: CREATE DATABASE extension_security;

-- 2. Connect to the database
-- If using psql: \d extension_security

-- 3. Create Tables (IF NOT EXISTS is valid here)

CREATE TABLE IF NOT EXISTS extensions (
    id VARCHAR(255) PRIMARY KEY,
    name VARCHAR(255),
    version VARCHAR(50),
    enabled BOOLEAN DEFAULT true,
    threat_count INTEGER DEFAULT 0,
    last_scan TIMESTAMPTZ,
    risk_level VARCHAR(20)
);

CREATE TABLE IF NOT EXISTS threats (
    id SERIAL PRIMARY KEY,
    extension_id VARCHAR(255) REFERENCES extensions(id), -- Added a Foreign Key for data integrity
    type VARCHAR(100) NOT NULL,
    code TEXT,
    severity VARCHAR(20) NOT NULL,
    score INTEGER DEFAULT 0,
    patterns TEXT[],
    url TEXT,
    ai_analysis TEXT,
    ml_confidence FLOAT,
    timestamp TIMESTAMPTZ DEFAULT NOW()
);

-- 4. Create Indexes
-- Note: 'IF NOT EXISTS' for INDEX was added in Postgres 9.5+
CREATE INDEX IF NOT EXISTS idx_threats_severity ON threats (severity);

CREATE INDEX IF NOT EXISTS idx_threats_timestamp ON threats (timestamp DESC);

CREATE INDEX IF NOT EXISTS idx_threats_extension ON threats (extension_id);

CREATE INDEX IF NOT EXISTS idx_extensions_risk ON extensions (risk_level);

-- 5. Views for analytics
-- Use 'OR REPLACE' so you can update the view without deleting it first
CREATE OR REPLACE VIEW threat_summary AS
SELECT
    severity,
    COUNT(*) as count,
    AVG(score) as avg_score,
    DATE_TRUNC ('hour', timestamp) as hour
FROM threats
GROUP BY
    severity,
    hour
ORDER BY hour DESC;