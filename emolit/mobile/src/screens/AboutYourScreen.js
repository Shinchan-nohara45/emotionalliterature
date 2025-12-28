import React, { useState } from "react";
import {
  View,
  Text,
  TextInput,
  TouchableOpacity,
  StyleSheet,
  Alert,
} from "react-native";
import { LinearGradient } from "expo-linear-gradient";
import { profileAPI } from "../services/api";
import { useAuth } from "../contexts/AuthContext";

export default function AboutYouScreen() {
  const { checkAuth } = useAuth();

  const [form, setForm] = useState({
    age: "",
    gender: "",
    occupation: "",
    therapy_status: "",
    usage_goal: "",
    experience_level: "",
  });

  const handleSave = async () => {
    try {
      await profileAPI.updateProfile({
        ...form,
        age: form.age ? Number(form.age) : undefined,
      });

      await checkAuth(); // refresh profile_completed
    } catch (err) {
      Alert.alert("Error", err.message);
    }
  };

  return (
    <LinearGradient colors={["#EEF2FF", "#FCE7F3"]} style={styles.container}>
      <Text style={styles.title}>About You</Text>
      <Text style={styles.subtitle}>
        Help EmoLit understand you better — at your pace.
      </Text>

      {Object.keys(form).map((key) => (
        <TextInput
          key={key}
          placeholder={key.replace("_", " ")}
          style={styles.input}
          value={form[key]}
          onChangeText={(v) => setForm({ ...form, [key]: v })}
        />
      ))}

      <TouchableOpacity style={styles.button} onPress={handleSave}>
        <Text style={styles.buttonText}>Save</Text>
      </TouchableOpacity>
    </LinearGradient>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, padding: 20 },
  title: { fontSize: 28, fontWeight: "bold", marginBottom: 8 },
  subtitle: { color: "#6B7280", marginBottom: 20 },
  input: {
    backgroundColor: "#fff",
    padding: 14,
    borderRadius: 10,
    marginBottom: 12,
  },
  button: {
    backgroundColor: "#8B5CF6",
    padding: 16,
    borderRadius: 12,
    alignItems: "center",
  },
  buttonText: { color: "#fff", fontWeight: "600" },
});
