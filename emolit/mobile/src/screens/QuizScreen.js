import React, { useState, useEffect } from "react";
import {
  View,
  Text,
  ScrollView,
  StyleSheet,
  TouchableOpacity,
  ActivityIndicator,
} from "react-native";
import { LinearGradient } from "expo-linear-gradient";
import { quizAPI } from "../services/api";

export default function QuizScreen() {
  const [questions, setQuestions] = useState([]);
  const [currentIndex, setCurrentIndex] = useState(0);
  const [selectedAnswer, setSelectedAnswer] = useState(null);
  const [answers, setAnswers] = useState([]);
  const [correctCount, setCorrectCount] = useState(0);
  const [isComplete, setIsComplete] = useState(false);
  const [loading, setLoading] = useState(true);
  const [submitting, setSubmitting] = useState(false);

  useEffect(() => {
    loadQuiz();
  }, []);

  const loadQuiz = async () => {
    try {
      const quizQuestions = await quizAPI.getQuestions();
      setQuestions(quizQuestions || []);
    } catch (error) {
      console.error("Error loading quiz:", error);
    }
    setLoading(false);
  };

  const handleAnswer = (answerIndex) => {
    if (selectedAnswer !== null) return;

    const currentQuestion = questions[currentIndex];

    setSelectedAnswer(answerIndex);
    setAnswers((prev) => [
      ...prev,
      {
        question_id: currentQuestion.id,
        selected_answer: answerIndex,
      },
    ]);

    setTimeout(() => {
      if (currentIndex < questions.length - 1) {
        setCurrentIndex((i) => i + 1);
        setSelectedAnswer(null);
      }
    }, 1200);
  };

  const submitQuiz = async () => {
    setSubmitting(true);
    try {
      const result = await quizAPI.submitAnswers(answers);

      // Backend remains authoritative - correct_answers is an array
      setCorrectCount(Array.isArray(result.correct_answers) ? result.correct_answers.length : 0);
      setIsComplete(true);
    } catch (error) {
      console.error("Error submitting quiz:", error);
    }
    setSubmitting(false);
  };

  const restartQuiz = () => {
    setCurrentIndex(0);
    setSelectedAnswer(null);
    setAnswers([]);
    setCorrectCount(0);
    setIsComplete(false);
    loadQuiz();
  };

  if (loading) {
    return (
      <View style={styles.loadingContainer}>
        <ActivityIndicator size="large" color="#8B5CF6" />
        <Text style={styles.loadingText}>Preparing today’s practice…</Text>
      </View>
    );
  }

  if (isComplete) {
    return (
      <ScrollView style={styles.container}>
        <LinearGradient
          colors={["#F3E8FF", "#FCE7F3", "#EEF2FF"]}
          style={styles.gradient}
        >
          <View style={styles.completeContainer}>
            <View style={styles.completeCard}>
              <Text style={styles.completeEmoji}>🌱</Text>

              <Text style={styles.completeTitle}>
                Practice Complete
              </Text>

              <Text style={styles.completeSubtitle}>
                You explored {questions.length} emotion scenarios.
              </Text>

              <View style={styles.scoreContainer}>
                <Text style={styles.scoreValue}>
                  {correctCount}
                </Text>
                <Text style={styles.scoreLabel}>
                  Responses matched the intended emotion
                </Text>
              </View>

              <Text style={styles.reflectionText}>
                The goal here isn’t perfection — it’s familiarity.
                Each quiz helps you notice emotional nuance a little faster.
              </Text>

              <TouchableOpacity
                style={styles.restartButton}
                onPress={restartQuiz}
              >
                <Text style={styles.restartButtonText}>
                  Practice Again
                </Text>
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
        <Text style={styles.loadingText}>
          No quiz available right now
        </Text>
      </View>
    );
  }

  const currentQuestion = questions[currentIndex];
  const progress = ((currentIndex + 1) / questions.length) * 100;

  return (
    <ScrollView style={styles.container}>
      <LinearGradient
        colors={["#F3E8FF", "#FCE7F3", "#EEF2FF"]}
        style={styles.gradient}
      >
        <View style={styles.content}>
          <View style={styles.header}>
            <Text style={styles.title}>Emotion Practice</Text>
            <Text style={styles.progressText}>
              {currentIndex + 1}/{questions.length}
            </Text>
          </View>

          <View style={styles.progressBar}>
            <View style={[styles.progressFill, { width: `${progress}%` }]} />
          </View>

          <View style={styles.questionCard}>
            <Text style={styles.questionText}>
              {currentQuestion.question}
            </Text>

            <View style={styles.optionsContainer}>
              {currentQuestion.options.map((option, index) => (
                <TouchableOpacity
                  key={index}
                  style={[
                    styles.optionButton,
                    selectedAnswer === index && styles.optionSelected,
                  ]}
                  onPress={() => handleAnswer(index)}
                  disabled={selectedAnswer !== null}
                >
                  <Text
                    style={[
                      styles.optionText,
                      selectedAnswer === index && styles.optionTextSelected,
                    ]}
                  >
                    {option}
                  </Text>
                </TouchableOpacity>
              ))}
            </View>
          </View>

          {currentIndex === questions.length - 1 &&
            selectedAnswer !== null && (
              <TouchableOpacity
                style={styles.submitButton}
                onPress={submitQuiz}
                disabled={submitting}
              >
                {submitting ? (
                  <ActivityIndicator color="#fff" />
                ) : (
                  <Text style={styles.submitButtonText}>
                    Finish Practice
                  </Text>
                )}
              </TouchableOpacity>
            )}
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
    justifyContent: "center",
    alignItems: "center",
    backgroundColor: "#F3E8FF",
  },
  loadingText: {
    marginTop: 16,
    fontSize: 16,
    color: "#6B7280",
  },
  content: {
    padding: 20,
  },
  header: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    marginBottom: 16,
  },
  title: {
    fontSize: 24,
    fontWeight: "bold",
    color: "#1F2937",
  },
  progressText: {
    fontSize: 16,
    color: "#6B7280",
  },
  progressBar: {
    height: 8,
    backgroundColor: "#E5E7EB",
    borderRadius: 4,
    marginBottom: 24,
    overflow: "hidden",
  },
  progressFill: {
    height: "100%",
    backgroundColor: "#8B5CF6",
    borderRadius: 4,
  },
  questionCard: {
    backgroundColor: "#FFFFFF",
    borderRadius: 16,
    padding: 20,
    marginBottom: 24,
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 8,
    elevation: 4,
  },
  questionText: {
    fontSize: 18,
    fontWeight: "600",
    color: "#1F2937",
    marginBottom: 20,
    lineHeight: 26,
  },
  optionsContainer: {
    gap: 12,
  },
  optionButton: {
    backgroundColor: "#F9FAFB",
    borderRadius: 12,
    padding: 16,
    borderWidth: 2,
    borderColor: "#E5E7EB",
  },
  optionSelected: {
    backgroundColor: "#F3E8FF",
    borderColor: "#8B5CF6",
  },
  optionText: {
    fontSize: 16,
    color: "#374151",
  },
  optionTextSelected: {
    color: "#8B5CF6",
    fontWeight: "600",
  },
  submitButton: {
    backgroundColor: "#8B5CF6",
    borderRadius: 12,
    padding: 16,
    alignItems: "center",
    marginTop: 20,
  },
  submitButtonText: {
    color: "#FFFFFF",
    fontSize: 16,
    fontWeight: "600",
  },
  completeContainer: {
    flex: 1,
    justifyContent: "center",
    alignItems: "center",
    padding: 20,
    minHeight: 600,
  },
  completeCard: {
    backgroundColor: "#FFFFFF",
    borderRadius: 20,
    padding: 32,
    alignItems: "center",
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.1,
    shadowRadius: 12,
    elevation: 8,
    width: "100%",
    maxWidth: 400,
  },
  completeEmoji: {
    fontSize: 64,
    marginBottom: 16,
  },
  completeTitle: {
    fontSize: 28,
    fontWeight: "bold",
    color: "#1F2937",
    marginBottom: 8,
  },
  completeSubtitle: {
    fontSize: 16,
    color: "#6B7280",
    marginBottom: 24,
    textAlign: "center",
  },
  scoreContainer: {
    alignItems: "center",
    marginBottom: 24,
  },
  scoreValue: {
    fontSize: 48,
    fontWeight: "bold",
    color: "#8B5CF6",
    marginBottom: 8,
  },
  scoreLabel: {
    fontSize: 14,
    color: "#6B7280",
    textAlign: "center",
  },
  reflectionText: {
    fontSize: 14,
    color: "#4B5563",
    textAlign: "center",
    lineHeight: 20,
    marginBottom: 24,
  },
  restartButton: {
    backgroundColor: "#8B5CF6",
    borderRadius: 12,
    padding: 16,
    paddingHorizontal: 32,
    alignItems: "center",
  },
  restartButtonText: {
    color: "#FFFFFF",
    fontSize: 16,
    fontWeight: "600",
  },
});
