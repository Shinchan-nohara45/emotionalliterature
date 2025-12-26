from typing import Dict, Any, List
import re
import hashlib
import secrets
from datetime import datetime, timedelta
import logging

logger = logging.getLogger(__name__)

def clean_text(text: str) -> str:
    """Clean and normalize text input"""
    # Remove extra whitespace
    text = re.sub(r'\s+', ' ', text).strip()
    # Remove special characters but keep basic punctuation
    text = re.sub(r'[^\w\s.,!?;:\-\'\"]', '', text)
    return text

def calculate_readability_score(text: str) -> float:
    """Calculate simple readability score"""
    sentences = len(re.findall(r'[.!?]+', text))
    words = len(text.split())
    
    if sentences == 0:
        return 0.0
    
    avg_words_per_sentence = words / sentences
    # Simple readability metric (lower is easier to read)
    score = avg_words_per_sentence * 0.39 + 11.8
    return round(score, 2)

def generate_unique_id() -> str:
    """Generate a unique identifier"""
    return secrets.token_urlsafe(16)

def hash_content(content: str) -> str:
    """Generate hash of content for deduplication"""
    return hashlib.md5(content.encode()).hexdigest()

def calculate_emotion_intensity(emotions: List[Dict[str, Any]]) -> float:
    """Calculate overall emotional intensity"""
    if not emotions:
        return 0.0
    
    total_score = sum(emotion.get('score', 0) for emotion in emotions)
    return min(total_score, 1.0)

def format_datetime(dt: datetime) -> str:
    """Format datetime for consistent display"""
    return dt.strftime("%Y-%m-%d %H:%M:%S")

def time_ago(dt: datetime) -> str:
    """Human-readable time difference"""
    now = datetime.utcnow()
    diff = now - dt
    
    if diff.days > 0:
        return f"{diff.days} day{'s' if diff.days != 1 else ''} ago"
    elif diff.seconds > 3600:
        hours = diff.seconds // 3600
        return f"{hours} hour{'s' if hours != 1 else ''} ago"
    elif diff.seconds > 60:
        minutes = diff.seconds // 60
        return f"{minutes} minute{'s' if minutes != 1 else ''} ago"
    else:
        return "Just now"

def validate_email(email: str) -> bool:
    """Basic email validation"""
    pattern = r'^[a-zA-Z0-9._%+-]+@[a-zA-Z0-9.-]+\.[a-zA-Z]{2,}$'
    return re.match(pattern, email) is not None

def sanitize_filename(filename: str) -> str:
    """Sanitize filename for safe storage"""
    # Remove dangerous characters
    filename = re.sub(r'[<>:"/\\|?*]', '', filename)
    # Remove leading/trailing periods and spaces
    filename = filename.strip('. ')
    # Limit length
    return filename[:255]

class ProgressCalculator:
    """Calculate user progress and achievements"""
    
    @staticmethod
    def calculate_level(total_xp: int) -> int:
        """Calculate level based on XP"""
        # Level formula: level = sqrt(xp / 100)
        import math
        return max(1, int(math.sqrt(total_xp / 100)) + 1)
    
    @staticmethod
    def xp_for_next_level(current_level: int) -> int:
        """Calculate XP needed for next level"""
        return (current_level ** 2) * 100
    
    @staticmethod
    def check_achievements(progress_data: Dict[str, Any]) -> List[str]:
        """Check which achievements should be unlocked"""
        achievements = []
        
        if progress_data.get('journal_entries_count', 0) >= 1:
            achievements.append('first_steps')
        
        if progress_data.get('words_learned', 0) >= 10:
            achievements.append('word_explorer')
        
        if progress_data.get('longest_streak', 0) >= 7:
            achievements.append('streak_master')
        
        if progress_data.get('current_level', 1) >= 5:
            achievements.append('emotion_expert')
        
        return achievements