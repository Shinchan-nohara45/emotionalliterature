import React, { useState, useEffect } from "react";
import {
  View,
  Text,
  ScrollView,
  StyleSheet,
  TextInput,
  TouchableOpacity,
  ActivityIndicator,
  Switch,
  Alert,
} from "react-native";
import { LinearGradient } from "expo-linear-gradient";
import { journalAPI } from "../services/api";
import { format } from "date-fns";
import { utcToZonedTime } from "date-fns-tz";
import { Audio } from "expo-av";
import * as FileSystem from "expo-file-system";
import Icon from "react-native-vector-icons/Ionicons";

import ReflectionCard from "../components/ReflectionCard";

export default function JournalScreen() {
  const [entries, setEntries] = useState([]);
  const [isCreating, setIsCreating] = useState(false);
  const [lastReflection, setLastReflection] = useState(null);
  const [viewingEntry, setViewingEntry] = useState(null);

  const [formData, setFormData] = useState({
    title: "",
    content: "",
    target_language: "",
    generate_audio: false,
  });

  const [loading, setLoading] = useState(false);
  const [recording, setRecording] = useState(null);
  const [isRecording, setIsRecording] = useState(false);
  const [sound, setSound] = useState(null);

  useEffect(() => {
    loadJournalData();
    return () => {
      if (sound) {
        sound.unloadAsync();
      }
    };
  }, []);

  const loadJournalData = async () => {
    try {
      const response = await journalAPI.getEntries(0, 10);
      setEntries(response.entries || []);
    } catch (error) {
      console.error("Error loading journal data:", error);
    }
  };

  async function startRecording() {
    try {
      const permission = await Audio.requestPermissionsAsync();
      if (permission.status === "granted") {
        await Audio.setAudioModeAsync({
          allowsRecordingIOS: true,
          playsInSilentModeIOS: true,
        });
        const { recording } = await Audio.Recording.createAsync(
          Audio.RecordingOptionsPresets.HIGH_QUALITY
        );
        setRecording(recording);
        setIsRecording(true);
      } else {
        Alert.alert("Permission to access microphone is required!");
      }
    } catch (err) {
      console.error("Failed to start recording", err);
    }
  }

  async function stopRecording() {
    setRecording(undefined);
    setIsRecording(false);
    await recording.stopAndUnloadAsync();
    const uri = recording.getURI();
    handleVoiceAnalysis(uri);
  }

  const handleVoiceAnalysis = async (uri) => {
    // Voice analysis feature - to be implemented in future version
    Alert.alert("Coming Soon", "Voice transcription feature will be available soon. Please type your journal entry for now.");
    setLoading(false);
  };

  const playAudioResponse = async (base64Audio) => {
    try {
      const fileUri = FileSystem.documentDirectory + "response.mp3";
      await FileSystem.writeAsStringAsync(fileUri, base64Audio, {
        encoding: FileSystem.EncodingType.Base64,
      });

      const { sound } = await Audio.Sound.createAsync({ uri: fileUri });
      setSound(sound);
      await sound.playAsync();
    } catch (error) {
      console.error("Error playing audio:", error);
    }
  };

  const handleSubmit = async () => {
    if (!formData.content.trim()) return;

    setLoading(true);
    try {
      const response = await journalAPI.createEntry({
        title: formData.title || "Untitled Entry",
        content: formData.content,
        is_private: true,
      });

      setLastReflection(response.reflection || null);

      setIsCreating(false);
      setFormData({ title: "", content: "" });
      loadJournalData();
    } catch (error) {
      console.error("Error saving journal entry:", error);
      Alert.alert("Error", "Failed to save journal entry");
    }
    setLoading(false);
  };

  const viewEntry = async (entryId) => {
    try {
      const entry = await journalAPI.getEntry(entryId);
      setViewingEntry(entry);
    } catch (error) {
      console.error("Error loading entry:", error);
      Alert.alert("Error", "Failed to load journal entry");
    }
  };

  if (viewingEntry) {
    return (
      <ScrollView style={styles.container}>
        <LinearGradient
          colors={["#F3E8FF", "#FCE7F3", "#EEF2FF"]}
          style={styles.gradient}
        >
          <View style={styles.content}>
            <TouchableOpacity
              style={styles.backButton}
              onPress={() => setViewingEntry(null)}
            >
              <Text style={styles.backButtonText}>← Back</Text>
            </TouchableOpacity>

            <View style={styles.viewCard}>
              <Text style={styles.viewDate}>
                {format(utcToZonedTime(new Date(viewingEntry.created_at), "Asia/Kolkata"), "MMM d, yyyy 'at' h:mm a")}
              </Text>
              <Text style={styles.viewTitle}>
                {viewingEntry.title || "Untitled Entry"}
              </Text>
              <Text style={styles.viewContent}>{viewingEntry.content}</Text>

              {viewingEntry.mood_score && (
                <View style={styles.moodBadge}>
                  <Text style={styles.moodText}>
                    Mood: {viewingEntry.mood_score}/10
                  </Text>
                </View>
              )}

              {viewingEntry.ai_response && (
                <View style={styles.aiResponseCard}>
                  <Text style={styles.aiResponseTitle}>AI Reflection</Text>
                  <Text style={styles.aiResponseText}>
                    {viewingEntry.ai_response.text || "No reflection available"}
                  </Text>
                  {viewingEntry.ai_response.suggestions &&
                    viewingEntry.ai_response.suggestions.length > 0 && (
                      <View style={styles.suggestionsContainer}>
                        <Text style={styles.suggestionsTitle}>Suggestions:</Text>
                        {viewingEntry.ai_response.suggestions.map((suggestion, idx) => (
                          <Text key={idx} style={styles.suggestionItem}>
                            • {suggestion}
                          </Text>
                        ))}
                      </View>
                    )}
                </View>
              )}
            </View>
          </View>
        </LinearGradient>
      </ScrollView>
    );
  }

  return (
    <ScrollView style={styles.container}>
      <LinearGradient
        colors={["#F3E8FF", "#FCE7F3", "#EEF2FF"]}
        style={styles.gradient}
      >
        <View style={styles.content}>
          <View style={styles.header}>
            <Text style={styles.title}>Emotion Journal</Text>
            <Text style={styles.subtitle}>
              Track your emotional experiences
            </Text>
          </View>

          {!isCreating ? (
            <>
              <View style={styles.buttonRow}>
                <TouchableOpacity
                  style={[styles.createButton, styles.writeButton]}
                  onPress={() => {
                    setLastReflection(null);
                    setIsCreating(true);
                  }}
                >
                  <LinearGradient
                    colors={["#EC4899", "#EF4444"]}
                    style={styles.createButtonGradient}
                  >
                    <Text style={styles.createButtonText}>✍️ Write Entry</Text>
                  </LinearGradient>
                </TouchableOpacity>

                <TouchableOpacity
                  style={[styles.createButton, styles.voiceButton]}
                  onPress={startRecording}
                  disabled={isRecording}
                >
                  <LinearGradient
                    colors={["#8B5CF6", "#6366F1"]}
                    style={styles.createButtonGradient}
                  >
                    <Text style={styles.createButtonText}>
                      {isRecording ? "🎤 Recording..." : "🎤 Voice Entry"}
                    </Text>
                  </LinearGradient>
                </TouchableOpacity>
              </View>

              {entries.length > 0 ? (
                <View style={styles.entriesContainer}>
                  {entries.map((entry) => (
                    <TouchableOpacity
                      key={entry.id}
                      style={styles.entryCard}
                      onPress={() => viewEntry(entry.id)}
                      activeOpacity={0.7}
                    >
                      <Text style={styles.entryDate}>
                        {format(utcToZonedTime(new Date(entry.created_at), "Asia/Kolkata"), "MMM d, yyyy")}
                      </Text>
                      <Text style={styles.entryTitle}>
                        {entry.title || "Untitled Entry"}
                      </Text>
                      <Text style={styles.entryContent} numberOfLines={3}>
                        {entry.content}
                      </Text>
                    </TouchableOpacity>
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

              {lastReflection && (
                <ReflectionCard reflection={lastReflection} />
              )}
            </>
          ) : (
            <View style={styles.formContainer}>
              <Text style={styles.formTitle}>Create Entry</Text>

              <TextInput
                style={styles.input}
                placeholder="Title (optional)"
                value={formData.title}
                onChangeText={(text) =>
                  setFormData({ ...formData, title: text })
                }
              />

              <TextInput
                style={[styles.input, styles.textArea]}
                placeholder="How are you feeling today?"
                value={formData.content}
                onChangeText={(text) =>
                  setFormData({ ...formData, content: text })
                }
                multiline
                numberOfLines={8}
              />

              <View style={styles.formButtons}>
                <TouchableOpacity
                  style={styles.cancelButton}
                  onPress={() => {
                    setIsCreating(false);
                    setFormData({ title: "", content: "" });
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
    fontWeight: "bold",
    color: "#1F2937",
    marginBottom: 8,
  },
  subtitle: {
    fontSize: 16,
    color: "#6B7280",
  },
  createButton: {
    borderRadius: 12,
    overflow: "hidden",
    marginBottom: 24,
  },
  createButtonGradient: {
    padding: 16,
    alignItems: "center",
  },
  createButtonText: {
    color: "#FFFFFF",
    fontSize: 16,
    fontWeight: "600",
  },
  entriesContainer: {
    gap: 16,
  },
  entryCard: {
    backgroundColor: "#FFFFFF",
    borderRadius: 12,
    padding: 16,
    marginBottom: 12,
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 3,
  },
  entryDate: {
    fontSize: 12,
    color: "#6B7280",
    marginBottom: 8,
  },
  entryTitle: {
    fontSize: 18,
    fontWeight: "600",
    color: "#1F2937",
    marginBottom: 8,
  },
  entryContent: {
    fontSize: 14,
    color: "#4B5563",
    lineHeight: 20,
  },
  emptyContainer: {
    alignItems: "center",
    padding: 40,
  },
  emptyText: {
    fontSize: 18,
    fontWeight: "600",
    color: "#6B7280",
    marginBottom: 8,
  },
  emptySubtext: {
    fontSize: 14,
    color: "#9CA3AF",
    textAlign: "center",
  },
  formContainer: {
    backgroundColor: "#FFFFFF",
    borderRadius: 16,
    padding: 20,
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 8,
    elevation: 4,
  },
  formTitle: {
    fontSize: 20,
    fontWeight: "bold",
    color: "#1F2937",
    marginBottom: 20,
  },
  input: {
    backgroundColor: "#F9FAFB",
    borderRadius: 10,
    padding: 14,
    fontSize: 16,
    color: "#1F2937",
    borderWidth: 1,
    borderColor: "#E5E7EB",
    marginBottom: 16,
  },
  textArea: {
    height: 150,
    textAlignVertical: "top",
  },
  formButtons: {
    flexDirection: "row",
    justifyContent: "space-between",
    gap: 12,
  },
  cancelButton: {
    flex: 1,
    backgroundColor: "#F3F4F6",
    borderRadius: 10,
    padding: 16,
    alignItems: "center",
  },
  cancelButtonText: {
    color: "#374151",
    fontSize: 16,
    fontWeight: "600",
  },
  saveButton: {
    flex: 1,
    backgroundColor: "#8B5CF6",
    borderRadius: 10,
    padding: 16,
    alignItems: "center",
  },
  saveButtonText: {
    color: "#FFFFFF",
    fontSize: 16,
    fontWeight: "600",
  },
  buttonRow: {
    flexDirection: "row",
    gap: 12,
    marginBottom: 24,
  },
  writeButton: {
    flex: 1,
  },
  voiceButton: {
    flex: 1,
  },
  backButton: {
    marginBottom: 16,
    padding: 8,
  },
  backButtonText: {
    fontSize: 16,
    color: "#8B5CF6",
    fontWeight: "600",
  },
  viewCard: {
    backgroundColor: "#FFFFFF",
    borderRadius: 16,
    padding: 20,
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 8,
    elevation: 4,
  },
  viewDate: {
    fontSize: 12,
    color: "#6B7280",
    marginBottom: 12,
  },
  viewTitle: {
    fontSize: 24,
    fontWeight: "bold",
    color: "#1F2937",
    marginBottom: 16,
  },
  viewContent: {
    fontSize: 16,
    color: "#4B5563",
    lineHeight: 24,
    marginBottom: 20,
  },
  moodBadge: {
    backgroundColor: "#F3E8FF",
    borderRadius: 8,
    padding: 12,
    marginBottom: 20,
    alignSelf: "flex-start",
  },
  moodText: {
    color: "#8B5CF6",
    fontSize: 14,
    fontWeight: "600",
  },
  aiResponseCard: {
    backgroundColor: "#F9FAFB",
    borderRadius: 12,
    padding: 16,
    borderLeftWidth: 4,
    borderLeftColor: "#8B5CF6",
  },
  aiResponseTitle: {
    fontSize: 18,
    fontWeight: "600",
    color: "#1F2937",
    marginBottom: 12,
  },
  aiResponseText: {
    fontSize: 15,
    color: "#4B5563",
    lineHeight: 22,
    marginBottom: 12,
  },
  suggestionsContainer: {
    marginTop: 12,
  },
  suggestionsTitle: {
    fontSize: 14,
    fontWeight: "600",
    color: "#374151",
    marginBottom: 8,
  },
  suggestionItem: {
    fontSize: 14,
    color: "#6B7280",
    lineHeight: 20,
    marginBottom: 4,
  },
});
