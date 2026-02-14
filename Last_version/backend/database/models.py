"""
Database models and ORM-like interface for PostgreSQL
"""

from types import NoneType
from typing import Optional, Dict, List, Any
from datetime import datetime
import uuid
import json
from database.connection import get_db
from typing import Optional, Dict, List, Any
@staticmethod
def create() -> Optional[Dict]:  # Add Optional[] here

 class Extension:
    """Extension model"""
def get_by_extension_id(extension_id: str) -> Optional[Dict]:
    """Get extension by extension_id"""
    db = get_db()
    query = "SELECT * FROM extensions WHERE extension_id = %s"
    result = db.execute_query(query, (extension_id,))
    
    # Explicitly check if result exists and has items
    if result and len(result) > 0:
        return result[0]
    
    return None
    
class Threat:
    """Threat model"""
    @staticmethod
    def create(extension_id: str, threat_type: str, severity: str,
               category: str = "", description: str = "",
               code_snippet: str = "", stack_trace: str = "",
               patterns: Optional[List] = None, behavioral_data: Optional[Dict] = None,
               ml_classification: Optional[Dict] = None, threat_score: float = 0.0,
               confidence_score: Optional[float] = None) -> Optional[Dict]:
        """Create new threat record"""
        db = get_db()
        
        # Get internal UUID for extension
        ext_query = "SELECT id FROM extensions WHERE extension_id = %s"
        ext_result = db.execute_query(ext_query, (extension_id,))
        if not ext_result:
         return None
        
        ext_uuid = ext_result[0]['id']
        
        query = """
            INSERT INTO threats 
            (extension_id, threat_type, severity, category, description,
             code_snippet, stack_trace, detected_patterns, behavioral_data,
             ml_classification, threat_score, confidence_score)
            VALUES (%s, %s, %s, %s, %s, %s, %s, %s, %s, %s, %s, %s)
            RETURNING *
        """
        result = db.execute_query(
            query,
            (ext_uuid, threat_type, severity, category, description,
             code_snippet, stack_trace, json.dumps(patterns or []),
             json.dumps(behavioral_data or {}), json.dumps(ml_classification or {}),
             threat_score, confidence_score)
        )
        return None
    
    @staticmethod
    def get_by_extension(extension_id: str) -> List[Dict]:
        """Get all threats for an extension"""
        db = get_db()
        query = """
            SELECT t.* FROM threats t
            JOIN extensions e ON t.extension_id = e.id
            WHERE e.extension_id = %s
            ORDER BY t.detected_at DESC
        """
        return db.execute_query(query, (extension_id,))
    
    @staticmethod
    def get_recent(limit: int = 100) -> List[Dict]:
        """Get recent threats"""
        db = get_db()
        query = """
            SELECT t.*, e.extension_id, e.name as extension_name
            FROM threats t
            JOIN extensions e ON t.extension_id = e.id
            ORDER BY t.detected_at DESC
            LIMIT %s
        """
        return db.execute_query(query, (limit,))
    
    @staticmethod
    def update_ai_analysis(threat_id: str, ai_analysis: Dict):
        """Update threat with AI analysis results"""
        db = get_db()
        query = """
            UPDATE threats 
            SET ai_analysis = %s, analyzed_at = CURRENT_TIMESTAMP
            WHERE id = %s
        """
        db.execute_update(query, (json.dumps(ai_analysis), threat_id))
    
    @staticmethod
    def mark_confirmed(threat_id: str, is_confirmed: bool):
        """Mark threat as confirmed or false positive"""
        db = get_db()
        query = """
            UPDATE threats 
            SET is_confirmed = %s, is_false_positive = %s
            WHERE id = %s
        """
        db.execute_update(query, (is_confirmed, not is_confirmed, threat_id))


class Statistics:
    """Statistics model"""
    
    @staticmethod
    def update_daily_stats():
        """Update daily statistics"""
        db = get_db()
        query = """
            INSERT INTO statistics 
            (date, total_extensions_scanned, total_threats_detected,
             confirmed_threats, false_positives, high_risk_extensions,
             medium_risk_extensions, low_risk_extensions)
            SELECT 
                CURRENT_DATE,
                COUNT(DISTINCT e.id),
                COUNT(t.id),
                SUM(CASE WHEN t.is_confirmed THEN 1 ELSE 0 END),
                SUM(CASE WHEN t.is_false_positive THEN 1 ELSE 0 END),
                SUM(CASE WHEN e.risk_level = 'high' THEN 1 ELSE 0 END),
                SUM(CASE WHEN e.risk_level = 'medium' THEN 1 ELSE 0 END),
                SUM(CASE WHEN e.risk_level = 'low' THEN 1 ELSE 0 END)
            FROM extensions e
            LEFT JOIN threats t ON e.id = t.extension_id
            ON CONFLICT (date) DO UPDATE SET
                total_extensions_scanned = EXCLUDED.total_extensions_scanned,
                total_threats_detected = EXCLUDED.total_threats_detected,
                confirmed_threats = EXCLUDED.confirmed_threats,
                false_positives = EXCLUDED.false_positives,
                high_risk_extensions = EXCLUDED.high_risk_extensions,
                medium_risk_extensions = EXCLUDED.medium_risk_extensions,
                low_risk_extensions = EXCLUDED.low_risk_extensions,
                updated_at = CURRENT_TIMESTAMP
        """
        db.execute_update(query)
    
    @staticmethod
    def get_summary() -> Dict:
        """Get overall statistics summary"""
        db = get_db()
        query = """
            SELECT 
                COUNT(DISTINCT e.id) as total_extensions,
                COUNT(t.id) as total_threats,
                SUM(CASE WHEN t.is_confirmed THEN 1 ELSE 0 END) as confirmed_threats,
                SUM(CASE WHEN e.is_threat THEN 1 ELSE 0 END) as threat_extensions,
                AVG(e.risk_score) as avg_risk_score
            FROM extensions e
            LEFT JOIN threats t ON e.id = t.extension_id
        """
        result = db.execute_query(query)
        return result[0] if result else {}
