from motor.motor_asyncio import AsyncIOMotorClient
from app.core.config import settings
from typing import Optional

class MongoDB:
    client: Optional[AsyncIOMotorClient] = None

db = MongoDB()

async def get_database():
    """Get database instance"""
    return db.client[settings.database_name]

async def connect_to_mongo():
    """Create database connection"""
    db.client = AsyncIOMotorClient(settings.database_url)
    # Test connection (Atlas can fail with TLS errors due to network/firewall/DNS)
    try:
        await db.client.admin.command('ping')
        print("Connected to MongoDB")
    except Exception as e:
        # Don't crash the whole app on Mongo connection failure — log and continue
        # This allows frontend/dev work to continue while Mongo issues are investigated.
        print("Warning: could not connect to MongoDB:", str(e))
        try:
            # Close client if it was partially created
            db.client.close()
        except Exception:
            pass
        db.client = None

async def close_mongo_connection():
    """Close database connection"""
    if db.client:
        db.client.close()
        print("Disconnected from MongoDB")
