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

import ReflectionCard from "../components/ReflectionCard";

export default function JournalScreen() {
  const [entries, setEntries] = useState([]);
  const [isCreating, setIsCreating] = useState(false);
  const [lastReflection, setLastReflection] = useState(null);

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
    setLoading(true);
    try {
      const audioFile = {
        uri,
        type: "audio/m4a",
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
                onPress={() => {
                  setLastReflection(null);
                  setIsCreating(true);
                }}
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
