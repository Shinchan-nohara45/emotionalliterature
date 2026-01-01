import React from "react";
import {
  View,
  Text,
  ScrollView,
  StyleSheet,
  TouchableOpacity,
  Alert,
} from "react-native";
import { LinearGradient } from "expo-linear-gradient";
import { useAuth } from "../contexts/AuthContext";
import { useNavigation } from "@react-navigation/native";
import { format } from "date-fns";

export default function ProfileScreen() {
  const { user, logout } = useAuth();
  const navigation = useNavigation();

  if (!user) {
    return (
      <View style={styles.loadingContainer}>
        <Text>Loading profile…</Text>
      </View>
    );
  }

  const profile = user.profile || {};
  const profileCompleted = user.profile_completed;

  const handleLogout = () => {
    Alert.alert("Logout", "Are you sure?", [
      { text: "Cancel", style: "cancel" },
      {
        text: "Logout",
        style: "destructive",
        onPress: logout,
      },
    ]);
  };

  return (
    <ScrollView style={styles.container}>
      <LinearGradient
        colors={["#F3E8FF", "#FCE7F3", "#EEF2FF"]}
        style={styles.gradient}
      >
        <View style={styles.content}>

          {/* Header */}
          <View style={styles.header}>
            <View style={styles.avatar}>
              <Text style={styles.avatarText}>
                {user.full_name?.[0]?.toUpperCase() || "U"}
              </Text>
            </View>
            <Text style={styles.title}>{user.full_name || "Your Profile"}</Text>
            <Text style={styles.subtitle}>
              {profileCompleted
                ? "Your emotional companion knows you better"
                : "Complete your profile for better guidance"}
            </Text>
          </View>

          {/* Profile completion banner */}
          {!profileCompleted && (
            <View style={styles.warningCard}>
              <Text style={styles.warningText}>
                Your profile isn’t complete yet.  
                Filling it helps EmoLit respond more accurately and gently.
              </Text>
              <TouchableOpacity
                style={styles.primaryButton}
                onPress={() => navigation.navigate("AboutYou")}
              >
                <Text style={styles.primaryButtonText}>Complete Profile</Text>
              </TouchableOpacity>
            </View>
          )}

          {/* Account info */}
          <View style={styles.card}>
            <Text style={styles.cardTitle}>Account</Text>

            <InfoRow label="Email" value={user.email} />
            <InfoRow
              label="Member since"
              value={format(new Date(user.created_at), "MMMM d, yyyy")}
            />
            <InfoRow
              label="Subscription"
              value={user.subscription_type}
            />
          </View>

          {/* About You */}
          <View style={styles.card}>
            <Text style={styles.cardTitle}>About You</Text>

            <InfoRow label="Age" value={profile.age ?? "—"} />
            <InfoRow label="Gender" value={profile.gender ?? "—"} />
            <InfoRow label="Occupation" value={profile.occupation ?? "—"} />
            <InfoRow label="Goal" value={profile.usage_goal ?? "—"} />
            <InfoRow label="Experience" value={profile.experience_level ?? "—"} />

            <TouchableOpacity
              style={styles.secondaryButton}
              onPress={() => navigation.navigate("AboutYou")}
            >
              <Text style={styles.secondaryButtonText}>Edit</Text>
            </TouchableOpacity>
          </View>

          {/* Logout */}
          <TouchableOpacity style={styles.logoutButton} onPress={handleLogout}>
            <Text style={styles.logoutText}>Log Out</Text>
          </TouchableOpacity>

        </View>
      </LinearGradient>
    </ScrollView>
  );
}

const InfoRow = ({ label, value }) => (
  <View style={styles.infoRow}>
    <Text style={styles.infoLabel}>{label}</Text>
    <Text style={styles.infoValue}>{String(value)}</Text>
  </View>
);

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
  loadingContainer: {
    flex: 1,
    justifyContent: "center",
    alignItems: "center",
    backgroundColor: "#F3E8FF",
  },
  header: {
    alignItems: "center",
    marginBottom: 32,
  },
  avatar: {
    width: 80,
    height: 80,
    borderRadius: 40,
    backgroundColor: "#8B5CF6",
    justifyContent: "center",
    alignItems: "center",
    marginBottom: 16,
  },
  avatarText: {
    fontSize: 32,
    fontWeight: "bold",
    color: "#FFFFFF",
  },
  title: {
    fontSize: 24,
    fontWeight: "bold",
    color: "#1F2937",
    marginBottom: 8,
  },
  subtitle: {
    fontSize: 14,
    color: "#6B7280",
    textAlign: "center",
  },
  warningCard: {
    backgroundColor: "#FEF3C7",
    borderRadius: 12,
    padding: 16,
    marginBottom: 24,
    borderWidth: 1,
    borderColor: "#FCD34D",
  },
  warningText: {
    fontSize: 14,
    color: "#92400E",
    marginBottom: 12,
    lineHeight: 20,
  },
  primaryButton: {
    backgroundColor: "#8B5CF6",
    borderRadius: 10,
    padding: 12,
    alignItems: "center",
  },
  primaryButtonText: {
    color: "#FFFFFF",
    fontSize: 14,
    fontWeight: "600",
  },
  card: {
    backgroundColor: "#FFFFFF",
    borderRadius: 12,
    padding: 20,
    marginBottom: 16,
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 3,
  },
  cardTitle: {
    fontSize: 18,
    fontWeight: "600",
    color: "#1F2937",
    marginBottom: 16,
  },
  infoRow: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    paddingVertical: 12,
    borderBottomWidth: 1,
    borderBottomColor: "#F3F4F6",
  },
  infoLabel: {
    fontSize: 14,
    color: "#6B7280",
  },
  infoValue: {
    fontSize: 14,
    color: "#1F2937",
    fontWeight: "500",
  },
  secondaryButton: {
    backgroundColor: "#F3F4F6",
    borderRadius: 10,
    padding: 12,
    alignItems: "center",
    marginTop: 12,
  },
  secondaryButtonText: {
    color: "#374151",
    fontSize: 14,
    fontWeight: "600",
  },
  logoutButton: {
    backgroundColor: "#FFFFFF",
    borderRadius: 12,
    padding: 16,
    alignItems: "center",
    marginTop: 24,
    borderWidth: 1,
    borderColor: "#EF4444",
  },
  logoutText: {
    color: "#EF4444",
    fontSize: 16,
    fontWeight: "600",
  },
});
