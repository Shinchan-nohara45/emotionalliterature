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
