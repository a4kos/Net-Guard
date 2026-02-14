"""
PostgreSQL Database Connection Manager
Handles connection pooling and database operations
"""

from ast import Assert
from ctypes import cast
from queue import Empty
import psycopg2
from psycopg2 import pool
from psycopg2.extras import RealDictCursor, Json
import json
import logging
from contextlib import contextmanager
from typing import Optional, Dict, List, Any
import os

logger = logging.getLogger(__name__)


class DatabaseConnection:
    """Manages PostgreSQL database connections with connection pooling"""
    
    def __init__(self, 
                 host: str = "",
                 port: int = int(0),
                 database: str = "",
                 user: str = "",
                 password: str = "",
                 min_connections: int = 1,
                 max_connections: int = 10):
        """Initialize database connection pool"""
        
        # Use environment variables or defaults
        self.host = host or os.getenv('POSTGRES_HOST', 'localhost')
        self.port = port or int(os.getenv('POSTGRES_PORT', 5432))
        self.database = database or os.getenv('POSTGRES_DB', 'extension_monitor')
        self.user = user or os.getenv('POSTGRES_USER', 'postgres')
        self.password = password or os.getenv('POSTGRES_PASSWORD', 'postgres')
        
        try:
            # Create connection pool
            self.connection_pool = pool.ThreadedConnectionPool(
                min_connections,
                max_connections,
                host=self.host,
                port=self.port,
                database=self.database,
                user=self.user,
                password=self.password,
                cursor_factory=RealDictCursor
            )
            logger.info(f"Database connection pool created: {self.database}@{self.host}:{self.port}")
        except Exception as e:
            logger.error(f"Failed to create connection pool: {e}")
            raise
    
    @contextmanager
    def get_connection(self):
        """Context manager for database connections"""
        conn = self.connection_pool.getconn()
        try:
            yield conn
            conn.commit()
        except Exception as e:
            conn.rollback()
            logger.error(f"Database error: {e}")
            raise
        finally:
            self.connection_pool.putconn(conn)
    
    @contextmanager
    def get_cursor(self):
        """Context manager for database cursors"""
        with self.get_connection() as conn:
            cursor = conn.cursor()
            try:
                yield cursor
            finally:
                cursor.close()
    
    def execute_query(self, query: str, params: Optional[tuple] = None) -> List[Dict]:
        """Execute SELECT query and return results"""
        with self.get_cursor() as cursor:
            cursor.execute(query, params)
            return cursor.fetchall()
    
    def execute_update(self, query: str, params: Optional[tuple] = None) -> int:
        """Execute INSERT/UPDATE/DELETE query and return affected rows"""
        with self.get_cursor() as cursor:
            cursor.execute(query, params)
            return cursor.rowcount
    
    def execute_many(self, query: str, params_list: List[tuple]) -> int:
        """Execute batch INSERT/UPDATE/DELETE"""
        with self.get_cursor() as cursor:
            cursor.executemany(query, params_list)
            return cursor.rowcount
    
    def close(self):
        """Close all connections in the pool"""
        if self.connection_pool:
            self.connection_pool.closeall()
            logger.info("Database connection pool closed")


# Global database instance
db: Optional[DatabaseConnection] = None


def get_db(
    host: Optional[str] = None, 
    port: Optional[int] = None, 
    database: Optional[str] = None, 
    user: Optional[str] = None, 
    password: Optional[str] = None
):
    global db
    # Only initialize if values are actually provided, 
    # or provide default strings/integers here:
    db = DatabaseConnection(
        host or "localhost", 
        port or 5432, 
        database or "default_db", 
        user or "admin", 
        password or ""
    )
    return db