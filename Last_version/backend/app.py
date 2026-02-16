import eventlet
eventlet.monkey_patch()  
import json
import struct
import asyncio
from flask import Flask, jsonify, request, render_template
from flask_socketio import SocketIO
from psycopg2.pool import ThreadedConnectionPool
from psycopg2.extras import RealDictCursor
import os
import sys

# Get the path to the folder containing app.py
base_path = getattr(sys, '_MEIPASS', os.path.dirname(os.path.abspath(__file__)))

# Add both the root and the backend folder to the search path
sys.path.append(base_path)
sys.path.append(os.path.join(base_path, 'backend'))

try:
    from threat_intelligence import ThreatIntelligence
except ImportError:
    # Fallback for standard development environment
    from backend.threat_intelligence import ThreatIntelligence

# Importing custom modules
if getattr(sys, 'frozen', False) and hasattr(sys, '_MEIPASS'):
    base_path = sys._MEIPASS #type: ignore
else:
    base_path = os.path.dirname(os.path.abspath(__file__))

sys.path.append(base_path)

# 2. Check if ai.py actually exists in the bundle (for debugging)
ai_path = os.path.join(base_path, 'ai.py')
if not os.path.exists(ai_path):
    print(f"CRITICAL: ai.py not found at {ai_path}")

from ai import generate_text
from ml_analyzer import get_analyzer

app = Flask(__name__)
app.config[''] = 'security-monitor-key'
# cors_allowed_origins="*" allows the extension to talk to the dashboard easily
socketio = SocketIO(app, cors_allowed_origins="*", async_mode='eventlet')


# Database Configuration & Pooling
DB_CONFIG = {
    'host': 'localhost',
    'database': 'extension_security',
    'user': 'admin',
    'password': 'postgres',
    'port': 5500
}

# Threaded pool is essential when combining Flask, SocketIO, and Native Messaging
db_pool = ThreadedConnectionPool(1, 20, **DB_CONFIG)

def get_db_connection():
    return db_pool.getconn()

def release_db_connection(conn):
    db_pool.putconn(conn)



def init_db():
    conn = get_db_connection()
    cur= None
    try:
        cur = conn.cursor()
        cur.execute('''
            CREATE TABLE IF NOT EXISTS threats (
                id SERIAL PRIMARY KEY,
                extension_id VARCHAR(255),
                type VARCHAR(100),
                code TEXT,
                severity VARCHAR(20),
                score INTEGER,
                patterns TEXT[],
                url TEXT,
                ai_analysis TEXT,
                ml_confidence FLOAT,
                timestamp TIMESTAMPTZ DEFAULT NOW()
            );
            CREATE INDEX IF NOT EXISTS idx_severity ON threats(severity);
            CREATE INDEX IF NOT EXISTS idx_timestamp ON threats(timestamp);
        ''')
        conn.commit()
    finally:
        if cur is not None:
            cur.close()
        release_db_connection(conn)

# Web Routes
@app.route('/')
def index():
    return render_template('dashboard.html')

@app.route('/api/threats')
def get_threats():
    conn = get_db_connection()
    cur = None
    try:
        cur = conn.cursor(cursor_factory=RealDictCursor)
        cur.execute('SELECT * FROM threats ORDER BY timestamp DESC LIMIT 100')
        rows = cur.fetchall()
        return jsonify(rows)
    finally:
        if cur is not None:
            cur.close()
        release_db_connection(conn)

@app.route('/api/stats')
def get_stats():
    conn = get_db_connection()
    cur = None
    try:
        cur = conn.cursor(cursor_factory=RealDictCursor)
        cur.execute('''
            SELECT 
                COUNT(*) as total,
                COUNT(DISTINCT extension_id) as extensions,
                COUNT(CASE WHEN severity = 'critical' THEN 1 END) as critical,
                COUNT(CASE WHEN severity = 'high' THEN 1 END) as high
            FROM threats
        ''')
        row = cur.fetchone()
        return jsonify(row)
    finally:
        if cur is not None:
            cur.close()
        release_db_connection(conn)

