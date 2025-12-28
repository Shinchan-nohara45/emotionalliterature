import logging
import re
from typing import Dict, List, Any, Optional

import torch
from transformers import pipeline

logger = logging.getLogger(__name__)


class EmotionAnalyzer:
    """
    Interprets emotional signals from text.
    Lazy-loads ML models to avoid blocking server startup.
    """

    def __init__(self):
        # 🔒 Do NOT load models here
        self.sentiment_analyzer = None
        self.emotion_classifier = None

        # ✅ Device must exist if referenced
        self.device = "cuda" if torch.cuda.is_available() else "cpu"
        logger.info(f"EmotionAnalyzer initialized on device: {self.device}")

        self.crisis_keywords = [
            "suicide", "kill myself", "end my life", "not worth living",
            "everyone would be better without me", "want to die",
            "cutting myself", "self harm", "overdose", "end it all",
            "no point in living", "better off dead",
        ]

        self.emotion_wheel_mapping = {
            "joy": "happy",
            "love": "happy",
            "optimism": "happy",
            "sadness": "sad",
            "anger": "angry",
            "fear": "fearful",
            "disgust": "disgusted",
            "surprise": "surprised",
        }

    async def analyze_text(
        self,
        text: str,
        user_context: Optional[Dict[str, Any]] = None,
    ) -> Dict[str, Any]:

        try:
            cleaned_text = self._preprocess_text(text)

            # 🚀 Lazy-load models on first use
            if self.sentiment_analyzer is None:
                self.sentiment_analyzer = pipeline(
                    "sentiment-analysis",
                    model="cardiffnlp/twitter-roberta-base-sentiment-latest",
                    device=0 if self.device == "cuda" else -1,
                )

            if self.emotion_classifier is None:
                self.emotion_classifier = pipeline(
                    "text-classification",
                    model="j-hartmann/emotion-english-distilroberta-base",
                    device=0 if self.device == "cuda" else -1,
                )

            emotions = self.emotion_classifier(cleaned_text)
            sentiment = self.sentiment_analyzer(cleaned_text)

            return {
                "emotions": emotions,
                "sentiment": sentiment,
                "risk_level": self._derive_risk_signal(text, emotions),
                "mood_score": self._derive_mood_score(emotions, sentiment),
                "wheel_emotions": self._map_to_emotion_wheel(emotions),
                "word_count": len(text.split()),
                "detected_crisis_keywords": self._detect_crisis_keywords(text),
            }

        except Exception as e:
            logger.exception("Emotion analysis failed")
            return {
                "emotions": [],
                "sentiment": [],
                "risk_level": "unknown",
                "mood_score": 5,
                "wheel_emotions": [],
                "word_count": len(text.split()),
                "detected_crisis_keywords": [],
            }

    # ---------------- Helpers ----------------

    def _preprocess_text(self, text: str) -> str:
        text = re.sub(r"\s+", " ", text).strip()
        text = re.sub(r"[^\w\s.,!?;:'\"-]", "", text)
        return text

    def _derive_risk_signal(self, text: str, emotions: List[Dict[str, Any]]) -> str:
        if self._detect_crisis_keywords(text):
            return "high"

        negative_labels = {"sadness", "anger", "fear", "disgust"}
        negative_score = sum(
            e.get("score", 0.0)
            for e in emotions
            if e.get("label", "").lower() in negative_labels
        )

        if negative_score >= 0.8:
            return "medium"
        if negative_score >= 0.6:
            return "low-medium"
        return "low"

    def _derive_mood_score(
        self,
        emotions: List[Dict[str, Any]],
        sentiment: List[Dict[str, Any]],
    ) -> int:
        base = 5

        if sentiment:
            label = sentiment[0].get("label")
            score = sentiment[0].get("score", 0.0)

            if label == "LABEL_2":  # positive
                base += int(score * 3)
            elif label == "LABEL_0":  # negative
                base -= int(score * 3)

        if emotions:
            primary = emotions[0].get("label", "").lower()
            adjustments = {
                "joy": 2,
                "love": 2,
                "optimism": 1,
                "sadness": -2,
                "anger": -2,
                "fear": -1,
                "disgust": -1,
            }
            base += adjustments.get(primary, 0)

        return max(1, min(10, base))

    def _map_to_emotion_wheel(self, emotions: List[Dict[str, Any]]) -> List[str]:
        wheel = set()
        for emotion in emotions[:3]:
            label = emotion.get("label", "").lower()
            wheel.add(self.emotion_wheel_mapping.get(label, label))
        return list(wheel)

    def _detect_crisis_keywords(self, text: str) -> List[str]:
        text_lower = text.lower()
        return [k for k in self.crisis_keywords if k in text_lower]
