from fastapi import APIRouter, Depends, HTTPException
from typing import List
from datetime import datetime
from app.database import get_database
from app.models.schemas import QuizQuestion, QuizAnswer, QuizResult
from app.core.security import get_current_user
from bson import ObjectId
import uuid
import random

router = APIRouter()

# Sample quiz questions
QUIZ_QUESTIONS = [
    {
        "id": str(uuid.uuid4()),
        "word": "vexed",
        "question": "What does 'vexed' mean?",
        "options": [
            "Feeling annoyed, frustrated, or worried, especially about a persistent problem",
            "Arousing pleasure tinged with sadness or pain; containing elements of both happiness and sorrow", 
            "Completely puzzled or confused; unable to understand or make sense of something",
            "Feeling extremely embarrassed, humiliated, or ashamed, especially in public"
        ],
        "correct_answer": 0,
        "difficulty_level": 2,
        "category": "angry"
    },
    {
        "id": str(uuid.uuid4()),
        "word": "serene",
        "question": "Which situation best demonstrates serenity?",
        "options": [
            "Jumping with excitement after good news",
            "Feeling calm and peaceful while meditating by a lake",
            "Being angry about an unfair situation", 
            "Worrying about an upcoming exam"
        ],
        "correct_answer": 1,
        "difficulty_level": 1,
        "category": "happy"
    },
    {
        "id": str(uuid.uuid4()),
        "word": "melancholy",
        "question": "What is the best definition of melancholy?",
        "options": [
            "Extreme happiness and joy",
            "A pensive sadness; thoughtful or gentle sadness often mixed with longing",
            "Intense anger and frustration",
            "Complete confusion and bewilderment"
        ],
        "correct_answer": 1,
        "difficulty_level": 3,
        "category": "sad"
    },
    {
        "id": str(uuid.uuid4()),
        "word": "elated",
        "question": "What is the meaning of elated?",
        "options": [
            "Feeling deep sadness",
            "Ecstatically happy or proud; jubilant; in high spirits",
            "Feeling confused and lost",
            "Being extremely angry"
        ],
        "correct_answer": 1,
        "difficulty_level": 2,
        "category": "happy"
    },
    {
        "id": str(uuid.uuid4()),
        "word": "anxious",
        "question": "Which scenario best describes feeling anxious?",
        "options": [
            "Being relaxed on a beach",
            "Feeling confident about a presentation",
            "Experiencing worry, unease, or nervousness about an imminent event or something with an uncertain outcome",
            "Feeling indifferent about everything"
        ],
        "correct_answer": 2,
        "difficulty_level": 2,
        "category": "fear"
    }
]

@router.get("/questions", response_model=List[QuizQuestion])
async def get_quiz_questions(
    limit: int = 5,
    difficulty: int = None,
    current_user: dict = Depends(get_current_user)
):
    """Get quiz questions"""
    questions = QUIZ_QUESTIONS.copy()
    
    if difficulty:
        questions = [q for q in questions if q["difficulty_level"] == difficulty]
    
    # Randomize and limit questions
    random.shuffle(questions)
    selected_questions = questions[:limit]
    
    # Remove correct answers from response
    quiz_questions = []
    for q in selected_questions:
        quiz_questions.append(QuizQuestion(
            id=q["id"],
            word=q["word"],
            question=q["question"],
            options=q["options"],
            difficulty_level=q["difficulty_level"],
            category=q["category"]
        ))
    
    return quiz_questions

@router.post("/submit", response_model=dict)
async def submit_quiz(
    answers: List[QuizAnswer],
    current_user: dict = Depends(get_current_user),
):
    """Submit quiz answers and get results"""
    db = await get_database()
    user_id = str(current_user["_id"])
    
    correct_count = 0
    total_questions = len(answers)
    correct_answers = []
    incorrect_answers = []
    
    for answer in answers:
        # Find the question
        question = next((q for q in QUIZ_QUESTIONS if q["id"] == answer.question_id), None)
        if not question:
            continue
            
        if answer.selected_answer == question["correct_answer"]:
            correct_count += 1
            correct_answers.append(question["word"])
        else:
            incorrect_answers.append(question["word"])
    
    score = int((correct_count / total_questions) * 100) if total_questions > 0 else 0
    xp_earned = correct_count * 10  # 10 XP per correct answer
    
    # Update user progress
    progress = await db.user_progress.find_one({"user_id": user_id})
    
    if progress:
        await db.user_progress.update_one(
            {"user_id": user_id},
            {
                "$inc": {
                    "total_xp": xp_earned,
                    "words_learned": correct_count
                },
                "$set": {"updated_at": datetime.utcnow()}
            }
        )
    
    return {
        "score": score,
        "correct_answers": correct_count,
        "total_questions": total_questions,
        "xp_earned": xp_earned,
        "correct_words": correct_answers,
        "incorrect_words": incorrect_answers
    }

@router.post("/submit-answer", response_model=dict)
async def submit_quiz_answers(
    answers: List[QuizAnswer],
    current_user: dict = Depends(get_current_user),
):
    """Submit quiz answers (alternative endpoint)"""
    return await submit_quiz(answers, current_user)

@router.get("/results/{quiz_id}")
async def get_quiz_results(
    quiz_id: str,
    current_user: dict = Depends(get_current_user)
):
    """Get quiz results (placeholder)"""
    return {
        "quiz_id": quiz_id,
        "message": "Quiz results feature coming soon"
    }
