from fastapi import APIRouter, HTTPException
from app.services.emotion_analyzer import EmotionAnalyzer
from app.models.schemas import EmotionAnalysisResponse, EmotionWord
from pydantic import BaseModel
from typing import List
import random

router = APIRouter()
emotion_analyzer = EmotionAnalyzer()

class TextAnalysisRequest(BaseModel):
    text: str

# Sample emotion words data
EMOTION_WORDS_DATA = [
    {
        "word": "Serenity",
        "definition": "The state of being calm, peaceful, and untroubled; a sense of tranquil contentment",
        "example": "After weeks of stress, she finally found serenity while walking through the quiet forest.",
        "category": "happy",
        "level": 3,
        "similar_words": ["tranquility", "peacefulness", "calm", "composure"],
        "opposite_words": ["turmoil", "chaos", "agitation"],
        "cultural_context": "Highly valued in many spiritual and philosophical traditions as a goal for emotional well-being"
    },
    {
        "word": "Euphoria",
        "definition": "A feeling of intense excitement and happiness; an overwhelming sense of well-being",
        "example": "The team felt euphoria after winning the championship game.",
        "category": "happy",
        "level": 2,
        "similar_words": ["elation", "ecstasy", "bliss", "rapture"],
        "opposite_words": ["depression", "despair", "melancholy"],
        "cultural_context": "Often associated with peak life experiences and achievements"
    },
    {
        "word": "Melancholy",
        "definition": "A pensive sadness; a thoughtful or gentle sadness often mixed with longing",
        "example": "The old photograph filled her with melancholy for her childhood days.",
        "category": "sad",
        "level": 3,
        "similar_words": ["wistfulness", "sorrow", "pensiveness"],
        "opposite_words": ["joy", "cheerfulness", "elation"],
        "cultural_context": "Historically viewed as a temperament in classical philosophy and medicine"
    }
]

@router.post("/analyze-text", response_model=dict)
async def analyze_text_emotions(request: TextAnalysisRequest):
    """Analyze emotions in text"""
    try:
        analysis = await emotion_analyzer.analyze_text(request.text)
        return {
            "success": True,
            "analysis": analysis
        }
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Analysis failed: {str(e)}")

@router.get("/word-of-the-day", response_model=EmotionWord)
async def get_word_of_the_day():
    """Get the emotion word of the day"""
    # In production, you'd implement logic to rotate words daily
    word_data = random.choice(EMOTION_WORDS_DATA)
    return EmotionWord(**word_data)

@router.get("/word-of-day", response_model=EmotionWord)
async def get_word_of_day():
    """Get the emotion word of the day"""
    # In production, you'd implement logic to rotate words daily
    word_data = random.choice(EMOTION_WORDS_DATA)
    return EmotionWord(**word_data)

@router.get("/words/{word}", response_model=EmotionWord)
async def get_emotion_word(word: str):
    """Get details about a specific emotion word"""
    word_lower = word.lower()
    for word_data in EMOTION_WORDS_DATA:
        if word_data["word"].lower() == word_lower:
            return EmotionWord(**word_data)
    
    raise HTTPException(status_code=404, detail="Word not found")

@router.get("/wheel")
async def get_emotion_wheel():
    """Get the emotion wheel data"""
    return {
        "categories": {
            "happy": ["joy", "serenity", "love", "optimism", "ecstasy", "vigilance", "admiration", "trust"],
            "sad": ["sadness", "pensiveness", "grief", "melancholy", "despair", "disappointment"],
            "angry": ["anger", "rage", "fury", "annoyance", "irritation", "hostility"],
            "fearful": ["fear", "terror", "anxiety", "worry", "nervousness", "apprehension"],
            "surprised": ["surprise", "amazement", "astonishment", "bewilderment"],
            "disgusted": ["disgust", "revulsion", "contempt", "loathing"],
            "bad": ["remorse", "guilt", "shame", "regret", "embarrassment"],
            "anticipation": ["excitement", "eagerness", "hope", "expectation"]
        },
        "description": "The emotion wheel helps identify and understand different emotional states"
    }
