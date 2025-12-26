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
import { emotionsAPI, progressAPI } from '../services/api';
import { useNavigation } from '@react-navigation/native';

export default function HomeScreen() {
  const [todayWord, setTodayWord] = useState(null);
  const [userProgress, setUserProgress] = useState(null);
  const [isLoading, setIsLoading] = useState(true);
  const navigation = useNavigation();

  useEffect(() => {
    loadTodayData();
  }, []);

  const loadTodayData = async () => {
    setIsLoading(true);
    try {
      const word = await emotionsAPI.getWordOfTheDay();
      setTodayWord(word);

      const progress = await progressAPI.getProgress();
      setUserProgress(progress);
    } catch (error) {
      console.error("Error loading today's data:", error);
    }
    setIsLoading(false);
  };

  if (isLoading) {
    return (
      <View style={styles.loadingContainer}>
        <ActivityIndicator size="large" color="#8B5CF6" />
      </View>
    );
  }

  return (
    <ScrollView style={styles.container}>
      <LinearGradient
        colors={['#F3E8FF', '#FCE7F3', '#EEF2FF']}
        style={styles.gradient}
      >
        <View style={styles.content}>
          <Text style={styles.welcomeText}>Ready to expand your emotional vocabulary?</Text>
          <Text style={styles.subtitle}>Discover a new emotion word every day</Text>

          {/* Progress Overview */}
          <View style={styles.progressContainer}>
            <View style={styles.progressCard}>
              <Text style={styles.progressLabel}>Level</Text>
              <Text style={styles.progressValue}>{userProgress?.current_level || 1}</Text>
            </View>
            <View style={styles.progressCard}>
              <Text style={styles.progressLabel}>Streak</Text>
              <Text style={styles.progressValue}>{userProgress?.current_streak || 0}</Text>
            </View>
            <View style={styles.progressCard}>
              <Text style={styles.progressLabel}>XP</Text>
              <Text style={styles.progressValue}>{userProgress?.total_xp || 0}</Text>
            </View>
          </View>

          {/* Word of the Day */}
          {todayWord && (
            <View style={styles.wordCard}>
              <LinearGradient
                colors={['#8B5CF6', '#EC4899']}
                style={styles.wordHeader}
              >
                <Text style={styles.wordTitle}>Word of the Day</Text>
                <Text style={styles.wordName}>{todayWord.word}</Text>
              </LinearGradient>
              <View style={styles.wordContent}>
                <Text style={styles.wordLabel}>Definition</Text>
                <Text style={styles.wordText}>{todayWord.definition}</Text>
                <Text style={styles.wordLabel}>Example</Text>
                <Text style={styles.wordExample}>"{todayWord.example}"</Text>
                {todayWord.similar_words && todayWord.similar_words.length > 0 && (
                  <>
                    <Text style={styles.wordLabel}>Similar Words</Text>
                    <View style={styles.tagsContainer}>
                      {todayWord.similar_words.map((word, index) => (
                        <View key={index} style={styles.tag}>
                          <Text style={styles.tagText}>{word}</Text>
                        </View>
                      ))}
                    </View>
                  </>
                )}
                <TouchableOpacity
                  style={styles.quizButton}
                  onPress={() => navigation.navigate('Quiz')}
                >
                  <Text style={styles.quizButtonText}>Test Your Understanding</Text>
                </TouchableOpacity>
              </View>
            </View>
          )}

          {/* Daily Tip */}
          <View style={styles.tipCard}>
            <Text style={styles.tipEmoji}>💡</Text>
            <Text style={styles.tipTitle}>Daily Tip</Text>
            <Text style={styles.tipText}>
              Try using today's emotion word in a conversation or journal entry.
              The more you use new vocabulary, the better you'll remember it!
            </Text>
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
  content: {
    padding: 20,
  },
  welcomeText: {
    fontSize: 24,
    fontWeight: 'bold',
    color: '#1F2937',
    marginBottom: 8,
    textAlign: 'center',
  },
  subtitle: {
    fontSize: 16,
    color: '#6B7280',
    textAlign: 'center',
    marginBottom: 24,
  },
  progressContainer: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginBottom: 24,
  },
  progressCard: {
    flex: 1,
    backgroundColor: '#FFFFFF',
    borderRadius: 12,
    padding: 16,
    marginHorizontal: 4,
    alignItems: 'center',
  },
  progressLabel: {
    fontSize: 12,
    color: '#6B7280',
    marginBottom: 4,
  },
  progressValue: {
    fontSize: 24,
    fontWeight: 'bold',
    color: '#8B5CF6',
  },
  wordCard: {
    backgroundColor: '#FFFFFF',
    borderRadius: 16,
    overflow: 'hidden',
    marginBottom: 24,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 8,
    elevation: 4,
  },
  wordHeader: {
    padding: 20,
  },
  wordTitle: {
    fontSize: 14,
    color: '#FFFFFF',
    opacity: 0.9,
    marginBottom: 8,
  },
  wordName: {
    fontSize: 28,
    fontWeight: 'bold',
    color: '#FFFFFF',
  },
  wordContent: {
    padding: 20,
  },
  wordLabel: {
    fontSize: 14,
    fontWeight: '600',
    color: '#374151',
    marginTop: 16,
    marginBottom: 8,
  },
  wordText: {
    fontSize: 16,
    color: '#1F2937',
    lineHeight: 24,
  },
  wordExample: {
    fontSize: 16,
    color: '#6B7280',
    fontStyle: 'italic',
    lineHeight: 24,
  },
  tagsContainer: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    marginTop: 8,
  },
  tag: {
    backgroundColor: '#F3E8FF',
    borderRadius: 8,
    paddingHorizontal: 12,
    paddingVertical: 6,
    marginRight: 8,
    marginBottom: 8,
  },
  tagText: {
    color: '#8B5CF6',
    fontSize: 14,
  },
  quizButton: {
    backgroundColor: '#8B5CF6',
    borderRadius: 12,
    padding: 16,
    alignItems: 'center',
    marginTop: 20,
  },
  quizButtonText: {
    color: '#FFFFFF',
    fontSize: 16,
    fontWeight: '600',
  },
  tipCard: {
    backgroundColor: '#EEF2FF',
    borderRadius: 12,
    padding: 20,
    borderWidth: 1,
    borderColor: '#6366F1',
  },
  tipEmoji: {
    fontSize: 32,
    marginBottom: 8,
  },
  tipTitle: {
    fontSize: 18,
    fontWeight: '600',
    color: '#6366F1',
    marginBottom: 8,
  },
  tipText: {
    fontSize: 14,
    color: '#4B5563',
    lineHeight: 20,
  },
});

