import logging
import re
import httpx
from typing import Dict, List, Any, Optional
from app.core.config import settings

logger = logging.getLogger(__name__)


class EmotionAnalyzer:
    """
    Interprets emotional signals from text using OpenRouter API.
    Lightweight, no local ML models required.
    """

    def __init__(self):
        logger.info("EmotionAnalyzer initialized with OpenRouter API")

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
            "happy": "happy",
            "neutral": "neutral",
        }

    async def analyze_text(
        self,
        text: str,
        user_context: Optional[Dict[str, Any]] = None,
    ) -> Dict[str, Any]:

        try:
            cleaned_text = self._preprocess_text(text)
            
            # Check for crisis keywords first
            crisis_keywords_found = self._detect_crisis_keywords(text)
            if crisis_keywords_found:
                return {
                    "emotions": [{"label": "crisis", "score": 0.9}],
                    "sentiment": [{"label": "NEGATIVE", "score": 0.9}],
                    "risk_level": "high",
                    "mood_score": 1,
                    "wheel_emotions": ["sad", "fearful"],
                    "word_count": len(text.split()),
                    "detected_crisis_keywords": crisis_keywords_found,
                }

            # Use OpenRouter API for emotion analysis if available
            if settings.openrouter_api_key:
                analysis = await self._analyze_with_openrouter(cleaned_text)
                if analysis:
                    return analysis

            # Fallback to rule-based analysis
            return self._rule_based_analysis(cleaned_text)

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

    async def _analyze_with_openrouter(self, text: str) -> Optional[Dict[str, Any]]:
        """Analyze emotions using OpenRouter API"""
        try:
            prompt = f"""Analyze the emotional content of this text and return a JSON object with:
1. Primary emotion (one of: joy, sadness, anger, fear, disgust, surprise, love, optimism, neutral)
2. Sentiment (positive, negative, or neutral)
3. Mood score (1-10, where 1 is very negative and 10 is very positive)
4. Secondary emotions (list of 2-3 emotions)

Text: "{text[:500]}"

Return ONLY valid JSON in this format:
{{
  "primary_emotion": "emotion_name",
  "sentiment": "positive|negative|neutral",
  "mood_score": 5,
  "secondary_emotions": ["emotion1", "emotion2"],
  "confidence": 0.8
}}"""

            async with httpx.AsyncClient(timeout=30.0) as client:
                response = await client.post(
                    f"{settings.openrouter_base_url}/chat/completions",
                    headers={
                        "Authorization": f"Bearer {settings.openrouter_api_key}",
                        "Content-Type": "application/json",
                    },
                    json={
                        "model": "anthropic/claude-3-haiku",
                        "messages": [
                            {
                                "role": "system",
                                "content": "You are an emotion analysis expert. Always return valid JSON only, no additional text."
                            },
                            {"role": "user", "content": prompt},
                        ],
                        "max_tokens": 200,
                        "temperature": 0.3,
                    },
                )

                if response.status_code == 200:
                    result = response.json()
                    content = result["choices"][0]["message"]["content"].strip()
                    
                    # Parse JSON from response
                    import json
                    # Remove markdown code blocks if present
                    if content.startswith("```"):
                        parts = content.split("```")
                        content = parts[1] if len(parts) > 1 else content
                        if content.startswith("json"):
                            content = content[4:]
                    content = content.strip()
                    
                    # Try to extract JSON if wrapped in text
                    if "{" in content and "}" in content:
                        start = content.find("{")
                        end = content.rfind("}") + 1
                        content = content[start:end]
                    
                    analysis_data = json.loads(content)
                    
                    primary = analysis_data.get("primary_emotion", "neutral").lower()
                    sentiment_label = analysis_data.get("sentiment", "neutral").upper()
                    mood_score = int(analysis_data.get("mood_score", 5))
                    secondary = analysis_data.get("secondary_emotions", [])
                    
                    # Format emotions for compatibility
                    emotions = [
                        {"label": primary, "score": analysis_data.get("confidence", 0.7)}
                    ]
                    for sec in secondary[:2]:
                        emotions.append({"label": sec.lower(), "score": 0.5})
                    
                    sentiment = [{"label": sentiment_label, "score": 0.7}]
                    
                    wheel_emotions = [self.emotion_wheel_mapping.get(primary, primary)]
                    for sec in secondary:
                        mapped = self.emotion_wheel_mapping.get(sec.lower(), sec.lower())
                        if mapped not in wheel_emotions:
                            wheel_emotions.append(mapped)
                    
                    return {
                        "emotions": emotions,
                        "sentiment": sentiment,
                        "risk_level": self._derive_risk_signal(text, emotions),
                        "mood_score": max(1, min(10, mood_score)),
                        "wheel_emotions": wheel_emotions[:3],
                        "word_count": len(text.split()),
                        "detected_crisis_keywords": [],
                    }
                    
        except Exception as e:
            logger.error(f"OpenRouter analysis failed: {str(e)}")
            return None

    def _rule_based_analysis(self, text: str) -> Dict[str, Any]:
        """Fallback rule-based emotion analysis"""
        text_lower = text.lower()
        
        # Simple keyword-based emotion detection
        emotion_keywords = {
            "joy": ["happy", "joy", "glad", "excited", "pleased", "delighted", "cheerful"],
            "sadness": ["sad", "sorrow", "unhappy", "depressed", "down", "melancholy"],
            "anger": ["angry", "mad", "furious", "annoyed", "irritated", "rage"],
            "fear": ["afraid", "scared", "fear", "worried", "anxious", "nervous"],
            "love": ["love", "adore", "cherish", "affection", "caring"],
            "optimism": ["hopeful", "optimistic", "positive", "confident", "upbeat"],
        }
        
        detected_emotions = []
        emotion_scores = {}
        
        for emotion, keywords in emotion_keywords.items():
            count = sum(1 for keyword in keywords if keyword in text_lower)
            if count > 0:
                emotion_scores[emotion] = min(count / len(keywords), 1.0)
                detected_emotions.append({"label": emotion, "score": emotion_scores[emotion]})
        
        # Sort by score
        detected_emotions.sort(key=lambda x: x["score"], reverse=True)
        
        # Determine sentiment
        positive_emotions = {"joy", "love", "optimism"}
        negative_emotions = {"sadness", "anger", "fear"}
        
        positive_score = sum(emotion_scores.get(e, 0) for e in positive_emotions)
        negative_score = sum(emotion_scores.get(e, 0) for e in negative_emotions)
        
        if positive_score > negative_score:
            sentiment = [{"label": "POSITIVE", "score": positive_score}]
            mood_score = 5 + int(positive_score * 3)
        elif negative_score > positive_score:
            sentiment = [{"label": "NEGATIVE", "score": negative_score}]
            mood_score = 5 - int(negative_score * 3)
        else:
            sentiment = [{"label": "NEUTRAL", "score": 0.5}]
            mood_score = 5
        
        # Get wheel emotions
        wheel_emotions = []
        for emotion in detected_emotions[:3]:
            mapped = self.emotion_wheel_mapping.get(emotion["label"], emotion["label"])
            if mapped not in wheel_emotions:
                wheel_emotions.append(mapped)
        
        if not wheel_emotions:
            wheel_emotions = ["neutral"]
        
        return {
            "emotions": detected_emotions[:3] if detected_emotions else [{"label": "neutral", "score": 0.5}],
            "sentiment": sentiment,
            "risk_level": self._derive_risk_signal(text, detected_emotions),
            "mood_score": max(1, min(10, mood_score)),
            "wheel_emotions": wheel_emotions,
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

    def _detect_crisis_keywords(self, text: str) -> List[str]:
        text_lower = text.lower()
        return [k for k in self.crisis_keywords if k in text_lower]
