import torch
from transformers import AutoTokenizer, AutoModelForSequenceClassification, pipeline
import librosa
import numpy as np
from typing import Dict, List, Any
import logging
import re

logger = logging.getLogger(__name__)

class EmotionAnalyzer:
    def __init__(self):
        self.device = torch.device("cuda" if torch.cuda.is_available() else "cpu")
        logger.info(f"Using device: {self.device}")
        
        # Initialize models
        self.sentiment_analyzer = pipeline(
            "sentiment-analysis",
            model="cardiffnlp/twitter-roberta-base-sentiment-latest",
            device=0 if torch.cuda.is_available() else -1
        )
        
        self.emotion_analyzer = pipeline(
            "text-classification",
            model="j-hartmann/emotion-english-distilroberta-base",
            device=0 if torch.cuda.is_available() else -1
        )
        
        # Crisis detection keywords
        self.crisis_keywords = [
            'suicide', 'kill myself', 'end my life', 'not worth living',
            'everyone would be better without me', 'want to die',
            'cutting myself', 'self harm', 'overdose', 'end it all',
            'no point in living', 'better off dead'
        ]
        
        # Emotion mapping to wheel categories
        self.emotion_wheel_mapping = {
            'joy': 'happy',
            'sadness': 'sad',
            'anger': 'angry',
            'fear': 'fearful',
            'surprise': 'surprised',
            'disgust': 'disgusted',
            'love': 'happy',
            'optimism': 'happy'
        }

    async def analyze_text(self, text: str) -> Dict[str, Any]:
        """Analyze text for emotions, sentiment, and risk level"""
        try:
            # Clean and preprocess text
            cleaned_text = self._preprocess_text(text)
            
            # Get emotion scores
            emotions = self.emotion_analyzer(cleaned_text)
            
            # Get sentiment
            sentiment = self.sentiment_analyzer(cleaned_text)
            
            # Assess risk level
            risk_level = self._assess_risk_level(text, emotions)
            
            # Calculate mood score (1-10)
            mood_score = self._calculate_mood_score(emotions, sentiment)
            
            # Map to emotion wheel
            wheel_emotions = self._map_to_emotion_wheel(emotions)
            
            return {
                "emotions": emotions,
                "sentiment": sentiment,
                "risk_level": risk_level,
                "mood_score": mood_score,
                "wheel_emotions": wheel_emotions,
                "word_count": len(text.split()),
                "detected_crisis_keywords": self._detect_crisis_keywords(text)
            }
            
        except Exception as e:
            logger.error(f"Error analyzing text: {str(e)}")
            return {
                "error": "Analysis failed",
                "emotions": [],
                "sentiment": [],
                "risk_level": "unknown",
                "mood_score": 5
            }

    def _preprocess_text(self, text: str) -> str:
        """Clean and preprocess text for analysis"""
        # Remove extra whitespace
        text = re.sub(r'\s+', ' ', text).strip()
        # Remove special characters but keep punctuation
        text = re.sub(r'[^\w\s.,!?;:\-\'\"]', '', text)
        return text

    def _assess_risk_level(self, text: str, emotions: List[Dict]) -> str:
        """Assess risk level based on text content and emotions"""
        text_lower = text.lower()
        
        # Check for crisis keywords
        crisis_found = any(keyword in text_lower for keyword in self.crisis_keywords)
        
        if crisis_found:
            return "high"
        
        # Check emotion scores
        negative_emotions = ['sadness', 'anger', 'fear', 'disgust']
        negative_score = sum(
            emotion['score'] for emotion in emotions 
            if emotion['label'].lower() in negative_emotions
        )
        
        if negative_score > 0.8:
            return "medium"
        elif negative_score > 0.6:
            return "low-medium"
        else:
            return "low"

    def _calculate_mood_score(self, emotions: List[Dict], sentiment: List[Dict]) -> int:
        """Calculate mood score from 1-10"""
        # Get primary emotion and sentiment
        primary_emotion = emotions[0] if emotions else None
        primary_sentiment = sentiment[0] if sentiment else None
        
        base_score = 5  # Neutral
        
        if primary_sentiment:
            if primary_sentiment['label'] == 'LABEL_2':  # Positive
                base_score += int(primary_sentiment['score'] * 3)
            elif primary_sentiment['label'] == 'LABEL_0':  # Negative
                base_score -= int(primary_sentiment['score'] * 3)
        
        # Adjust based on emotions
        if primary_emotion:
            emotion_adjustments = {
                'joy': 2,
                'love': 2,
                'optimism': 1,
                'sadness': -2,
                'anger': -2,
                'fear': -1,
                'disgust': -1
            }
            
            emotion_label = primary_emotion['label'].lower()
            if emotion_label in emotion_adjustments:
                base_score += emotion_adjustments[emotion_label]
        
        return max(1, min(10, base_score))

    def _map_to_emotion_wheel(self, emotions: List[Dict]) -> List[str]:
        """Map detected emotions to emotion wheel categories"""
        wheel_emotions = []
        for emotion in emotions[:3]:  # Top 3 emotions
            emotion_label = emotion['label'].lower()
            if emotion_label in self.emotion_wheel_mapping:
                wheel_emotions.append(self.emotion_wheel_mapping[emotion_label])
            else:
                wheel_emotions.append(emotion_label)
        
        return list(set(wheel_emotions))  # Remove duplicates

    def _detect_crisis_keywords(self, text: str) -> List[str]:
        """Detect crisis keywords in text"""
        text_lower = text.lower()
        found_keywords = [
            keyword for keyword in self.crisis_keywords 
            if keyword in text_lower
        ]
        return found_keywords
