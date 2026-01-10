from fastapi import APIRouter, Depends, HTTPException
from typing import List, Optional
from datetime import datetime
import random
import hashlib
from bson import ObjectId

from app.database import get_database
from app.models.schemas import QuizQuestion, QuizAnswer, QuizResult
from app.core.security import get_current_user

router = APIRouter()

# # ---------- GET QUIZ QUESTIONS ----------

# @router.get("/questions", response_model=List[QuizQuestion])
# async def get_quiz_questions(
#     limit: int = 5,
#     difficulty: Optional[int] = None,
#     current_user: dict = Depends(get_current_user),
# ):
#     """
#     Generate quiz questions from emotion vocabulary.
#     Questions reinforce emotional understanding.
#     Always returns exactly 5 questions from Emotions vocabulary.xlsx.
#     """
#     db = await get_database()
    
#     # Ensure emotion words are loaded from Excel
#     from app.routes.emotions import load_emotion_words_once
#     await load_emotion_words_once(db)

#     query = {}
#     if difficulty is not None:
#         query["level"] = difficulty

#     words = await db.emotion_words.find(query).to_list(length=100)

#     if not words:
#         raise HTTPException(status_code=404, detail="No emotion words available. Please ensure Emotions vocabulary.xlsx is loaded.")

#     random.shuffle(words)
#     # Always use exactly 5 questions
#     selected = words[:5]

#     questions = []
#     for word in selected:
#         # Use word ID as seed for deterministic randomization
#         word_id_str = str(word["_id"])
#         seed = int(hashlib.md5(word_id_str.encode()).hexdigest()[:8], 16)
#         random.seed(seed)
        
#         # Get all words to use as distractors
#         all_words_list = await db.emotion_words.find({}).to_list(length=1000)
        
#         # Create options: correct definition + 3 distractors (definitions from other words)
#         correct_definition = word.get("definition", "")
#         options = [correct_definition]
        
#         # Get random words as distractors (exclude current word)
#         other_words = [w for w in all_words_list if w["_id"] != word["_id"]]
#         random.shuffle(other_words)
        
#         # Add 3 random definitions as wrong options
#         for distractor_word in other_words[:3]:
#             distractor_def = distractor_word.get("definition", "")
#             if distractor_def and distractor_def not in options:
#                 options.append(distractor_def)
        
#         # If we don't have enough options, pad with similar/opposite words
#         while len(options) < 4:
#             similar = word.get("similar_words", [])
#             opposite = word.get("opposite_words", [])
#             all_related = similar + opposite
#             if all_related:
#                 random.shuffle(all_related)
#                 for related_word in all_related:
#                     if related_word not in options and len(options) < 4:
#                         options.append(related_word)
        
#         # Ensure we have exactly 4 options
#         while len(options) < 4:
#             options.append("An emotional state")
        
#         # Shuffle options so correct answer isn't always first
#         random.shuffle(options)
        
#         # Find the index of the correct answer
#         correct_index = options.index(correct_definition) if correct_definition in options else 0

#         questions.append(
#             QuizQuestion(
#                 id=str(word["_id"]),
#                 word=word["word"],
#                 question=f"What is the definition of '{word['word']}'?",
#                 options=options[:4],  # Ensure exactly 4 options
#                 difficulty_level=word.get("level", random.randint(1, 5)),
#                 category=word.get("category", "general"),
#             )
#         )
        
#         # Reset random seed for next iteration
#         random.seed()

#     return questions


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

    # Get all words once for use as distractors
    all_words_list = await db.emotion_words.find({}).to_list(length=1000)

    questions = []
    for word in selected:
        # Use word ID as seed for deterministic randomization
        word_id_str = str(word["_id"])
        seed = int(hashlib.md5(word_id_str.encode()).hexdigest()[:8], 16)
        
        # Create a separate Random instance for this word to avoid global state issues
        rng = random.Random(seed)
        
        # Create options: correct definition + 3 distractors (definitions from other words)
        correct_definition = word.get("definition", "")
        options = [correct_definition]
        
        # Get random words as distractors (exclude current word)
        other_words = [w for w in all_words_list if w["_id"] != word["_id"]]
        rng.shuffle(other_words)
        
        # Add 3 random definitions as wrong options
        for distractor_word in other_words[:3]:
            distractor_def = distractor_word.get("definition", "")
            if distractor_def and distractor_def not in options:
                options.append(distractor_def)
        
        # If we don't have enough options, pad with similar/opposite words
        while len(options) < 4:
            similar = word.get("similar_words", [])
            opposite = word.get("opposite_words", [])
            all_related = similar + opposite
            if all_related:
                rng.shuffle(all_related)
                for related_word in all_related:
                    if related_word not in options and len(options) < 4:
                        options.append(related_word)
        
        # Ensure we have exactly 4 options
        while len(options) < 4:
            options.append("An emotional state")
        
        # Shuffle options so correct answer isn't always first
        rng.shuffle(options)
        
        # Find the index of the correct answer
        correct_index = options.index(correct_definition) if correct_definition in options else 0

        questions.append(
            QuizQuestion(
                id=str(word["_id"]),
                word=word["word"],
                question=f"What is the definition of '{word['word']}'?",
                options=options[:4],  # Ensure exactly 4 options
                difficulty_level=word.get("level", random.randint(1, 5)),
                category=word.get("category", "general"),
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

        # Reconstruct options deterministically using same seed as question generation
        word_id_str = str(word_doc["_id"])
        seed = int(hashlib.md5(word_id_str.encode()).hexdigest()[:8], 16)
        random.seed(seed)
        
        # Reconstruct options (same logic as question generation)
        correct_definition = word_doc.get("definition", "")
        all_words_list = await db.emotion_words.find({}).to_list(length=1000)
        options = [correct_definition]
        
        other_words = [w for w in all_words_list if w["_id"] != word_doc["_id"]]
        random.shuffle(other_words)
        
        for distractor_word in other_words[:3]:
            distractor_def = distractor_word.get("definition", "")
            if distractor_def and distractor_def not in options:
                options.append(distractor_def)
        
        while len(options) < 4:
            similar = word_doc.get("similar_words", [])
            opposite = word_doc.get("opposite_words", [])
            all_related = similar + opposite
            if all_related:
                random.shuffle(all_related)
                for related_word in all_related:
                    if related_word not in options and len(options) < 4:
                        options.append(related_word)
        
        while len(options) < 4:
            options.append("An emotional state")
        
        random.shuffle(options)
        correct_index = options.index(correct_definition) if correct_definition in options else 0
        
        # Check if selected answer matches correct index
        if 0 <= answer.selected_answer < len(options) and answer.selected_answer == correct_index:
            correct_words.append(word_doc["word"])
        else:
            incorrect_words.append(word_doc["word"])
        
        # Reset random seed
        random.seed()

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


