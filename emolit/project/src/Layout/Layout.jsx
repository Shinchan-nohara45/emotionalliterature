import React from "react";
import { Link, useLocation, useNavigate } from "react-router-dom";
import { createPageUrl } from "@/utils";
import { Home, BookOpen, Heart, TrendingUp, Sparkles, User, LogOut } from "lucide-react";
import { useAuth } from "../contexts/AuthContext";
import AvatarGuide from "../components/shared/AvatarGuide";

export default function Layout({ children, currentPageName }) {
  const location = useLocation();
  const navigate = useNavigate();
  const { user, logout } = useAuth();

  const navigationItems = [
  {
    name: "Home",
    path: createPageUrl("Home"),
    icon: Home,
    label: "Learn"
  },
  {
    name: "Quiz",
    path: createPageUrl("Quiz"),
    icon: BookOpen,
    label: "Quiz"
  },
  {
    name: "Journal",
    path: createPageUrl("Journal"),
    icon: Heart,
    label: "Journal"
  },
  {
    name: "Progress",
    path: createPageUrl("Progress"),
    icon: TrendingUp,
    label: "Progress"
  }];


  return (
    <div className="min-h-screen bg-gradient-to-br from-purple-50 via-pink-50 to-indigo-50">
      <style>
        {`
          :root {
            --primary-purple: #8B5CF6;
            --primary-pink: #EC4899;
            --primary-indigo: #6366F1;
            --soft-purple: #F3E8FF;
            --soft-pink: #FCE7F3;
            --soft-indigo: #EEF2FF;
          }
        `}
      </style>
      
      {/* Header */}
      <div className="relative overflow-hidden bg-white/80 backdrop-blur-md border-b border-purple-100">
        <div className="absolute inset-0 bg-gradient-to-r from-purple-100/20 via-pink-100/20 to-indigo-100/20" />
        <div className="relative px-6 py-4">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 bg-gradient-to-br from-purple-500 to-pink-500 rounded-full flex items-center justify-center">
                <Sparkles className="w-6 h-6 text-white" />
              </div>
              <div>
                <h1 className="text-2xl font-bold bg-gradient-to-r from-purple-600 to-pink-600 bg-clip-text text-transparent">
                  EmoLit
                </h1>
                <p className="text-sm text-gray-600">Expand your emotional vocabulary</p>
              </div>
            </div>
            <div className="flex items-center gap-2">
              <Link
                to="/profile"
                className={`p-2 rounded-lg transition-all ${
                  location.pathname === "/profile"
                    ? "bg-gradient-to-r from-purple-500 to-pink-500 text-white"
                    : "text-gray-600 hover:bg-purple-50 hover:text-purple-600"
                }`}
                title="Profile"
              >
                <User className="w-5 h-5" />
              </Link>
              <button
                onClick={async () => {
                  await logout();
                  navigate("/login");
                }}
                className="p-2 rounded-lg text-gray-600 hover:bg-red-50 hover:text-red-600 transition-all"
                title="Logout"
              >
                <LogOut className="w-5 h-5" />
              </button>
            </div>
          </div>
        </div>
      </div>

      {/* Main Content */}
      <main className="pb-28">
        {children}
      </main>

      <AvatarGuide currentPageName={currentPageName} />

      {/* Bottom Navigation */}
      <div className="fixed bottom-0 left-0 right-0 bg-white/95 backdrop-blur-md border-t border-gray-200 z-50">
        <div className="grid grid-cols-4 gap-1 px-4 py-2">
          {navigationItems.map((item) => {
            const isActive = location.pathname === item.path;
            const Icon = item.icon;

            return (
              <Link
                key={item.name}
                to={item.path}
                className={`flex flex-col items-center py-2 px-1 rounded-xl transition-all duration-200 ${
                isActive ?
                "bg-gradient-to-r from-purple-500 to-pink-500 text-white shadow-lg scale-105" :
                "text-gray-600 hover:text-purple-600 hover:bg-purple-50"}`
                }>

                <Icon className="w-5 h-5 mb-1" />
                <span className="text-xs font-medium">{item.label}</span>
              </Link>);

          })}
        </div>
      </div>
    </div>);

}