// ONLY the changed lines are shown in context — this is a full file replacement

import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  ScrollView,
  StyleSheet,
  ActivityIndicator,
} from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import { progressAPI, journalAPI } from '../services/api';
import { format } from 'date-fns';

export default function ProgressScreen() {
  const [userProgress, setUserProgress] = useState(null);
  const [recentEntries, setRecentEntries] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    loadProgressData();
  }, []);

  const loadProgressData = async () => {
    try {
      const progress = await progressAPI.getProgress();
      setUserProgress(progress);

      const entriesResponse = await journalAPI.getEntries(0, 5);
      setRecentEntries(entriesResponse.entries || []);
    } catch (error) {
      console.error('Error loading progress data:', error);
    }
    setLoading(false);
  };

  if (loading) {
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
          <View style={styles.header}>
            <Text style={styles.title}>Your Progress</Text>
            <Text style={styles.subtitle}>
              Track your emotional learning journey
            </Text>
          </View>

          <View style={styles.statsGrid}>
            <View style={styles.statCard}>
              <Text style={styles.statEmoji}>🏆</Text>
              <Text style={styles.statValue}>{userProgress.level}</Text>
              <Text style={styles.statLabel}>Level</Text>
            </View>
            <View style={styles.statCard}>
              <Text style={styles.statEmoji}>🔥</Text>
              <Text style={styles.statValue}>{userProgress.current_streak}</Text>
              <Text style={styles.statLabel}>Streak</Text>
            </View>
            <View style={styles.statCard}>
              <Text style={styles.statEmoji}>📚</Text>
              <Text style={styles.statValue}>{userProgress.words_learned}</Text>
              <Text style={styles.statLabel}>Words</Text>
            </View>
            <View style={styles.statCard}>
              <Text style={styles.statEmoji}>⭐</Text>
              <Text style={styles.statValue}>{userProgress.total_xp}</Text>
              <Text style={styles.statLabel}>XP</Text>
            </View>
          </View>

          <View style={styles.progressCard}>
            <View style={styles.progressHeader}>
              <Text style={styles.progressTitle}>
                Level {userProgress.level} Progress
              </Text>
              <Text style={styles.progressSubtitle}>
                {userProgress.progress_percent}% to next level
              </Text>
            </View>
            <View style={styles.progressBar}>
              <View
                style={[
                  styles.progressFill,
                  { width: `${userProgress.progress_percent}%` },
                ]}
              />
            </View>
          </View>

          {recentEntries.length > 0 && (
            <View style={styles.recentCard}>
              <Text style={styles.recentTitle}>Recent Journal Entries</Text>
              {recentEntries.map((entry) => (
                <View key={entry.id} style={styles.recentEntry}>
                  <Text style={styles.recentDate}>
                    {format(new Date(entry.created_at), 'MMM d, yyyy')}
                  </Text>
                  <Text style={styles.recentText}>
                    {entry.title || 'Untitled Entry'}
                  </Text>
                  {entry.mood_score && (
                    <Text style={styles.recentMood}>
                      Mood: {entry.mood_score}/10
                    </Text>
                  )}
                </View>
              ))}
            </View>
          )}
        </View>
      </LinearGradient>
    </ScrollView>
  );
}
