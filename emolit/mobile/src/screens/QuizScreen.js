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

      // Backend remains authoritative
      setCorrectCount(result.correct_answers || 0);
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
