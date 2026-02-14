-- PostgreSQL Database Schema for Нет Гард
-- This replaces the SQLite schema with full PostgreSQL features

-- Enable UUID extension
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";

-- Extensions table: Stores monitored browser extensions
CREATE TABLE extensions (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    extension_id VARCHAR(255) UNIQUE NOT NULL,
    name VARCHAR(500) NOT NULL,
    version VARCHAR(100),
    description TEXT,
    permissions JSONB DEFAULT '[]'::jsonb,
    manifest JSONB,
    risk_level VARCHAR(50) DEFAULT 'unknown',
    risk_score FLOAT DEFAULT 0.0,
    ml_confidence_score FLOAT,
    first_seen TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    last_updated TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    status VARCHAR(50) DEFAULT 'active',
    is_threat BOOLEAN DEFAULT false,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- Threats table: Stores detected threats with full details
CREATE TABLE threats (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    extension_id UUID REFERENCES extensions(id) ON DELETE CASCADE,
    threat_type VARCHAR(100) NOT NULL,
    severity VARCHAR(50) NOT NULL,
    category VARCHAR(100),
    description TEXT,
    code_snippet TEXT,
    stack_trace TEXT,
    detected_patterns JSONB DEFAULT '[]'::jsonb,
    behavioral_data JSONB DEFAULT '{}'::jsonb,
    ml_classification JSONB DEFAULT '{}'::jsonb,
    ai_analysis JSONB DEFAULT '{}'::jsonb,
    threat_score FLOAT DEFAULT 0.0,
    confidence_score FLOAT,
    is_confirmed BOOLEAN DEFAULT false,
    is_false_positive BOOLEAN DEFAULT false,
    detected_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    analyzed_at TIMESTAMP,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- Behavioral patterns table: Stores extension behavior over time
CREATE TABLE behavioral_patterns (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    extension_id UUID REFERENCES extensions(id) ON DELETE CASCADE,
    pattern_type VARCHAR(100) NOT NULL,
    frequency INTEGER DEFAULT 1,
    data JSONB DEFAULT '{}'::jsonb,
    anomaly_score FLOAT,
    is_anomaly BOOLEAN DEFAULT false,
    first_occurrence TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    last_occurrence TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- AI analysis results table: Stores LLM analysis outputs
CREATE TABLE ai_analysis (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    threat_id UUID REFERENCES threats(id) ON DELETE CASCADE,
    model_name VARCHAR(100) NOT NULL,
    analysis_type VARCHAR(100) NOT NULL,
    input_data TEXT,
    output_data TEXT,
    summary TEXT,
    recommendations JSONB DEFAULT '[]'::jsonb,
    confidence FLOAT,
    processing_time FLOAT,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- Statistics table: Aggregated statistics for dashboard
CREATE TABLE statistics (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    date DATE DEFAULT CURRENT_DATE,
    total_extensions_scanned INTEGER DEFAULT 0,
    total_threats_detected INTEGER DEFAULT 0,
    confirmed_threats INTEGER DEFAULT 0,
    false_positives INTEGER DEFAULT 0,
    high_risk_extensions INTEGER DEFAULT 0,
    medium_risk_extensions INTEGER DEFAULT 0,
    low_risk_extensions INTEGER DEFAULT 0,
    threat_categories JSONB DEFAULT '{}'::jsonb,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    UNIQUE(date)
);

-- ML model training data table: Stores data for model improvement
CREATE TABLE ml_training_data (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    extension_id UUID REFERENCES extensions(id) ON DELETE CASCADE,
    features JSONB NOT NULL,
    label VARCHAR(50) NOT NULL,
    is_verified BOOLEAN DEFAULT false,
    verified_by VARCHAR(100),
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- Indexes for performance optimization
CREATE INDEX idx_extensions_extension_id ON extensions(extension_id);
CREATE INDEX idx_extensions_risk_level ON extensions(risk_level);
CREATE INDEX idx_extensions_is_threat ON extensions(is_threat);
CREATE INDEX idx_threats_extension_id ON threats(extension_id);
CREATE INDEX idx_threats_severity ON threats(severity);
CREATE INDEX idx_threats_detected_at ON threats(detected_at);
CREATE INDEX idx_threats_is_confirmed ON threats(is_confirmed);
CREATE INDEX idx_behavioral_patterns_extension_id ON behavioral_patterns(extension_id);
CREATE INDEX idx_behavioral_patterns_is_anomaly ON behavioral_patterns(is_anomaly);
CREATE INDEX idx_ai_analysis_threat_id ON ai_analysis(threat_id);
CREATE INDEX idx_statistics_date ON statistics(date);

-- GIN indexes for JSONB columns
CREATE INDEX idx_threats_detected_patterns ON threats USING GIN (detected_patterns);
CREATE INDEX idx_threats_behavioral_data ON threats USING GIN (behavioral_data);
CREATE INDEX idx_threats_ml_classification ON threats USING GIN (ml_classification);
CREATE INDEX idx_behavioral_patterns_data ON behavioral_patterns USING GIN (data);

-- Function to update last_updated timestamp
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = CURRENT_TIMESTAMP;
    RETURN NEW;
END;
$$ language 'plpgsql';

-- Trigger to auto-update last_updated on extensions
CREATE TRIGGER update_extensions_updated_at BEFORE UPDATE ON extensions
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

-- Trigger to auto-update updated_at on statistics
CREATE TRIGGER update_statistics_updated_at BEFORE UPDATE ON statistics
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

