import React, { useState } from "react";
import {
  View,
  Text,
  TextInput,
  TouchableOpacity,
  StyleSheet,
  Alert,
  ScrollView,
  Modal,
  FlatList,
} from "react-native";
import { LinearGradient } from "expo-linear-gradient";
import { profileAPI } from "../services/api";
import { useAuth } from "../contexts/AuthContext";
import { useNavigation } from "@react-navigation/native";

const GENDER_OPTIONS = [
  "Male",
  "Female",
  "Non-binary",
  "Prefer not to say",
];

const THERAPY_STATUS_OPTIONS = [
  "in_therapy",
  "not_in_therapy",
  "prefer_not_to_say",
];

const USAGE_GOAL_OPTIONS = [
  "self_awareness",
  "stress",
  "growth",
  "learning",
];

const EXPERIENCE_LEVEL_OPTIONS = [
  "beginner",
  "intermediate",
  "advanced",
];

export default function AboutYouScreen() {
  const { checkAuth } = useAuth();
  const navigation = useNavigation();

  const [form, setForm] = useState({
    age: "",
    gender: "",
    occupation: "",
    therapy_status: "",
    usage_goal: "",
    experience_level: "",
  });

  const [dropdownVisible, setDropdownVisible] = useState(false);
  const [dropdownField, setDropdownField] = useState(null);
  const [dropdownOptions, setDropdownOptions] = useState([]);

  const openDropdown = (field, options) => {
    setDropdownField(field);
    setDropdownOptions(options);
    setDropdownVisible(true);
  };

  const selectOption = (value) => {
    setForm({ ...form, [dropdownField]: value });
    setDropdownVisible(false);
    setDropdownField(null);
    setDropdownOptions([]);
  };

  const handleSave = async () => {
    try {
      await profileAPI.updateProfile({
        ...form,
        age: form.age ? Number(form.age) : undefined,
      });

      await checkAuth(); // refresh profile_completed
      Alert.alert("Success", "Profile updated successfully!");
      navigation.goBack();
    } catch (err) {
      Alert.alert("Error", err.message || "Failed to update profile");
    }
  };

  const renderDropdownButton = (field, label, options, required = false) => (
    <View key={field}>
      <Text style={styles.label}>
        {label} {required && "*"}
      </Text>
      <TouchableOpacity
        style={styles.dropdownButton}
        onPress={() => openDropdown(field, options)}
      >
        <Text style={form[field] ? styles.dropdownText : styles.dropdownPlaceholder}>
          {form[field] || `Select ${label.toLowerCase()}`}
        </Text>
        <Text style={styles.dropdownArrow}>▼</Text>
      </TouchableOpacity>
    </View>
  );

  return (
    <LinearGradient colors={["#EEF2FF", "#FCE7F3"]} style={styles.container}>
      <ScrollView contentContainerStyle={styles.scrollContent}>
        <Text style={styles.title}>About You</Text>
        <Text style={styles.subtitle}>
          Help EmoLit understand you better — at your pace.
        </Text>

        <Text style={styles.label}>Age *</Text>
        <TextInput
          placeholder="Enter your age"
          style={styles.input}
          value={form.age}
          onChangeText={(v) => setForm({ ...form, age: v })}
          keyboardType="numeric"
        />

        {renderDropdownButton("gender", "Gender", GENDER_OPTIONS, false)}

        <Text style={styles.label}>Occupation (optional)</Text>
        <TextInput
          placeholder="Enter your occupation"
          style={styles.input}
          value={form.occupation}
          onChangeText={(v) => setForm({ ...form, occupation: v })}
        />

        {renderDropdownButton("therapy_status", "Therapy Status", THERAPY_STATUS_OPTIONS, false)}

        {renderDropdownButton("usage_goal", "Usage Goal", USAGE_GOAL_OPTIONS, true)}

        {renderDropdownButton("experience_level", "Experience Level", EXPERIENCE_LEVEL_OPTIONS, true)}

        <TouchableOpacity style={styles.button} onPress={handleSave}>
          <Text style={styles.buttonText}>Save</Text>
        </TouchableOpacity>
      </ScrollView>

      {/* Dropdown Modal */}
      <Modal
        visible={dropdownVisible}
        transparent={true}
        animationType="slide"
        onRequestClose={() => setDropdownVisible(false)}
      >
        <TouchableOpacity
          style={styles.modalOverlay}
          activeOpacity={1}
          onPress={() => setDropdownVisible(false)}
        >
          <View style={styles.modalContent}>
            <View style={styles.modalHeader}>
              <Text style={styles.modalTitle}>
                Select {dropdownField?.replace("_", " ").replace(/\b\w/g, l => l.toUpperCase())}
              </Text>
              <TouchableOpacity onPress={() => setDropdownVisible(false)}>
                <Text style={styles.modalClose}>✕</Text>
              </TouchableOpacity>
            </View>
            <FlatList
              data={dropdownOptions}
              keyExtractor={(item) => item}
              renderItem={({ item }) => (
                <TouchableOpacity
                  style={styles.dropdownOption}
                  onPress={() => selectOption(item)}
                >
                  <Text style={styles.dropdownOptionText}>{item}</Text>
                  {form[dropdownField] === item && (
                    <Text style={styles.checkmark}>✓</Text>
                  )}
                </TouchableOpacity>
              )}
            />
          </View>
        </TouchableOpacity>
      </Modal>
    </LinearGradient>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1 },
  scrollContent: { padding: 20 },
  title: { fontSize: 28, fontWeight: "bold", marginBottom: 8, color: "#1F2937" },
  subtitle: { color: "#6B7280", marginBottom: 20 },
  label: {
    fontSize: 14,
    fontWeight: "600",
    color: "#374151",
    marginBottom: 8,
    marginTop: 12,
  },
  input: {
    backgroundColor: "#fff",
    padding: 14,
    borderRadius: 10,
    marginBottom: 12,
    borderWidth: 1,
    borderColor: "#E5E7EB",
  },
  dropdownButton: {
    backgroundColor: "#fff",
    padding: 14,
    borderRadius: 10,
    marginBottom: 12,
    borderWidth: 1,
    borderColor: "#E5E7EB",
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
  },
  dropdownText: {
    fontSize: 16,
    color: "#1F2937",
  },
  dropdownPlaceholder: {
    fontSize: 16,
    color: "#9CA3AF",
  },
  dropdownArrow: {
    fontSize: 12,
    color: "#6B7280",
  },
  button: {
    backgroundColor: "#8B5CF6",
    padding: 16,
    borderRadius: 12,
    alignItems: "center",
    marginTop: 20,
  },
  buttonText: { color: "#fff", fontWeight: "600", fontSize: 16 },
  modalOverlay: {
    flex: 1,
    backgroundColor: "rgba(0, 0, 0, 0.5)",
    justifyContent: "flex-end",
  },
  modalContent: {
    backgroundColor: "#fff",
    borderTopLeftRadius: 20,
    borderTopRightRadius: 20,
    maxHeight: "70%",
    paddingBottom: 20,
  },
  modalHeader: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    padding: 20,
    borderBottomWidth: 1,
    borderBottomColor: "#E5E7EB",
  },
  modalTitle: {
    fontSize: 18,
    fontWeight: "600",
    color: "#1F2937",
  },
  modalClose: {
    fontSize: 24,
    color: "#6B7280",
  },
  dropdownOption: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    padding: 16,
    borderBottomWidth: 1,
    borderBottomColor: "#F3F4F6",
  },
  dropdownOptionText: {
    fontSize: 16,
    color: "#1F2937",
  },
  checkmark: {
    fontSize: 18,
    color: "#8B5CF6",
    fontWeight: "bold",
  },
});
