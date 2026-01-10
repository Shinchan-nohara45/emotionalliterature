import httpx
from typing import Dict, Any, List, Optional
from app.core.config import settings
from app.models.schemas import AIResponse
import logging

logger = logging.getLogger(__name__)


class ResponseGenerator:
    """
    Generates reflective, emotionally supportive responses for EmoLit.

    This service is NOT therapy.
    It does not diagnose, judge, or instruct.
    It reflects, validates, and gently supports self-awareness.
    """

    def __init__(self):
        self._emergency_resources = {
            "US": {
                "name": "988 Suicide & Crisis Lifeline",
                "contact": "Call or text 988",
            },
            "UK": {
                "name": "Samaritans",
                "contact": "Call 116 123",
            },
            "IN": {
                "name": "AASRA",
                "contact": "Call 9152987821",
            },
        }

    # ---------- Public API ----------

    async def generate_response(
        self,
        text: str,
        emotion_analysis: Dict[str, Any],
        user_context: Optional[Dict[str, Any]] = None,
        recent_emotions: Optional[List[Dict[str, Any]]] = None,
    ) -> Dict[str, Any]:
        """
        Generate a reflective response to a journal entry.

        risk_level is treated as a signal, not a diagnosis.
        """
        try:
            risk_level = emotion_analysis.get("risk_level", "low")

            if risk_level == "high":
                crisis_response = self._generate_crisis_response(user_context)
                return {
                    "response": crisis_response.response,
                    "response_type": crisis_response.response_type,
                    "suggestions": crisis_response.suggestions,
                    "risk_level": crisis_response.risk_level,
                }

            response_text = await self._generate_supportive_response(
                text, emotion_analysis, user_context
            )

            return {
                "response": response_text,
                "response_type": "supportive",
                "suggestions": self._generate_suggestions(emotion_analysis),
                "risk_level": risk_level,
            }

        except Exception as e:
            logger.error(f"Response generation failed: {str(e)}")
            return {
                "response": (
                    "Thank you for sharing this with me. "
                    "Even when things feel unclear, your experience still matters."
                ),
                "response_type": "fallback",
                "suggestions": ["Take a slow breath and notice how your body feels right now."],
                "risk_level": "unknown",
            }

    # ---------- Core Generators ----------

    async def _generate_supportive_response(
        self,
        text: str,
        emotion_analysis: Dict[str, Any],
        user_profile: Optional[Dict[str, Any]],
    ) -> str:
        emotions = [e.get("label", "").lower() for e in emotion_analysis.get("emotions", [])]
        wheel_emotions = emotion_analysis.get("wheel_emotions", [])

        qualitative_mood = self._describe_mood(emotion_analysis.get("mood_score", 5))

        profile_context = self._build_profile_context(user_profile)

        prompt = f"""
User reflection:
{text[:500]}

Emotional signals:
- Emotional tone appears {qualitative_mood}
- Emotions that may be present: {", ".join(emotions[:3]) or "mixed or unclear"}
- Emotion categories: {wheel_emotions or "varied"}

User context:
{profile_context}

Guidelines:
- Reflect, do not judge
- Avoid certainty
- Speak gently and personally
- Do not ask any questions in return about the user's feelings or experiences.
- Be like a companion, not a therapist.
- No advice that sounds like therapy
"""

        system_prompt = (
            "You are Emi, a calm and emotionally intelligent companion for EmoLit.\n"
            "You help users notice and understand their feelings without labeling or diagnosing.\n"
            "You validate experiences and offer gentle reflections.\n"
            "Use phrases like 'it seems', 'you might be noticing', 'it sounds like'.\n"
            "Never claim authority over the user's emotions."
        )

        if not settings.openrouter_api_key:
            return self._fallback_reflection(qualitative_mood)

        async with httpx.AsyncClient(timeout=30.0) as client:
            response = await client.post(
                f"{settings.openrouter_base_url}/chat/completions",
                headers={
                    "Authorization": f"Bearer {settings.openrouter_api_key}",
                    "Content-Type": "application/json",
                },
                json={
                    "model": "anthropic/claude-3.5-sonnet",
                    "messages": [
                        {"role": "system", "content": system_prompt},
                        {"role": "user", "content": prompt},
                    ],
                    "max_tokens": 300,
                    "temperature": 0.6,
                },
            )

            if response.status_code != 200:
                logger.error(response.text)
                return self._fallback_reflection(qualitative_mood)

            return response.json()["choices"][0]["message"]["content"].strip()

    # ---------- Crisis Handling ----------

    def _generate_crisis_response(self, user_profile: Optional[Dict[str, Any]]) -> AIResponse:
        region = (user_profile or {}).get("country")
        resource = self._resolve_emergency_resource(region)

        message = (
            "It sounds like things may feel especially heavy right now. "
            "You don’t have to face this alone.\n\n"
            "If you feel open to it, reaching out to someone who can support you right now "
            "could make a difference."
        )

        if resource:
            message += f"\n\n{resource['name']}: {resource['contact']}"

        return AIResponse(
            response=message,
            response_type="supportive-crisis",
            suggestions=[
                "Consider reaching out to someone you trust",
                "Pause and focus on slow, steady breathing",
            ],
            risk_level="high",
        )

    # ---------- Helpers ----------

    def _describe_mood(self, score: int) -> str:
        if score >= 7:
            return "generally positive or lighter"
        if score <= 3:
            return "heavy or emotionally difficult"
        return "mixed or neutral"

    def _build_profile_context(self, profile: Optional[Dict[str, Any]]) -> str:
        if not profile:
            return "No additional user context provided."

        parts = []
        if profile.get("usage_goal"):
            parts.append(f"Using EmoLit for {profile['usage_goal']}")
        if profile.get("experience_level"):
            parts.append(f"Experience level: {profile['experience_level']}")

        return "; ".join(parts) or "Minimal profile context."

    def _resolve_emergency_resource(self, region: Optional[str]) -> Optional[Dict[str, str]]:
        return self._emergency_resources.get(region)

    def _fallback_reflection(self, qualitative_mood: str) -> str:
        return (
            f"It sounds like your emotional state right now feels {qualitative_mood}. "
            "Thank you for taking the time to reflect and share this."
        )

    def _generate_suggestions(self, emotion_analysis: Dict[str, Any]) -> List[str]:
        return [
            "Take a moment to notice what this feeling is asking for",
            "You might find it helpful to write a few more lines about this",
            "Be gentle with yourself today",
        ]
