import React, { useState } from "react";
import { View, Text, StyleSheet, TouchableOpacity } from "react-native";

export default function ReflectionCard({ reflection }) {
  const [showSuggestions, setShowSuggestions] = useState(false);

  if (!reflection?.text) return null;

  return (
    <View style={styles.card}>
      <Text style={styles.title}>Reflection</Text>

      <Text style={styles.text}>{reflection.text}</Text>

      {reflection.suggestions?.length > 0 && (
        <>
          <TouchableOpacity
            onPress={() => setShowSuggestions(!showSuggestions)}
          >
            <Text style={styles.toggle}>
              {showSuggestions ? "Hide gentle ideas" : "See gentle ideas"}
            </Text>
          </TouchableOpacity>

          {showSuggestions && (
            <View style={styles.suggestions}>
              {reflection.suggestions.map((item, index) => (
                <Text key={index} style={styles.suggestion}>
                  • {item}
                </Text>
              ))}
            </View>
          )}
        </>
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  card: {
    backgroundColor: "#EEF2FF",
    borderRadius: 14,
    padding: 16,
    marginTop: 20,
    borderWidth: 1,
    borderColor: "#C7D2FE",
  },
  title: {
    fontSize: 16,
    fontWeight: "600",
    color: "#3730A3",
    marginBottom: 8,
  },
  text: {
    fontSize: 15,
    color: "#1F2937",
    lineHeight: 22,
    marginBottom: 10,
  },
  toggle: {
    fontSize: 14,
    color: "#4F46E5",
    fontWeight: "500",
    marginTop: 6,
  },
  suggestions: {
    marginTop: 10,
  },
  suggestion: {
    fontSize: 14,
    color: "#374151",
    lineHeight: 20,
    marginBottom: 4,
  },
});
