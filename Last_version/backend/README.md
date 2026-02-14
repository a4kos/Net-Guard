# Net Guard Backend

PostgreSQL + Flask backend with integrated AI analysis.

## Setup

1. Install PostgreSQL:

```bash
# Ubuntu/Debian
sudo apt install postgresql postgresql-contrib

# macOS
brew install postgresql
```

2. Create database:

```bash
psql -U postgres -f init.sql
```

3. Install Python dependencies:

```bash
pip install -r requirements.txt
```

4. Configure database in app.py (update DB_CONFIG)

5. Run server:

```bash
# Web server mode
python app.py

# Native messaging mode
python app.py --native
```

## AI Integration

Uses Vercel AI Gateway with free models (gpt-4o-mini). AI analysis includes:

- Risk assessment
- Impact analysis
- Security recommendations

## API Endpoints

- GET /api/threats - List all threats
- GET /api/stats - Get statistics
- POST /api/analyze - Analyze new threat (with AI)

## WebSocket Events

- new_threat - Real-time threat notifications
