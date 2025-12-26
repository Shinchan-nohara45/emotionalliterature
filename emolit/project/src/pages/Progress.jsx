import React, { useState, useEffect } from "react";
import { Card } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Progress } from "@/components/ui/progress";
import { 
  Trophy, 
  Flame, 
  Target, 
  BookOpen, 
  Calendar,
  TrendingUp,
  Award,
  Star
} from "lucide-react";
import { format, subDays, eachDayOfInterval } from "date-fns";
import { progressAPI, journalAPI } from "../services/api";

export default function ProgressPage() {
  const [userProgress, setUserProgress] = useState(null);
  const [recentEntries, setRecentEntries] = useState([]);
  const [weeklyData, setWeeklyData] = useState([]);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    loadProgressData();
  }, []);

  const loadProgressData = async () => {
    try {
      // Get user progress
      const progress = await progressAPI.getProgress();
      setUserProgress(progress);

      // Get recent journal entries
      const entriesResponse = await journalAPI.getEntries(0, 7);
      const entries = entriesResponse.entries || [];
      setRecentEntries(entries);

      // Generate weekly activity data
      const last7Days = eachDayOfInterval({
        start: subDays(new Date(), 6),
        end: new Date()
      });

      const weeklyActivity = last7Days.map(day => {
        const dayString = format(day, 'yyyy-MM-dd');
        const hasEntry = entries.some(entry => 
          entry.created_at?.startsWith(dayString)
        );
        return {
          date: day,
          hasActivity: hasEntry
        };
      });

      setWeeklyData(weeklyActivity);
    } catch (error) {
      console.error("Error loading progress data:", error);
    }
    setIsLoading(false);
  };

  const levelProgress = userProgress ? 
    ((userProgress.total_xp || 0) % 100) : 0;

  const nextLevelXP = Math.ceil(((userProgress?.current_level || 1) * 100));

  const badges = [
    { 
      name: "First Steps", 
      description: "Created your first journal entry", 
      earned: recentEntries.length > 0,
      icon: "🌱"
    },
    { 
      name: "Word Explorer", 
      description: "Learned 10 emotion words", 
      earned: (userProgress?.words_learned || 0) >= 10,
      icon: "📚"
    },
    { 
      name: "Streak Master", 
      description: "Maintained a 7-day streak", 
      earned: (userProgress?.current_streak || 0) >= 7,
      icon: "🔥"
    },
    { 
      name: "Emotion Expert", 
      description: "Reached level 5", 
      earned: (userProgress?.level || 1) >= 5,
      icon: "🏆"
    },
    { 
      name: "Consistent Learner", 
      description: "30 days of activity", 
      earned: false, // Would need more complex tracking
      icon: "⭐"
    }
  ];

  if (isLoading) {
    return (
      <div className="p-6 max-w-4xl mx-auto space-y-6">
        {Array(6).fill(0).map((_, i) => (
          <div key={i} className="h-32 bg-gray-200 rounded-xl animate-pulse" />
        ))}
      </div>
    );
  }

  return (
    <div className="p-6 max-w-4xl mx-auto space-y-6">
      {/* Header */}
      <div className="text-center mb-8">
        <div className="flex items-center justify-center gap-3 mb-4">
          <div className="w-12 h-12 bg-gradient-to-br from-purple-500 to-indigo-500 rounded-full flex items-center justify-center">
            <TrendingUp className="w-6 h-6 text-white" />
          </div>
          <div>
            <h1 className="text-2xl font-bold text-gray-900">Your Progress</h1>
            <p className="text-gray-600">Track your emotional learning journey</p>
          </div>
        </div>
      </div>

      {/* Main Stats Grid */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        {/* Level */}
        <Card className="p-4 bg-gradient-to-br from-purple-50 to-indigo-50 border-purple-200">
          <div className="flex items-center gap-3">
            <div className="w-12 h-12 bg-purple-100 rounded-full flex items-center justify-center">
              <Trophy className="w-6 h-6 text-purple-500" />
            </div>
            <div>
              <p className="text-2xl font-bold text-purple-700">
                {userProgress?.current_level || 1}
              </p>
              <p className="text-xs text-purple-600">Level</p>
            </div>
          </div>
        </Card>

        {/* Streak */}
        <Card className="p-4 bg-gradient-to-br from-orange-50 to-red-50 border-orange-200">
          <div className="flex items-center gap-3">
            <div className="w-12 h-12 bg-orange-100 rounded-full flex items-center justify-center">
              <Flame className="w-6 h-6 text-orange-500" />
            </div>
            <div>
              <p className="text-2xl font-bold text-orange-700">
                {userProgress?.current_streak || 0}
              </p>
              <p className="text-xs text-orange-600">Day Streak</p>
            </div>
          </div>
        </Card>

        {/* Words Learned */}
        <Card className="p-4 bg-gradient-to-br from-green-50 to-teal-50 border-green-200">
          <div className="flex items-center gap-3">
            <div className="w-12 h-12 bg-green-100 rounded-full flex items-center justify-center">
              <BookOpen className="w-6 h-6 text-green-500" />
            </div>
            <div>
              <p className="text-2xl font-bold text-green-700">
                {userProgress?.words_learned || 0}
              </p>
              <p className="text-xs text-green-600">Words Learned</p>
            </div>
          </div>
        </Card>

        {/* XP */}
        <Card className="p-4 bg-gradient-to-br from-yellow-50 to-orange-50 border-yellow-200">
          <div className="flex items-center gap-3">
            <div className="w-12 h-12 bg-yellow-100 rounded-full flex items-center justify-center">
              <Star className="w-6 h-6 text-yellow-500" />
            </div>
            <div>
              <p className="text-2xl font-bold text-yellow-700">
                {userProgress?.total_xp || 0}
              </p>
              <p className="text-xs text-yellow-600">Total XP</p>
            </div>
          </div>
        </Card>
      </div>

      {/* Level Progress */}
      <Card className="p-6 bg-gradient-to-br from-purple-50 to-indigo-50 border-purple-200">
        <div className="flex items-center justify-between mb-4">
          <div>
            <h3 className="text-lg font-semibold text-purple-900">
              Level {userProgress?.current_level || 1} Progress
            </h3>
            <p className="text-sm text-purple-600">
              {levelProgress}/100 XP to next level
            </p>
          </div>
          <div className="text-right">
            <Trophy className="w-8 h-8 text-purple-500" />
          </div>
        </div>
        <Progress 
          value={levelProgress} 
          className="h-3 bg-purple-200"
        />
      </Card>

      {/* Weekly Activity */}
      <Card className="p-6">
        <div className="flex items-center gap-2 mb-4">
          <Calendar className="w-5 h-5 text-gray-500" />
          <h3 className="text-lg font-semibold">Weekly Activity</h3>
        </div>
        <div className="flex gap-2">
          {weeklyData.map((day, index) => (
            <div key={index} className="flex-1 text-center">
              <div 
                className={`w-full h-8 rounded-lg mb-2 ${
                  day.hasActivity 
                    ? 'bg-gradient-to-r from-green-400 to-green-500' 
                    : 'bg-gray-200'
                }`}
              />
              <p className="text-xs text-gray-600">
                {format(day.date, 'EEE')}
              </p>
            </div>
          ))}
        </div>
        <p className="text-sm text-gray-600 mt-4 text-center">
          {weeklyData.filter(d => d.hasActivity).length}/7 days active this week
        </p>
      </Card>

      {/* Badges */}
      <Card className="p-6">
        <div className="flex items-center gap-2 mb-6">
          <Award className="w-5 h-5 text-gray-500" />
          <h3 className="text-lg font-semibold">Achievements</h3>
        </div>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          {badges.map((badge, index) => (
            <div 
              key={index}
              className={`p-4 rounded-xl border-2 transition-all ${
                badge.earned 
                  ? 'bg-gradient-to-br from-yellow-50 to-orange-50 border-yellow-300' 
                  : 'bg-gray-50 border-gray-200 opacity-60'
              }`}
            >
              <div className="flex items-center gap-3">
                <div className="text-2xl">{badge.icon}</div>
                <div>
                  <h4 className={`font-semibold ${
                    badge.earned ? 'text-yellow-700' : 'text-gray-600'
                  }`}>
                    {badge.name}
                  </h4>
                  <p className={`text-sm ${
                    badge.earned ? 'text-yellow-600' : 'text-gray-500'
                  }`}>
                    {badge.description}
                  </p>
                </div>
              </div>
            </div>
          ))}
        </div>
      </Card>

      {/* Recent Activity */}
      {recentEntries.length > 0 && (
        <Card className="p-6">
          <h3 className="text-lg font-semibold mb-4">Recent Journal Entries</h3>
          <div className="space-y-3">
            {recentEntries.slice(0, 5).map((entry) => (
              <div key={entry.id} className="flex items-center justify-between p-3 bg-gray-50 rounded-lg">
                <div className="flex items-center gap-3">
                  <Calendar className="w-4 h-4 text-gray-400" />
                  <div>
                    <p className="font-medium text-gray-900">{entry.title || "Journal Entry"}</p>
                    <p className="text-sm text-gray-600">
                      {format(new Date(entry.created_at), 'MMM d, yyyy')}
                    </p>
                  </div>
                </div>
                {entry.mood_score && (
                  <Badge variant="outline" className="text-purple-700 border-purple-300">
                    {entry.mood_score}/10
                  </Badge>
                )}
              </div>
            ))}
          </div>
        </Card>
      )}
    </div>
  );
}