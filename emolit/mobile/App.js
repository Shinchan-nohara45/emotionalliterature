import React from "react";
import { NavigationContainer } from "@react-navigation/native";
import { createNativeStackNavigator } from "@react-navigation/native-stack";
import { AuthProvider, useAuth } from "./src/contexts/AuthContext";
import LoginScreen from "./src/screens/LoginScreen";
import RegisterScreen from "./src/screens/RegisterScreen";
import MainTabs from "./src/navigation/MainTabs";
import { StatusBar } from "expo-status-bar";
import { ActivityIndicator, View } from "react-native";

import AboutYouScreen from "./src/screens/AboutYourScreen";

const Stack = createNativeStackNavigator();

/* =====================================================
   ONBOARDING GATE
===================================================== */
function OnboardingGate() {
  const { user } = useAuth();

  if (!user) {
    return null;
  }

  // Profile not completed → About You
  if (user.profile_completed === false) {
    return (
      <Stack.Navigator screenOptions={{ headerShown: false }}>
        <Stack.Screen name="AboutYou" component={AboutYouScreen} />
      </Stack.Navigator>
    );
  }

  // Profile completed → Main app
  return (
    <Stack.Navigator screenOptions={{ headerShown: false }}>
      <Stack.Screen name="Main" component={MainTabs} />
      <Stack.Screen name="AboutYou" component={AboutYouScreen} />
    </Stack.Navigator>
  );
}

/* =====================================================
   AUTH-AWARE ROOT NAVIGATOR
===================================================== */
function AppNavigator() {
  const { isAuthenticated, loading } = useAuth();

  if (loading) {
    return (
      <View style={{ flex: 1, justifyContent: "center", alignItems: "center" }}>
        <ActivityIndicator size="large" color="#8B5CF6" />
      </View>
    );
  }

  return (
    <NavigationContainer>
      <Stack.Navigator screenOptions={{ headerShown: false }}>
        {!isAuthenticated ? (
          <>
            <Stack.Screen name="Login" component={LoginScreen} />
            <Stack.Screen name="Register" component={RegisterScreen} />
          </>
        ) : (
          <Stack.Screen name="OnboardingGate" component={OnboardingGate} />
        )}
      </Stack.Navigator>
    </NavigationContainer>
  );
}

/* =====================================================
   APP ROOT
===================================================== */
export default function App() {
  return (
    <AuthProvider>
      <StatusBar style="auto" />
      <AppNavigator />
    </AuthProvider>
  );
}
