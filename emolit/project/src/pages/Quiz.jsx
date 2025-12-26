import React, { useState, useEffect, useCallback } from "react";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Progress } from "@/components/ui/progress";
import { Trophy, RotateCcw, Star, Loader2 } from "lucide-react";
import { quizAPI } from "../services/api";

import QuizCard from "../components/quiz/QuizCard";

export default function Quiz() {
  const [questions, setQuestions] = useState([]);
  const [currentQuestionIndex, setCurrentQuestionIndex] = useState(0);
  const [score, setScore] = useState(0);
  const [isComplete, setIsComplete] = useState(false);
  const [isLoading, setIsLoading] = useState(true);
  const [answers, setAnswers] = useState([]);

  const shuffleWithCorrectIndex = useCallback((options, correctIndex) => { // Wrapped in useCallback for stability, though not strictly necessary as it's a pure function and doesn't capture state
    const correctAnswer = options[correctIndex];
    const shuffled = [...options].sort(() => Math.random() - 0.5);
    const newCorrectIndex = shuffled.indexOf(correctAnswer);
    
    return {
      options: shuffled,
      correctIndex: newCorrectIndex
    };
  }, []); // Empty dependency array as it doesn't depend on any props or state

  const generateQuiz = useCallback(async () => {
    setIsLoading(true);
    try {
      const quizQuestions = await quizAPI.getQuestions(5);
      
      // Transform API questions to match QuizCard format
      // Note: We don't know the correct answer from the API, so we'll track it differently
      const transformedQuestions = quizQuestions.map((q) => {
        return {
          id: q.id,
          type: "Definition",
          question: q.question,
          options: q.options,
          correctIndex: 0, // We'll determine this when submitting
          explanation: `Question about: ${q.word}`,
          context: null,
          word: q.word
        };
      });
      
      setQuestions(transformedQuestions);
    } catch (error) {
      console.error("Error generating quiz:", error);
    }
    setIsLoading(false);
  }, []);

  useEffect(() => {
    generateQuiz();
  }, [generateQuiz]);

  const completeQuiz = async () => {
    // Submit answers to backend
    try {
      const result = await quizAPI.submitAnswers(answers);
      setScore(result.correct_answers || result.score || score);
      setIsComplete(true);
    } catch (error) {
      console.error("Error submitting quiz:", error);
      setIsComplete(true);
    }
  };

  const handleAnswer = async (isCorrect, selectedIndex) => {
    const currentQuestion = questions[currentQuestionIndex];
    
    // Store answer
    setAnswers([...answers, {
      question_id: currentQuestion.id,
      selected_answer: selectedIndex
    }]);
    
    if (isCorrect) {
      setScore(score + 1);
    }
    
    setTimeout(() => {
      if (currentQuestionIndex < questions.length - 1) {
        setCurrentQuestionIndex(currentQuestionIndex + 1);
      } else {
        completeQuiz();
      }
    }, 2000);
  };

  const restartQuiz = () => {
    setCurrentQuestionIndex(0);
    setScore(0);
    setIsComplete(false);
    setAnswers([]);
    generateQuiz();
  };

  // Only show full-screen loading if initially fetching and no questions are loaded yet
  if (isLoading && questions.length === 0) {
    return (
      <div className="p-6 max-w-2xl mx-auto">
        <div className="text-center mb-8">
          <div className="w-16 h-16 bg-purple-100 rounded-full animate-pulse mx-auto mb-4" />
          <p className="text-gray-600">Preparing your quiz...</p>
        </div>
      </div>
    );
  }

  if (isComplete) {
    const percentage = Math.round((score / questions.length) * 100);
    const isExcellent = percentage >= 80;
    const isGood = percentage >= 60;
    
    return (
      <div className="p-6 max-w-2xl mx-auto">
        <Card className="p-8 text-center bg-gradient-to-br from-purple-50 to-pink-50 border-purple-200">
          <div className="mb-6">
            <div className={`w-20 h-20 rounded-full flex items-center justify-center mx-auto mb-4 ${
              isExcellent ? 'bg-yellow-100' : isGood ? 'bg-green-100' : 'bg-blue-100'
            }`}>
              {isExcellent ? (
                <Star className="w-10 h-10 text-yellow-500" />
              ) : (
                <Trophy className="w-10 h-10 text-purple-500" />
              )}
            </div>
            <h2 className="text-2xl font-bold text-gray-900 mb-2">
              {isExcellent ? 'Excellent!' : isGood ? 'Great Job!' : 'Good Effort!'}
            </h2>
            <p className="text-gray-600 mb-4">You completed the quiz!</p>
          </div>
          
          <div className="bg-white p-6 rounded-xl mb-6">
            <div className="text-4xl font-bold text-purple-600 mb-2">
              {score}/{questions.length}
            </div>
            <p className="text-gray-600 mb-4">Questions Correct</p>
            <div className="2xl font-bold text-green-600">
              +{score * 10} XP
            </div>
            <p className="text-sm text-gray-600">Experience Points Earned</p>
          </div>

          <Button 
            onClick={restartQuiz}
            className="bg-gradient-to-r from-purple-500 to-pink-500 hover:from-purple-600 hover:to-pink-600 text-white"
            disabled={isLoading} // Disable button while new quiz is loading
          >
            {isLoading ? ( // Show loading spinner and text when generating
              <>
                <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                Generating...
              </>
            ) : (
              <>
                <RotateCcw className="w-4 h-4 mr-2" />
                Try Another Quiz
              </>
            )}
          </Button>
        </Card>
      </div>
    );
  }

  if (questions.length === 0) {
    return (
      <div className="p-6 max-w-2xl mx-auto text-center">
        <p className="text-gray-600">No quiz questions available</p>
      </div>
    );
  }

  const progressPercentage = ((currentQuestionIndex + 1) / questions.length) * 100;

  return (
    <div className="p-6 max-w-2xl mx-auto">
      {/* Quiz Header */}
      <div className="mb-8">
        <div className="flex justify-between items-center mb-4">
          <h1 className="text-2xl font-bold text-gray-900">
            Emotion Quiz
          </h1>
          <div className="text-right">
            <p className="text-sm text-gray-600">Question</p>
            <p className="text-xl font-bold text-purple-600">
              {currentQuestionIndex + 1}/{questions.length}
            </p>
          </div>
        </div>
        
        <Progress 
          value={progressPercentage} 
          className="h-3 bg-purple-100" 
        />
        
        <div className="flex justify-between mt-2 text-sm text-gray-600">
          <span>Score: {score}/{questions.length}</span>
          <span>{Math.round(progressPercentage)}% Complete</span>
        </div>
      </div>

      {/* Quiz Question */}
      <QuizCard 
        question={questions[currentQuestionIndex]}
        onAnswer={handleAnswer}
      />
    </div>
  );
}
