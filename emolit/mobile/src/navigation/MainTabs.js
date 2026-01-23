import React from 'react';
import { createBottomTabNavigator } from '@react-navigation/bottom-tabs';
import { useAuth } from '../contexts/AuthContext';
import HomeScreen from '../screens/HomeScreen';
import QuizScreen from '../screens/QuizScreen';
import JournalScreen from '../screens/JournalScreen';
import ProgressScreen from '../screens/ProgressScreen';
import ProfileScreen from '../screens/ProfileScreen';
import { Ionicons } from '@expo/vector-icons';

const Tab = createBottomTabNavigator();

export default function MainTabs() {
  const { isAuthenticated } = useAuth();

  if (!isAuthenticated) {
    return null;
  }

  return (
    <Tab.Navigator
      screenOptions={{
        tabBarActiveTintColor: '#8B5CF6',
        tabBarInactiveTintColor: '#9CA3AF',
        headerShown: true,
        // tabBarStyle: {
        //   backgroundColor: '#FFFFFF',
        //   borderTopWidth: 1,
        //   borderTopColor: '#E5E7EB',
        //   paddingBottom: 5,
        //   paddingTop: 5,
        //   height: 60,
        // },
        tabBarStyle: {
            backgroundColor: '#F9FAFB', // softer background
            borderTopWidth: 0,          // remove border
            elevation: 10,              // shadow on Android
            height: 70,                 // taller bar
            paddingBottom: 10,
            paddingTop: 10,
            //android shadow
            shadowColor: '#000',
            shadowOffset: { width: 0, height: -2 },
            shadowOpacity: 0.1,
            shadowRadius: 6,
        },
        headerStyle: {
          backgroundColor: '#8B5CF6',
          //backgroundColor: '#6366F1', //blue color
        },
        headerTitleStyle: {
          color: '#fff',
          fontWeight: '600',
          fontSize: 30,
        },
      }}
    >
      <Tab.Screen
        name="Home"
        component={HomeScreen}
        options={{
          tabBarIcon: ({ color, size }) => (
            <Ionicons name="home" size={size} color={color} />
          ),
          tabBarLabel: 'Learn',
        }}
      />
      <Tab.Screen
        name="Quiz"
        component={QuizScreen}
        options={{
          tabBarIcon: ({ color, size }) => (
            <Ionicons name="book" size={size} color={color} />
          ),
          tabBarLabel: 'Quiz',
        }}
      />
      <Tab.Screen
        name="Journal"
        component={JournalScreen}
        options={{
          tabBarIcon: ({ color, size }) => (
            <Ionicons name="heart" size={size} color={color} />
          ),
          tabBarLabel: 'Journal',
        }}
      />
      <Tab.Screen
        name="Progress"
        component={ProgressScreen}
        options={{
          tabBarIcon: ({ color, size }) => (
            <Ionicons name="trending-up" size={size} color={color} />
          ),
          tabBarLabel: 'Progress',
        }}
      />
      <Tab.Screen
        name="Profile"
        component={ProfileScreen}
        options={{
          tabBarIcon: ({ color, size }) => (
            <Ionicons name="person" size={size} color={color} />
          ),
          tabBarLabel: 'Profile',
        }}
      />
    </Tab.Navigator>
  );
}

