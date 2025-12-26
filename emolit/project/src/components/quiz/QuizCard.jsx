import React, { useState } from "react";
import { Card } from "../ui/card";
import { Button } from "../ui/button";
import { Badge } from "../ui/badge";
import { CheckCircle2, XCircle, ArrowRight } from "lucide-react";

export default function QuizCard({ question, onAnswer }) {
  const [selectedAnswer, setSelectedAnswer] = useState(null);
  const [showResult, setShowResult] = useState(false);
  const [isCorrect, setIsCorrect] = useState(false);

  const handleAnswerSelect = (answerIndex) => {
    if (showResult) return;
    
    setSelectedAnswer(answerIndex);
    const correct = answerIndex === question.correctIndex;
    setIsCorrect(correct);
    setShowResult(true);
    
    // Call parent callback after a delay
    setTimeout(() => {
      onAnswer(correct, answerIndex);
    }, 2000);
  };

  const getButtonStyle = (index) => {
    if (!showResult) {
      return selectedAnswer === index 
        ? "bg-purple-500 text-white" 
        : "bg-white border-gray-200 hover:bg-purple-50";
    }
    
    if (index === question.correctIndex) {
      return "bg-green-100 border-green-500 text-green-800";
    }
    
    if (selectedAnswer === index && !isCorrect) {
      return "bg-red-100 border-red-500 text-red-800";
    }
    
    return "bg-gray-100 border-gray-300 text-gray-600";
  };

  const getButtonIcon = (index) => {
    if (!showResult) return null;
    
    if (index === question.correctIndex) {
      return <CheckCircle2 className="w-5 h-5" />;
    }
    
    if (selectedAnswer === index && !isCorrect) {
      return <XCircle className="w-5 h-5" />;
    }
    
    return null;
  };

  return (
    <Card className="p-6 bg-gradient-to-br from-white to-purple-50/30 border-purple-200">
      <div className="mb-6">
        <Badge variant="outline" className="mb-4 text-purple-700 border-purple-300">
          {question.type}
        </Badge>
        <h3 className="text-xl font-semibold text-gray-900 mb-3">
          {question.question}
        </h3>
        {question.context && (
          <p className="text-gray-600 text-sm bg-purple-50 p-3 rounded-lg">
            {question.context}
          </p>
        )}
      </div>

      <div className="space-y-3">
        {question.options.map((option, index) => (
          <Button
            key={index}
            variant="outline"
            className={`w-full justify-between text-left h-auto p-4 transition-all duration-200 ${getButtonStyle(index)}`}
            onClick={() => handleAnswerSelect(index)}
            disabled={showResult}
          >
            <span className="font-medium">{option}</span>
            {getButtonIcon(index)}
          </Button>
        ))}
      </div>

      {showResult && (
        <div className="mt-6 p-4 rounded-lg bg-gradient-to-r from-gray-50 to-gray-100">
          <div className="flex items-center gap-2 mb-2">
            {isCorrect ? (
              <CheckCircle2 className="w-5 h-5 text-green-600" />
            ) : (
              <XCircle className="w-5 h-5 text-red-600" />
            )}
            <span className={`font-semibold ${isCorrect ? 'text-green-700' : 'text-red-700'}`}>
              {isCorrect ? 'Correct!' : 'Not quite right'}
            </span>
          </div>
          <p className="text-gray-700 text-sm">
            {question.explanation}
          </p>
          <div className="flex justify-center mt-4">
            <ArrowRight className="w-5 h-5 text-purple-500 animate-bounce" />
          </div>
        </div>
      )}
    </Card>
  );
}