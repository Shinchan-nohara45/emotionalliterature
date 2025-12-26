import React from "react";
import { Card } from "../ui/card";
import { Progress } from "../ui/progress";
import { Flame, Target, Trophy, Zap } from "lucide-react";

export default function DailyProgress({ userProgress }) {
  const todayGoalProgress = 50; // Placeholder - can be calculated based on daily activities

  return (
    <div className="grid grid-cols-2 gap-4">
      {/* Streak */}
      <Card className="p-4 bg-gradient-to-br from-orange-50 to-red-50 border-orange-200">
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 bg-orange-100 rounded-full flex items-center justify-center">
            <Flame className="w-5 h-5 text-orange-500" />
          </div>
          <div>
            <p className="text-2xl font-bold text-orange-700">
              {userProgress?.current_streak || 0}
            </p>
            <p className="text-xs text-orange-600">Day Streak</p>
          </div>
        </div>
      </Card>

      {/* Level */}
      <Card className="p-4 bg-gradient-to-br from-purple-50 to-indigo-50 border-purple-200">
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 bg-purple-100 rounded-full flex items-center justify-center">
            <Trophy className="w-5 h-5 text-purple-500" />
          </div>
          <div>
            <p className="text-2xl font-bold text-purple-700">
              {userProgress?.current_level || 1}
            </p>
            <p className="text-xs text-purple-600">Level</p>
          </div>
        </div>
      </Card>

      {/* Daily Goal */}
      <Card className="p-4 col-span-2 bg-gradient-to-br from-green-50 to-teal-50 border-green-200">
        <div className="flex items-center gap-3 mb-3">
          <div className="w-8 h-8 bg-green-100 rounded-full flex items-center justify-center">
            <Target className="w-4 h-4 text-green-500" />
          </div>
          <div>
            <p className="font-semibold text-green-700">Today's Goal</p>
            <p className="text-xs text-green-600">
              {Math.floor(todayGoalProgress)}% complete
            </p>
          </div>
        </div>
        <Progress value={todayGoalProgress} className="h-2 bg-green-200" />
      </Card>

      {/* XP */}
      <Card className="p-4 col-span-2 bg-gradient-to-br from-yellow-50 to-orange-50 border-yellow-200">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="w-8 h-8 bg-yellow-100 rounded-full flex items-center justify-center">
              <Zap className="w-4 h-4 text-yellow-500" />
            </div>
            <div>
              <p className="font-semibold text-yellow-700">Experience Points</p>
              <p className="text-2xl font-bold text-yellow-800">
                {userProgress?.total_xp || 0} XP
              </p>
            </div>
          </div>
          <div className="text-right">
            <p className="text-xs text-yellow-600">Words Learned</p>
            <p className="text-lg font-bold text-yellow-700">
              {userProgress?.words_learned || 0}
            </p>
          </div>
        </div>
      </Card>
    </div>
  );
}