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

  const levelProgress = userProgress ? (userProgress.total_xp % 100) : 0;

  return (
    <ScrollView style={styles.container}>
      <LinearGradient
        colors={['#F3E8FF', '#FCE7F3', '#EEF2FF']}
        style={styles.gradient}
      >
        <View style={styles.content}>
          <View style={styles.header}>
            <Text style={styles.title}>Your Progress</Text>
            <Text style={styles.subtitle}>Track your emotional learning journey</Text>
          </View>

          <View style={styles.statsGrid}>
            <View style={styles.statCard}>
              <Text style={styles.statEmoji}>🏆</Text>
              <Text style={styles.statValue}>{userProgress?.current_level || 1}</Text>
              <Text style={styles.statLabel}>Level</Text>
            </View>
            <View style={styles.statCard}>
              <Text style={styles.statEmoji}>🔥</Text>
              <Text style={styles.statValue}>{userProgress?.current_streak || 0}</Text>
              <Text style={styles.statLabel}>Streak</Text>
            </View>
            <View style={styles.statCard}>
              <Text style={styles.statEmoji}>📚</Text>
              <Text style={styles.statValue}>{userProgress?.words_learned || 0}</Text>
              <Text style={styles.statLabel}>Words</Text>
            </View>
            <View style={styles.statCard}>
              <Text style={styles.statEmoji}>⭐</Text>
              <Text style={styles.statValue}>{userProgress?.total_xp || 0}</Text>
              <Text style={styles.statLabel}>XP</Text>
            </View>
          </View>

          <View style={styles.progressCard}>
            <View style={styles.progressHeader}>
              <Text style={styles.progressTitle}>
                Level {userProgress?.current_level || 1} Progress
              </Text>
              <Text style={styles.progressSubtitle}>
                {levelProgress}/100 XP to next level
              </Text>
            </View>
            <View style={styles.progressBar}>
              <View style={[styles.progressFill, { width: `${levelProgress}%` }]} />
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
                    <Text style={styles.recentMood}>Mood: {entry.mood_score}/10</Text>
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
  header: {
    marginBottom: 24,
  },
  title: {
    fontSize: 28,
    fontWeight: 'bold',
    color: '#1F2937',
    marginBottom: 8,
  },
  subtitle: {
    fontSize: 14,
    color: '#6B7280',
  },
  statsGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    justifyContent: 'space-between',
    marginBottom: 24,
  },
  statCard: {
    width: '48%',
    backgroundColor: '#FFFFFF',
    borderRadius: 12,
    padding: 16,
    alignItems: 'center',
    marginBottom: 16,
  },
  statEmoji: {
    fontSize: 32,
    marginBottom: 8,
  },
  statValue: {
    fontSize: 24,
    fontWeight: 'bold',
    color: '#8B5CF6',
    marginBottom: 4,
  },
  statLabel: {
    fontSize: 12,
    color: '#6B7280',
  },
  progressCard: {
    backgroundColor: '#FFFFFF',
    borderRadius: 16,
    padding: 20,
    marginBottom: 24,
  },
  progressHeader: {
    marginBottom: 16,
  },
  progressTitle: {
    fontSize: 18,
    fontWeight: '600',
    color: '#1F2937',
    marginBottom: 4,
  },
  progressSubtitle: {
    fontSize: 14,
    color: '#6B7280',
  },
  progressBar: {
    height: 12,
    backgroundColor: '#F3E8FF',
    borderRadius: 6,
    overflow: 'hidden',
  },
  progressFill: {
    height: '100%',
    backgroundColor: '#8B5CF6',
  },
  recentCard: {
    backgroundColor: '#FFFFFF',
    borderRadius: 16,
    padding: 20,
  },
  recentTitle: {
    fontSize: 18,
    fontWeight: '600',
    color: '#1F2937',
    marginBottom: 16,
  },
  recentEntry: {
    paddingVertical: 12,
    borderBottomWidth: 1,
    borderBottomColor: '#F3F4F6',
  },
  recentDate: {
    fontSize: 12,
    color: '#9CA3AF',
    marginBottom: 4,
  },
  recentText: {
    fontSize: 16,
    fontWeight: '500',
    color: '#1F2937',
    marginBottom: 4,
  },
  recentMood: {
    fontSize: 12,
    color: '#EC4899',
  },
});

