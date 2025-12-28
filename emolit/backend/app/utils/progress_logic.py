from typing import Dict, Any, List
import math
from collections import Counter


class ProgressLogic:
    """
    Central authority for user progress interpretation in EmoLit.

    This class defines:
    - What growth means
    - How progress is measured
    - How emotions evolve over time
    - How milestones are framed (soft, non-gamified)

    No database access.
    No framework dependencies.
    Pure meaning + math.
    """

    # -----------------------------
    # LEVEL & XP LOGIC
    # -----------------------------

    @staticmethod
    def calculate_level(total_xp: int) -> int:
        """
        Level progression is intentionally slow and reflective.
        """
        return max(1, int(math.sqrt(total_xp / 100)) + 1)

    @staticmethod
    def xp_for_next_level(current_level: int) -> int:
        """
        Total XP required to *reach* the next level.
        """
        return (current_level ** 2) * 100

    @staticmethod
    def progress_percentage(total_xp: int, current_level: int) -> int:
        """
        How far the user is into their current level (0–100).
        """
        prev_level_xp = ((current_level - 1) ** 2) * 100
        next_level_xp = ProgressLogic.xp_for_next_level(current_level)

        if next_level_xp <= prev_level_xp:
            return 0

        progress = (total_xp - prev_level_xp) / (next_level_xp - prev_level_xp)
        return max(0, min(100, int(progress * 100)))

    # -----------------------------
    # SOFT MILESTONES (NOT TROPHIES)
    # -----------------------------

    @staticmethod
    def evaluate_milestones(progress: Dict[str, Any]) -> List[Dict[str, Any]]:
        """
        Milestones represent gentle indicators of growth.
        They are descriptive, not competitive.
        """
        milestones = []

        def unlock(condition: bool, id: str, label: str):
            if condition:
                milestones.append({
                    "id": id,
                    "label": label,
                    "unlocked": True
                })

        unlock(
            progress.get("journal_entries_count", 0) >= 1,
            "first_steps",
            "You’ve started showing up for yourself"
        )

        unlock(
            progress.get("journal_entries_count", 0) >= 5,
            "building_habit",
            "Journaling is becoming a habit"
        )

        unlock(
            progress.get("longest_streak", 0) >= 7,
            "consistency",
            "You’re practicing consistency"
        )

        unlock(
            progress.get("words_learned", 0) >= 10,
            "emotional_vocabulary",
            "You’re expanding your emotional vocabulary"
        )

        unlock(
            progress.get("current_level", 1) >= 5,
            "self_awareness",
            "You’re developing deeper emotional awareness"
        )

        return milestones

    # -----------------------------
    # EMOTIONAL TREND ANALYSIS
    # -----------------------------

    @staticmethod
    def analyze_emotional_trends(
        recent_entries: List[Dict[str, Any]]
    ) -> Dict[str, Any]:
        """
        Derives non-diagnostic emotional trends from recent journal entries.
        """
        if not recent_entries:
            return {
                "dominant_emotions": [],
                "emotional_direction": "neutral",
                "confidence": 0.0
            }

        emotion_counter = Counter()
        mood_scores = []

        for entry in recent_entries:
            emotions = entry.get("detected_emotions", [])
            emotion_counter.update(emotions)

            mood = entry.get("mood_score")
            if isinstance(mood, (int, float)):
                mood_scores.append(mood)

        dominant_emotions = [
            e for e, _ in emotion_counter.most_common(3)
        ]

        emotional_direction = "neutral"
        confidence = 0.0

        if len(mood_scores) >= 3:
            first_half = mood_scores[: len(mood_scores) // 2]
            second_half = mood_scores[len(mood_scores) // 2 :]

            if sum(second_half) > sum(first_half):
                emotional_direction = "improving"
            elif sum(second_half) < sum(first_half):
                emotional_direction = "declining"

            confidence = min(1.0, len(mood_scores) / 10)

        return {
            "dominant_emotions": dominant_emotions,
            "emotional_direction": emotional_direction,
            "confidence": round(confidence, 2)
        }

    # -----------------------------
    # JOURNAL THEMES (LIGHTWEIGHT)
    # -----------------------------

    @staticmethod
    def extract_journal_themes(
        recent_entries: List[Dict[str, Any]]
    ) -> List[Dict[str, Any]]:
        """
        Identifies recurring emotional themes based on detected emotions.
        """
        theme_counter = Counter()

        for entry in recent_entries:
            for emotion in entry.get("detected_emotions", []):
                theme_counter[emotion] += 1

        themes = []
        for theme, count in theme_counter.most_common(5):
            themes.append({
                "theme": theme,
                "frequency": count
            })

        return themes
