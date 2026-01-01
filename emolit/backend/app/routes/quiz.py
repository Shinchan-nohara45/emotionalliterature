from fastapi import APIRouter, Depends, HTTPException
from typing import List, Optional
from datetime import datetime
import random
from bson import ObjectId

from app.database import get_database
from app.models.schemas import QuizQuestion, QuizAnswer, QuizResult
from app.core.security import get_current_user

router = APIRouter()

# ---------- GET QUIZ QUESTIONS ----------

@router.get("/questions", response_model=List[QuizQuestion])
async def get_quiz_questions(
    limit: int = 5,
    difficulty: Optional[int] = None,
    current_user: dict = Depends(get_current_user),
):
    """
    Generate quiz questions from emotion vocabulary.
    Questions reinforce emotional understanding.
    Always returns exactly 5 questions from Emotions vocabulary.xlsx.
    """
    db = await get_database()
    
    # Ensure emotion words are loaded from Excel
    from app.routes.emotions import load_emotion_words_once
    await load_emotion_words_once(db)

    query = {}
    if difficulty is not None:
        query["level"] = difficulty

    words = await db.emotion_words.find(query).to_list(length=100)

    if not words:
        raise HTTPException(status_code=404, detail="No emotion words available. Please ensure Emotions vocabulary.xlsx is loaded.")

    random.shuffle(words)
    # Always use exactly 5 questions
    selected = words[:5]

    questions = []
    for word in selected:
        options = word["similar_words"] + word["opposite_words"]
        random.shuffle(options)

        questions.append(
            QuizQuestion(
                id=str(word["_id"]),
                word=word["word"],
                question=f"What best describes the emotion '{word['word']}'?",
                options=options,
                difficulty_level=word["level"],
                category=word["category"],
            )
        )

    return questions

# ---------- SUBMIT QUIZ ----------

@router.post("/submit", response_model=QuizResult)
async def submit_quiz(
    answers: List[QuizAnswer],
    current_user: dict = Depends(get_current_user),
):
    """
    Evaluate quiz answers and update learning progress.
    Focus is on reinforcement, not evaluation.
    """
    db = await get_database()
    user_id = current_user["_id"]

    correct_words = []
    incorrect_words = []

    for answer in answers:
        word_doc = await db.emotion_words.find_one({"_id": ObjectId(answer.question_id)})
        if not word_doc:
            continue

        correct_option = word_doc["definition"]

        selected = None
        if 0 <= answer.selected_answer < len(word_doc["similar_words"] + word_doc["opposite_words"]):
            selected = (word_doc["similar_words"] + word_doc["opposite_words"])[answer.selected_answer]

        if selected and selected.lower() in word_doc["definition"].lower():
            correct_words.append(word_doc["word"])
        else:
            incorrect_words.append(word_doc["word"])

    xp_earned = len(correct_words) * 10

    # Track newly learned words (avoid double counting)
    newly_learned = 0
    for word in correct_words:
        already = await db.user_learned_words.find_one(
            {"user_id": user_id, "word": word}
        )
        if not already:
            await db.user_learned_words.insert_one(
                {"user_id": user_id, "word": word, "learned_at": datetime.utcnow()}
            )
            newly_learned += 1

    # Update progress
    await db.user_progress.update_one(
        {"user_id": user_id},
        {
            "$inc": {
                "total_xp": xp_earned,
                "words_learned": newly_learned,
            },
            "$set": {"updated_at": datetime.utcnow()},
        }
    )

    return QuizResult(
        score=int((len(correct_words) / max(len(answers), 1)) * 100),
        total_questions=len(answers),
        correct_answers=correct_words,  # Return array of correct words
        incorrect_answers=incorrect_words,
        xp_earned=xp_earned,
    )
