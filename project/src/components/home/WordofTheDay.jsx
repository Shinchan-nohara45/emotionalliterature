import React from "react";
import { Card } from "../ui/card";
import { Badge } from "../ui/badge";
import { Button } from "../ui/button";
import { Sparkles, BookOpen, Volume2 } from "lucide-react";

export default function WordOfTheDay({ word, onStartQuiz }) {
  if (!word) {
    return (
      <Card className="p-6 bg-gradient-to-br from-purple-50 to-pink-50 border-purple-200">
        <div className="text-center">
          <div className="w-16 h-16 bg-purple-100 rounded-full flex items-center justify-center mx-auto mb-4">
            <BookOpen className="w-8 h-8 text-purple-500" />
          </div>
          <p className="text-gray-600">No word of the day available yet</p>
        </div>
      </Card>
    );
  }
  const intensityColors = {
    mild: "bg-green-100 text-green-800",
    moderate: "bg-yellow-100 text-yellow-800", 
    intense: "bg-red-100 text-red-800"
  };

  const categoryColors = {
    joy: "bg-yellow-100 text-yellow-800",
    sadness: "bg-blue-100 text-blue-800",
    anger: "bg-red-100 text-red-800",
    fear: "bg-purple-100 text-purple-800",
    surprise: "bg-orange-100 text-orange-800",
    disgust: "bg-green-100 text-green-800",
    complex: "bg-gray-100 text-gray-800"
  };

  return (
    <Card className="overflow-hidden bg-gradient-to-br from-white to-purple-50/50 border-purple-200 shadow-lg">
      {/* Header */}
      <div className="bg-gradient-to-r from-purple-500 to-pink-500 text-white p-6">
        <div className="flex items-center justify-between mb-4">
          <div className="flex items-center gap-2">
            <Sparkles className="w-5 h-5" />
            <span className="text-sm font-medium opacity-90">Word of the Day</span>
          </div>
          <Button variant="ghost" size="sm" className="text-white hover:bg-white/20">
            <Volume2 className="w-4 h-4" />
          </Button>
        </div>
        
        <div className="mb-4">
          <h2 className="text-3xl font-bold mb-2 capitalize">{word.word}</h2>
          <div className="flex gap-2 flex-wrap">
            <Badge className={`${categoryColors[word.category] || categoryColors.complex} border-0`}>
              {word.category}
            </Badge>
            <Badge variant="outline" className="text-white border-white/50">
              Level {word.level}
            </Badge>
          </div>
        </div>
      </div>

      {/* Content */}
      <div className="p-6 space-y-6">
        {/* Definition */}
        <div>
          <h3 className="font-semibold text-gray-900 mb-2">Definition</h3>
          <p className="text-gray-700 text-lg leading-relaxed">{word.definition}</p>
        </div>

        {/* Example */}
        <div>
          <h3 className="font-semibold text-gray-900 mb-2">Example</h3>
          <div className="bg-purple-50 p-4 rounded-lg border-l-4 border-purple-500">
            <p className="text-gray-700 italic">"{word.example}"</p>
          </div>
        </div>

        {/* Similar & Opposite Words */}
        {(word.similar_words?.length > 0 || word.opposite_words?.length > 0) && (
          <div className="grid md:grid-cols-2 gap-4">
            {word.similar_words?.length > 0 && (
              <div>
                <h4 className="font-medium text-gray-900 mb-2">Similar words</h4>
                <div style={{ display: 'flex', flexWrap: 'wrap', gap: '0.5rem' }}>
                  {word.similar_words.map((similar, index) => (
                    <Badge key={index} variant="outline" className="text-purple-700 border-purple-300">
                      {similar}
                    </Badge>
                  ))}
                </div>
              </div>
            )}
            
            {word.opposite_words?.length > 0 && (
              <div>
                <h4 className="font-medium text-gray-900 mb-2">Opposite words</h4>
                <div style={{ display: 'flex', flexWrap: 'wrap', gap: '0.5rem' }}>
                  {word.opposite_words.map((opposite, index) => (
                    <Badge key={index} variant="outline" className="text-pink-700 border-pink-300">
                      {opposite}
                    </Badge>
                  ))}
                </div>
              </div>
            )}
          </div>
        )}

        {/* Cultural Context */}
        {word.cultural_context && (
          <div>
            <h3 className="font-semibold text-gray-900 mb-2">Cultural Context</h3>
            <p className="text-gray-600 text-sm bg-indigo-50 p-3 rounded-lg">
              💡 {word.cultural_context}
            </p>
          </div>
        )}

        {/* Action Button */}
        <Button 
          onClick={onStartQuiz}
          className="w-full bg-gradient-to-r from-purple-500 to-pink-500 hover:from-purple-600 hover:to-pink-600 text-white font-semibold py-3"
        >
          Test Your Understanding
        </Button>
      </div>
    </Card>
  );
}