# Security Analysis Logic
def process_security_scan(data):
    """Core logic shared by Web API and Native Messaging.
    
    Uses synchronous execution to match Flask's threading async_mode.
    """
    try:
        intel = ThreatIntelligence()
        # Scan the code snippet sent by the extension
        code_results = intel.scan_code(data.get('code', ''))
        # patterns list for AI/DB use
        signatures_found = [t['description'] for t in code_results['threats']]
        data['patterns'] = signatures_found

        # ML Analysis
        ml_analyzer = get_analyzer()
        ml_result = ml_analyzer.analyze(data)
        
        # AI Prompting
        prompt = (
            f"Analyze threat: {data['type']} | Severity: {data['severity']}\n"
            f"Code Snippet: {data.get('code', 'N/A')[:200]}\n"
            f"Patterns: {data.get('patterns', [])}\n"
            f"ML Confidence: {ml_result['confidence']}"
        )
        
        try:
            loop = asyncio.new_event_loop()
            ai_response = loop.run_until_complete(generate_text(prompt))
            loop.close()
        except Exception as e:
            ai_response = f"AI analysis unavailable: {str(e)}"

        # Save to DB
        conn = get_db_connection()
        cur = None
        try:
            cur = conn.cursor(cursor_factory=RealDictCursor)
            cur.execute('''
                INSERT INTO threats (extension_id, type, code, severity, score, patterns, url, ai_analysis, ml_confidence)
                VALUES (%s, %s, %s, %s, %s, %s, %s, %s, %s) RETURNING id
            ''', (
                data.get('extensionId'), data['type'], data.get('code'),
                data['severity'], data.get('score', 0), data.get('patterns', []),
                data.get('url'), ai_response, ml_result['confidence']
            ))
            threat_id = cur.fetchone()['id']
            conn.commit()
            
            # Real-time update to dashboard
            result = {'id': threat_id, 'ai_analysis': ai_response, 'ml_result': ml_result, **data}
            socketio.emit('new_threat', result)
            return result
        finally:
            if cur is not None:
                cur.close()
            release_db_connection(conn)
            
    except Exception as e:
        print(f"Analysis Error: {e}", file=sys.stderr)
        return None

@app.route('/api/analyze', methods=['POST'])
def web_analyze():
    result = process_security_scan(request.json)
    if result:
        return jsonify({'success': True, **result})
    return jsonify({'success': False}), 500

# Native Messaging Bridge
def native_message_handler():
    # Binary mode, required for the 4-byte header
    if sys.platform == "win32":
        import os, msvcrt
        msvcrt.setmode(sys.stdin.fileno(), os.O_BINARY)

    while True:
        try:
            text_length_bytes = sys.stdin.buffer.read(4)
            if not text_length_bytes:
                break
            
            text_length = struct.unpack('I', text_length_bytes)[0]
            message = json.loads(sys.stdin.buffer.read(text_length).decode('utf-8'))
            
            if message.get('action') == 'threat':
                process_security_scan(message['data'])
            
            # Send acknowledgement back to Chrome
            resp = json.dumps({"status": "received"}).encode('utf-8')
            sys.stdout.buffer.write(struct.pack('I', len(resp)))
            sys.stdout.buffer.write(resp)
            sys.stdout.buffer.flush()
            
        except Exception as e:
            print(f"Native Msg Error: {e}", file=sys.stderr)

# Execution Entry Point
if __name__ == '__main__':
    init_db()
    
    if len(sys.argv) > 1 and sys.argv[1] == '--native':
        # Running as the bridge for the Chrome Extension
        native_message_handler()
    else:
        # Running as the Web Dashboard server
        print("Starting Dashboard at http://127.0.0.1:5000")
        socketio.run(app, host='127.0.0.1', port=5000, debug=False)
