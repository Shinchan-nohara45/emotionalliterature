import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  ScrollView,
  StyleSheet,
  TextInput,
  TouchableOpacity,
  ActivityIndicator,
} from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import { journalAPI } from '../services/api';
import { format } from 'date-fns';

export default function JournalScreen() {
  const [entries, setEntries] = useState([]);
  const [isCreating, setIsCreating] = useState(false);
  const [formData, setFormData] = useState({
    title: '',
    content: '',
  });
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    loadJournalData();
  }, []);

  const loadJournalData = async () => {
    try {
      const response = await journalAPI.getEntries(0, 10);
      setEntries(response.entries || []);
    } catch (error) {
      console.error('Error loading journal data:', error);
    }
  };

  const handleSubmit = async () => {
    if (!formData.content.trim()) {
      return;
    }

    setLoading(true);
    try {
      await journalAPI.createEntry({
        title: formData.title || 'Untitled Entry',
        content: formData.content,
        is_private: true,
      });
      setIsCreating(false);
      setFormData({ title: '', content: '' });
      loadJournalData();
    } catch (error) {
      console.error('Error saving journal entry:', error);
    }
    setLoading(false);
  };

  return (
    <ScrollView style={styles.container}>
      <LinearGradient
        colors={['#F3E8FF', '#FCE7F3', '#EEF2FF']}
        style={styles.gradient}
      >
        <View style={styles.content}>
          <View style={styles.header}>
            <Text style={styles.title}>Emotion Journal</Text>
            <Text style={styles.subtitle}>Track your emotional experiences</Text>
          </View>

          {!isCreating ? (
            <>
              <TouchableOpacity
                style={styles.createButton}
                onPress={() => setIsCreating(true)}
              >
                <LinearGradient
                  colors={['#EC4899', '#EF4444']}
                  style={styles.createButtonGradient}
                >
                  <Text style={styles.createButtonText}>+ Write Entry</Text>
                </LinearGradient>
              </TouchableOpacity>

              {entries.length > 0 ? (
                <View style={styles.entriesContainer}>
                  {entries.map((entry) => (
                    <View key={entry.id} style={styles.entryCard}>
                      <Text style={styles.entryDate}>
                        {format(new Date(entry.created_at), 'MMM d, yyyy')}
                      </Text>
                      <Text style={styles.entryTitle}>
                        {entry.title || 'Untitled Entry'}
                      </Text>
                      <Text style={styles.entryContent} numberOfLines={3}>
                        {entry.content}
                      </Text>
                      {entry.mood_score && (
                        <View style={styles.moodBadge}>
                          <Text style={styles.moodText}>Mood: {entry.mood_score}/10</Text>
                        </View>
                      )}
                    </View>
                  ))}
                </View>
              ) : (
                <View style={styles.emptyContainer}>
                  <Text style={styles.emptyText}>No journal entries yet</Text>
                  <Text style={styles.emptySubtext}>
                    Start tracking your emotions today
                  </Text>
                </View>
              )}
            </>
          ) : (
            <View style={styles.formContainer}>
              <Text style={styles.formTitle}>Create Entry</Text>
              <TextInput
                style={styles.input}
                placeholder="Title (optional)"
                value={formData.title}
                onChangeText={(text) => setFormData({ ...formData, title: text })}
                placeholderTextColor="#9CA3AF"
              />
              <TextInput
                style={[styles.input, styles.textArea]}
                placeholder="How are you feeling today?"
                value={formData.content}
                onChangeText={(text) => setFormData({ ...formData, content: text })}
                multiline
                numberOfLines={8}
                placeholderTextColor="#9CA3AF"
              />
              <View style={styles.formButtons}>
                <TouchableOpacity
                  style={styles.cancelButton}
                  onPress={() => {
                    setIsCreating(false);
                    setFormData({ title: '', content: '' });
                  }}
                >
                  <Text style={styles.cancelButtonText}>Cancel</Text>
                </TouchableOpacity>
                <TouchableOpacity
                  style={styles.saveButton}
                  onPress={handleSubmit}
                  disabled={loading}
                >
                  {loading ? (
                    <ActivityIndicator color="#FFFFFF" />
                  ) : (
                    <Text style={styles.saveButtonText}>Save</Text>
                  )}
                </TouchableOpacity>
              </View>
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
  createButton: {
    borderRadius: 12,
    overflow: 'hidden',
    marginBottom: 24,
  },
  createButtonGradient: {
    padding: 16,
    alignItems: 'center',
  },
  createButtonText: {
    color: '#FFFFFF',
    fontSize: 16,
    fontWeight: '600',
  },
  entriesContainer: {
    marginTop: 16,
  },
  entryCard: {
    backgroundColor: '#FFFFFF',
    borderRadius: 12,
    padding: 16,
    marginBottom: 16,
  },
  entryDate: {
    fontSize: 12,
    color: '#9CA3AF',
    marginBottom: 8,
  },
  entryTitle: {
    fontSize: 18,
    fontWeight: '600',
    color: '#1F2937',
    marginBottom: 8,
  },
  entryContent: {
    fontSize: 14,
    color: '#4B5563',
    lineHeight: 20,
    marginBottom: 12,
  },
  moodBadge: {
    alignSelf: 'flex-start',
    backgroundColor: '#FCE7F3',
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 8,
  },
  moodText: {
    color: '#EC4899',
    fontSize: 12,
    fontWeight: '600',
  },
  emptyContainer: {
    alignItems: 'center',
    paddingVertical: 40,
  },
  emptyText: {
    fontSize: 18,
    fontWeight: '600',
    color: '#6B7280',
    marginBottom: 8,
  },
  emptySubtext: {
    fontSize: 14,
    color: '#9CA3AF',
  },
  formContainer: {
    backgroundColor: '#FFFFFF',
    borderRadius: 16,
    padding: 20,
  },
  formTitle: {
    fontSize: 20,
    fontWeight: '600',
    color: '#1F2937',
    marginBottom: 16,
  },
  input: {
    backgroundColor: '#F9FAFB',
    borderRadius: 12,
    padding: 16,
    fontSize: 16,
    borderWidth: 1,
    borderColor: '#E5E7EB',
    marginBottom: 16,
  },
  textArea: {
    height: 150,
    textAlignVertical: 'top',
  },
  formButtons: {
    flexDirection: 'row',
    justifyContent: 'space-between',
  },
  cancelButton: {
    flex: 1,
    padding: 16,
    alignItems: 'center',
    marginRight: 8,
    borderRadius: 12,
    borderWidth: 1,
    borderColor: '#E5E7EB',
  },
  cancelButtonText: {
    color: '#6B7280',
    fontSize: 16,
    fontWeight: '600',
  },
  saveButton: {
    flex: 1,
    backgroundColor: '#EC4899',
    padding: 16,
    alignItems: 'center',
    marginLeft: 8,
    borderRadius: 12,
  },
  saveButtonText: {
    color: '#FFFFFF',
    fontSize: 16,
    fontWeight: '600',
  },
});

