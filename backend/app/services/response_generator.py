import httpx
from typing import Dict, Any, List
from app.core.config import settings
import logging

logger = logging.getLogger(__name__)

class ResponseGenerator:
    def __init__(self):
        self.emergency_resources = {
            'US': {
                'number': '988',
                'name': 'Suicide & Crisis Lifeline',
                'text': 'Text HOME to 741741'
            },
            'UK': {
                'number': '116 123',
                'name': 'Samaritans',
                'email': 'jo@samaritans.org'
            },
            'IN': {
                'number': '9152987821',
                'name': 'AASRA',
                'email': 'aasrahelpline@yahoo.com'
            }
        }

    async def generate_response(self, journal_entry: str, emotion_analysis: Dict[str, Any]) -> Dict[str, Any]:
        """Generate AI response to journal entry using OpenRouter (Claude)"""
        try:
            risk_level = emotion_analysis.get('risk_level', 'low')
            
            if risk_level == 'high':
                return await self._generate_crisis_response(journal_entry, emotion_analysis)
            
            # Generate supportive response using OpenRouter (Claude)
            response = await self._generate_supportive_response(journal_entry, emotion_analysis)
            
            return {
                'response': response,
                'response_type': 'supportive',
                'suggestions': self._generate_suggestions(emotion_analysis),
                'risk_level': risk_level
            }
            
        except Exception as e:
            logger.error(f"Error generating response: {str(e)}")
            return {
                'response': "I hear you, and I want you to know that your feelings are valid. Thank you for sharing with me.",
                'response_type': 'fallback',
                'error': str(e)
            }

    async def _generate_supportive_response(self, journal_entry: str, emotion_analysis: Dict[str, Any]) -> str:
        """Generate supportive response using OpenRouter (Claude via Anthropic API)"""
        
        emotions = emotion_analysis.get('emotions', [])
        mood_score = emotion_analysis.get('mood_score', 5)
        wheel_emotions = emotion_analysis.get('wheel_emotions', [])
        
        context = f"""
        User's journal entry: {journal_entry[:500]}
        Detected emotions: {[e.get('label', 'unknown') for e in emotions[:3]]}
        Mood score: {mood_score}/10
        Emotion wheel categories: {wheel_emotions}
        """
        
        system_prompt = """You are Emi, a compassionate AI emotional support companion for EmoLit. 
        Your role is to:
        1. Provide empathetic, supportive responses to journal entries
        2. Help users understand their emotions using the emotion wheel
        3. Offer practical coping strategies and emotional insights
        4. Encourage emotional growth and self-awareness
        5. NEVER provide medical advice or therapy
        6. Always maintain a warm, understanding, and non-judgmental tone
        7. Keep responses between 100-200 words
        8. Reference specific emotions mentioned in the analysis
        
        Focus on validation, emotional intelligence, and gentle guidance."""

        try:
            if settings.openrouter_api_key:
                async with httpx.AsyncClient(timeout=30.0) as client:
                    # Use OpenRouter with Claude model (Anthropic-compatible endpoint)
                    response = await client.post(
                        f"{settings.openrouter_base_url}/chat/completions",
                        headers={
                            "Authorization": f"Bearer {settings.openrouter_api_key}",
                            "HTTP-Referer": "https://emolit.app",
                            "X-Title": "EmoLit",
                            "Content-Type": "application/json"
                        },
                        json={
                            "model": "anthropic/claude-3.5-sonnet",  # Using Claude via OpenRouter
                            "messages": [
                                {"role": "system", "content": system_prompt},
                                {"role": "user", "content": context}
                            ],
                            "max_tokens": 300,
                            "temperature": 0.7
                        }
                    )
                    
                    if response.status_code == 200:
                        data = response.json()
                        return data['choices'][0]['message']['content'].strip()
                    else:
                        logger.error(f"OpenRouter API error: {response.status_code} - {response.text}")
                        return self._generate_fallback_response(emotion_analysis)
            else:
                # Fallback response when OpenRouter is not available
                return self._generate_fallback_response(emotion_analysis)
                
        except Exception as e:
            logger.error(f"OpenRouter API error: {str(e)}")
            return self._generate_fallback_response(emotion_analysis)

    def _generate_fallback_response(self, emotion_analysis: Dict[str, Any]) -> str:
        """Generate fallback response when AI is unavailable"""
        emotions = emotion_analysis.get('emotions', [])
        mood_score = emotion_analysis.get('mood_score', 5)
        
        if mood_score >= 7:
            return "I can sense the positive energy in your words! It's wonderful that you're experiencing such uplifting emotions. These moments of joy and contentment are precious - try to savor them and remember what contributed to these feelings."
        elif mood_score <= 3:
            return "I can feel that you're going through a challenging time right now. Your feelings are completely valid, and it's okay to not be okay sometimes. Remember that difficult emotions are temporary and you have the strength to work through them."
        else:
            return "Thank you for sharing your thoughts and feelings with me. I can see you're experiencing a mix of emotions, which is completely normal. Take your time processing these feelings, and remember that I'm here to support you."

    async def _generate_crisis_response(self, journal_entry: str, emotion_analysis: Dict[str, Any]) -> Dict[str, Any]:
        """Generate crisis intervention response"""
        
        crisis_response = """I'm really concerned about you right now, and I want you to know that you're not alone. Your life has value, and there are people who want to help you through this difficult time.

Please reach out to a mental health professional or crisis counselor immediately:

🇺🇸 US: Call or text 988 (Suicide & Crisis Lifeline)
🇬🇧 UK: Call 116 123 (Samaritans)
🇮🇳 India: Call 9152987821 (AASRA)

If you're in immediate danger, please call your local emergency services (911, 999, 112).

Your feelings are temporary, but your life is precious. Please stay safe and reach out for help."""

        return {
            'response': crisis_response,
            'response_type': 'crisis',
            'emergency_contacts': self.emergency_resources,
            'requires_immediate_attention': True
        }

    def _generate_suggestions(self, emotion_analysis: Dict[str, Any]) -> List[str]:
        """Generate helpful suggestions based on emotions"""
        emotions = emotion_analysis.get('emotions', [])
        suggestions = []
        
        if not emotions:
            return ["Take a few deep breaths and practice mindfulness."]
        
        primary_emotion = emotions[0].get('label', 'unknown').lower()
        
        emotion_suggestions = {
            'joy': [
                "Savor this positive moment and consider what made it special",
                "Share your happiness with someone you care about",
                "Write down what you're grateful for today"
            ],
            'sadness': [
                "Allow yourself to feel this emotion - it's okay to be sad",
                "Consider reaching out to a friend or family member",
                "Try gentle activities like walking or listening to music"
            ],
            'anger': [
                "Take some deep breaths before reacting",
                "Try physical exercise to release tension",
                "Write down what triggered this feeling"
            ],
            'fear': [
                "Practice grounding techniques: name 5 things you can see",
                "Talk to someone you trust about your concerns",
                "Focus on what you can control in this situation"
            ]
        }
        
        return emotion_suggestions.get(primary_emotion, [
            "Practice self-compassion and be kind to yourself",
            "Consider what this emotion might be trying to tell you"
        ])
