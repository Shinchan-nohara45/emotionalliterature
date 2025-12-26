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
import { Audio } from "expo-av";
import * as FileSystem from "expo-file-system";
import Icon from "react-native-vector-icons/Ionicons";

export default function JournalScreen() {
  const [entries, setEntries] = useState([]);
  const [isCreating, setIsCreating] = useState(false);
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

    // Analyze voice
    handleVoiceAnalysis(uri);
  }

  const handleVoiceAnalysis = async (uri) => {
    setLoading(true);
    try {
      // Prepare file for upload
      const audioFile = {
        uri: uri,
        type: "audio/m4a", // Expo high quality preset uses m4a
        name: "voice_entry.m4a",
      };

      const response = await journalAPI.analyzeVoice(
        audioFile,
        formData.target_language,
        formData.generate_audio
      );

      if (response.status === "success") {
        setFormData((prev) => ({
          ...prev,
          content: response.transcript,
        }));

        // If there's audio response, play it
        if (response.audio_response) {
          playAudioResponse(response.audio_response);
        }

        Alert.alert("Transcribed", "Voice entry transcribed successfully.");
      }
    } catch (error) {
      console.error("Error analyzing voice:", error);
      Alert.alert("Error", "Failed to analyze voice entry");
    }
    setLoading(false);
  };

  const playAudioResponse = async (base64Audio) => {
    try {
      // Create a temporary file
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
    if (!formData.content.trim()) {
      return;
    }

    setLoading(true);
    try {
      await journalAPI.createEntry({
        title: formData.title || "Untitled Entry",
        content: formData.content,
        is_private: true,
      });
      setIsCreating(false);
      setFormData({ title: "", content: "" });
      loadJournalData();
    } catch (error) {
      console.error("Error saving journal entry:", error);
    }
    setLoading(false);
  };

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
              <TouchableOpacity
                style={styles.createButton}
                onPress={() => setIsCreating(true)}
              >
                <LinearGradient
                  colors={["#EC4899", "#EF4444"]}
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
                        {format(new Date(entry.created_at), "MMM d, yyyy")}
                      </Text>
                      <Text style={styles.entryTitle}>
                        {entry.title || "Untitled Entry"}
                      </Text>
                      <Text style={styles.entryContent} numberOfLines={3}>
                        {entry.content}
                      </Text>
                      {entry.mood_score && (
                        <View style={styles.moodBadge}>
                          <Text style={styles.moodText}>
                            Mood: {entry.mood_score}/10
                          </Text>
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
                onChangeText={(text) =>
                  setFormData({ ...formData, title: text })
                }
                placeholderTextColor="#9CA3AF"
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
                placeholderTextColor="#9CA3AF"
              />

              <View style={styles.optionsContainer}>
                <View style={styles.optionRow}>
                  <Text style={styles.optionLabel}>
                    Translate Response (e.g., es, fr):
                  </Text>
                  <TextInput
                    style={styles.langInput}
                    placeholder="en"
                    value={formData.target_language}
                    onChangeText={(text) =>
                      setFormData({ ...formData, target_language: text })
                    }
                    autoCapitalize="none"
                  />
                </View>

                <View style={styles.optionRow}>
                  <Text style={styles.optionLabel}>Speak Response:</Text>
                  <Switch
                    value={formData.generate_audio}
                    onValueChange={(val) =>
                      setFormData({ ...formData, generate_audio: val })
                    }
                  />
                </View>
              </View>

              <View style={styles.micContainer}>
                <TouchableOpacity
                  style={[
                    styles.micButton,
                    isRecording && styles.micButtonRecording,
                  ]}
                  onPress={isRecording ? stopRecording : startRecording}
                >
                  <Icon
                    name={isRecording ? "stop" : "mic"}
                    size={24}
                    color="#FFF"
                  />
                  <Text style={styles.micText}>
                    {isRecording ? "Stop Recording" : "Record Voice Entry"}
                  </Text>
                </TouchableOpacity>
              </View>

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
    fontSize: 14,
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
    marginTop: 16,
  },
  entryCard: {
    backgroundColor: "#FFFFFF",
    borderRadius: 12,
    padding: 16,
    marginBottom: 16,
  },
  entryDate: {
    fontSize: 12,
    color: "#9CA3AF",
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
    marginBottom: 12,
  },
  moodBadge: {
    alignSelf: "flex-start",
    backgroundColor: "#FCE7F3",
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 8,
  },
  moodText: {
    color: "#EC4899",
    fontSize: 12,
    fontWeight: "600",
  },
  emptyContainer: {
    alignItems: "center",
    paddingVertical: 40,
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
  },
  formContainer: {
    backgroundColor: "#FFFFFF",
    borderRadius: 16,
    padding: 20,
  },
  formTitle: {
    fontSize: 20,
    fontWeight: "600",
    color: "#1F2937",
    marginBottom: 16,
  },
  input: {
    backgroundColor: "#F9FAFB",
    borderRadius: 12,
    padding: 16,
    fontSize: 16,
    borderWidth: 1,
    borderColor: "#E5E7EB",
    marginBottom: 16,
  },
  optionsContainer: {
    marginBottom: 16,
  },
  optionRow: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    marginBottom: 12,
  },
  optionLabel: {
    fontSize: 16,
    color: "#4B5563",
  },
  langInput: {
    backgroundColor: "#F9FAFB",
    borderWidth: 1,
    borderColor: "#E5E7EB",
    borderRadius: 8,
    padding: 8,
    width: 60,
    textAlign: "center",
  },
  micContainer: {
    alignItems: "center",
    marginBottom: 24,
  },
  micButton: {
    backgroundColor: "#3B82F6",
    flexDirection: "row",
    alignItems: "center",
    paddingHorizontal: 20,
    paddingVertical: 12,
    borderRadius: 24,
  },
  micButtonRecording: {
    backgroundColor: "#EF4444",
  },
  micText: {
    color: "#FFFFFF",
    fontWeight: "600",
    marginLeft: 8,
  },
  textArea: {
    height: 150,
    textAlignVertical: "top",
  },
  formButtons: {
    flexDirection: "row",
    justifyContent: "space-between",
  },
  cancelButton: {
    flex: 1,
    padding: 16,
    alignItems: "center",
    marginRight: 8,
    borderRadius: 12,
    borderWidth: 1,
    borderColor: "#E5E7EB",
  },
  cancelButtonText: {
    color: "#6B7280",
    fontSize: 16,
    fontWeight: "600",
  },
  saveButton: {
    flex: 1,
    backgroundColor: "#EC4899",
    padding: 16,
    alignItems: "center",
    marginLeft: 8,
    borderRadius: 12,
  },
  saveButtonText: {
    color: "#FFFFFF",
    fontSize: 16,
    fontWeight: "600",
  },
});
