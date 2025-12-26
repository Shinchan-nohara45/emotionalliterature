import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  ScrollView,
  StyleSheet,
  TouchableOpacity,
  ActivityIndicator,
} from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import { quizAPI } from '../services/api';

export default function QuizScreen() {
  const [questions, setQuestions] = useState([]);
  const [currentIndex, setCurrentIndex] = useState(0);
  const [selectedAnswer, setSelectedAnswer] = useState(null);
  const [answers, setAnswers] = useState([]);
  const [score, setScore] = useState(0);
  const [isComplete, setIsComplete] = useState(false);
  const [loading, setLoading] = useState(true);
  const [submitting, setSubmitting] = useState(false);

  useEffect(() => {
    loadQuiz();
  }, []);

  const loadQuiz = async () => {
    try {
      const quizQuestions = await quizAPI.getQuestions(5);
      setQuestions(quizQuestions);
    } catch (error) {
      console.error('Error loading quiz:', error);
    }
    setLoading(false);
  };

  const handleAnswer = (answerIndex) => {
    if (selectedAnswer !== null) return;
    
    setSelectedAnswer(answerIndex);
    const currentQuestion = questions[currentIndex];
    setAnswers([
      ...answers,
      {
        question_id: currentQuestion.id,
        selected_answer: answerIndex,
      },
    ]);

    setTimeout(() => {
      if (currentIndex < questions.length - 1) {
        setCurrentIndex(currentIndex + 1);
        setSelectedAnswer(null);
      } else {
        submitQuiz();
      }
    }, 1500);
  };

  const submitQuiz = async () => {
    setSubmitting(true);
    try {
      const result = await quizAPI.submitAnswers(answers);
      setScore(result.correct_answers || 0);
      setIsComplete(true);
    } catch (error) {
      console.error('Error submitting quiz:', error);
    }
    setSubmitting(false);
  };

  const restartQuiz = () => {
    setCurrentIndex(0);
    setSelectedAnswer(null);
    setAnswers([]);
    setScore(0);
    setIsComplete(false);
    loadQuiz();
  };

  if (loading) {
    return (
      <View style={styles.loadingContainer}>
        <ActivityIndicator size="large" color="#8B5CF6" />
        <Text style={styles.loadingText}>Loading quiz...</Text>
      </View>
    );
  }

  if (isComplete) {
    const percentage = Math.round((score / questions.length) * 100);
    return (
      <ScrollView style={styles.container}>
        <LinearGradient
          colors={['#F3E8FF', '#FCE7F3', '#EEF2FF']}
          style={styles.gradient}
        >
          <View style={styles.completeContainer}>
            <View style={styles.completeCard}>
              <Text style={styles.completeEmoji}>
                {percentage >= 80 ? '⭐' : percentage >= 60 ? '🎉' : '👍'}
              </Text>
              <Text style={styles.completeTitle}>
                {percentage >= 80 ? 'Excellent!' : percentage >= 60 ? 'Great Job!' : 'Good Effort!'}
              </Text>
              <Text style={styles.completeSubtitle}>You completed the quiz!</Text>
              <View style={styles.scoreContainer}>
                <Text style={styles.scoreValue}>{score}/{questions.length}</Text>
                <Text style={styles.scoreLabel}>Questions Correct</Text>
                <Text style={styles.percentage}>{percentage}%</Text>
              </View>
              <TouchableOpacity style={styles.restartButton} onPress={restartQuiz}>
                <Text style={styles.restartButtonText}>Try Another Quiz</Text>
              </TouchableOpacity>
            </View>
          </View>
        </LinearGradient>
      </ScrollView>
    );
  }

  if (questions.length === 0) {
    return (
      <View style={styles.loadingContainer}>
        <Text style={styles.loadingText}>No quiz questions available</Text>
      </View>
    );
  }

  const currentQuestion = questions[currentIndex];
  const progress = ((currentIndex + 1) / questions.length) * 100;

  return (
    <ScrollView style={styles.container}>
      <LinearGradient
        colors={['#F3E8FF', '#FCE7F3', '#EEF2FF']}
        style={styles.gradient}
      >
        <View style={styles.content}>
          <View style={styles.header}>
            <Text style={styles.title}>Emotion Quiz</Text>
            <Text style={styles.progressText}>
              Question {currentIndex + 1}/{questions.length}
            </Text>
          </View>

          <View style={styles.progressBar}>
            <View style={[styles.progressFill, { width: `${progress}%` }]} />
          </View>

          <View style={styles.questionCard}>
            <Text style={styles.questionText}>{currentQuestion.question}</Text>
            <View style={styles.optionsContainer}>
              {currentQuestion.options.map((option, index) => {
                const isSelected = selectedAnswer === index;
                const isCorrect = false; // We don't know until submission
                
                return (
                  <TouchableOpacity
                    key={index}
                    style={[
                      styles.optionButton,
                      isSelected && styles.optionSelected,
                    ]}
                    onPress={() => handleAnswer(index)}
                    disabled={selectedAnswer !== null}
                  >
                    <Text style={[
                      styles.optionText,
                      isSelected && styles.optionTextSelected,
                    ]}>
                      {option}
                    </Text>
                  </TouchableOpacity>
                );
              })}
            </View>
          </View>
        </View>
      </LinearGradient>
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  gradient: {
    flex: 1,
  },
  loadingContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
  },
  loadingText: {
    marginTop: 16,
    color: '#6B7280',
  },
  content: {
    padding: 20,
  },
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 16,
  },
  title: {
    fontSize: 24,
    fontWeight: 'bold',
    color: '#1F2937',
  },
  progressText: {
    fontSize: 16,
    color: '#6B7280',
  },
  progressBar: {
    height: 8,
    backgroundColor: '#E5E7EB',
    borderRadius: 4,
    marginBottom: 24,
    overflow: 'hidden',
  },
  progressFill: {
    height: '100%',
    backgroundColor: '#8B5CF6',
  },
  questionCard: {
    backgroundColor: '#FFFFFF',
    borderRadius: 16,
    padding: 20,
  },
  questionText: {
    fontSize: 20,
    fontWeight: '600',
    color: '#1F2937',
    marginBottom: 24,
  },
  optionsContainer: {
    marginTop: 8,
  },
  optionButton: {
    backgroundColor: '#F9FAFB',
    borderRadius: 12,
    padding: 16,
    marginBottom: 12,
    borderWidth: 2,
    borderColor: '#E5E7EB',
  },
  optionSelected: {
    backgroundColor: '#F3E8FF',
    borderColor: '#8B5CF6',
  },
  optionText: {
    fontSize: 16,
    color: '#1F2937',
  },
  optionTextSelected: {
    color: '#8B5CF6',
    fontWeight: '600',
  },
  completeContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    padding: 20,
  },
  completeCard: {
    backgroundColor: '#FFFFFF',
    borderRadius: 20,
    padding: 32,
    alignItems: 'center',
    width: '100%',
  },
  completeEmoji: {
    fontSize: 64,
    marginBottom: 16,
  },
  completeTitle: {
    fontSize: 28,
    fontWeight: 'bold',
    color: '#1F2937',
    marginBottom: 8,
  },
  completeSubtitle: {
    fontSize: 16,
    color: '#6B7280',
    marginBottom: 32,
  },
  scoreContainer: {
    alignItems: 'center',
    marginBottom: 32,
  },
  scoreValue: {
    fontSize: 48,
    fontWeight: 'bold',
    color: '#8B5CF6',
    marginBottom: 8,
  },
  scoreLabel: {
    fontSize: 16,
    color: '#6B7280',
    marginBottom: 8,
  },
  percentage: {
    fontSize: 24,
    fontWeight: '600',
    color: '#10B981',
  },
  restartButton: {
    backgroundColor: '#8B5CF6',
    borderRadius: 12,
    padding: 16,
    width: '100%',
    alignItems: 'center',
  },
  restartButtonText: {
    color: '#FFFFFF',
    fontSize: 16,
    fontWeight: '600',
  },
});

