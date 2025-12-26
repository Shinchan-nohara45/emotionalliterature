import React from "react";
import { BrowserRouter as Router, Routes, Route } from "react-router-dom";
import { AuthProvider } from "./contexts/AuthContext";
import ProtectedRoute from "./components/ProtectedRoute";
import Layout from "./Layout/Layout";
import Home from "./pages/Home";
import Quiz from "./pages/Quiz";
import Journal from "./pages/Journal";
import Progress from "./pages/Progress";
import Profile from "./pages/Profile";
import Login from "./pages/Login";
import Register from "./pages/Register";

export default function App() {
  return (
    <AuthProvider>
    <Router>
      <Routes>
          {/* Public routes */}
          <Route path="/login" element={<Login />} />
          <Route path="/register" element={<Register />} />
          
          {/* Protected routes */}
        <Route
          path="/"
          element={
              <ProtectedRoute>
            <Layout currentPageName="Home">
              <Home />
            </Layout>
              </ProtectedRoute>
          }
        />
        <Route
          path="/quiz"
          element={
              <ProtectedRoute>
            <Layout currentPageName="Quiz">
              <Quiz />
            </Layout>
              </ProtectedRoute>
          }
        />
        <Route
          path="/journal"
          element={
              <ProtectedRoute>
            <Layout currentPageName="Journal">
              <Journal />
            </Layout>
              </ProtectedRoute>
          }
        />
        <Route
          path="/progress"
          element={
              <ProtectedRoute>
            <Layout currentPageName="Progress">
              <Progress />
            </Layout>
              </ProtectedRoute>
            }
          />
          <Route
            path="/profile"
            element={
              <ProtectedRoute>
                <Layout currentPageName="Profile">
                  <Profile />
                </Layout>
              </ProtectedRoute>
          }
        />
      </Routes>
    </Router>
    </AuthProvider>
  );
}