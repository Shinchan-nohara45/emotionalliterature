import React from "react";
import { View, ActivityIndicator } from "react-native";
import { useAuth } from "../contexts/AuthContext";

import AuthStack from "./AuthStack";
import MainTabs from "./MainTabs";
import AboutYouStack from "./AboutYouStack"; // placeholder for later

export default function OnboardingGate() {
  const { loading, isAuthenticated, profileCompleted } = useAuth();

  if (loading) {
    return (
      <View style={{ flex: 1, justifyContent: "center", alignItems: "center" }}>
        <ActivityIndicator size="large" />
      </View>
    );
  }

  if (!isAuthenticated) {
    return <AuthStack />;
  }

  if (!profileCompleted) {
    return <AboutYouStack />; // not implemented yet, safe placeholder
  }

  return <MainTabs />;
}
