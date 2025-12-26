
import React, { useState, useEffect } from "react";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Badge } from "@/components/ui/badge";
import { Heart, Calendar, Plus, Lightbulb, Mic, X } from "lucide-react";
import { format } from "date-fns";
import { journalAPI, emotionsAPI } from "../services/api";

import VoiceRecorder from "../components/journal/VoiceRecorder";

export default function Journal() {
  const [entries, setEntries] = useState([]);
  const [todayEntry, setTodayEntry] = useState(null);
  const [isCreating, setIsCreating] = useState(false);
  const [showVoiceRecorder, setShowVoiceRecorder] = useState(false);
  const [suggestedWords, setSuggestedWords] = useState([]);
  const [formData, setFormData] = useState({
    primary_emotion: "",
    secondary_emotions: [],
    intensity: 5,
    context: "",
    notes: ""
  });

  useEffect(() => {
    loadJournalData();
    loadSuggestedWords();
  }, []);

  const loadJournalData = async () => {
    try {
      const response = await journalAPI.getEntries(0, 10);
      setEntries(response.entries || []);
      
      // Check if there's an entry for today
      const today = new Date().toISOString().split('T')[0];
      const todayEntryExists = response.entries?.find(entry => 
        entry.created_at?.startsWith(today)
      );
      setTodayEntry(todayEntryExists || null);
    } catch (error) {
      console.error("Error loading journal data:", error);
    }
  };

  const loadSuggestedWords = async () => {
    try {
      // For now, we'll use a placeholder - you can expand this later
      setSuggestedWords([]);
    } catch (error) {
      console.error("Error loading suggested words:", error);
    }
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    
    try {
      const content = [
        formData.primary_emotion,
        formData.context,
        formData.notes,
        ...formData.secondary_emotions
      ].filter(Boolean).join('\n\n');

      const entryData = {
        title: formData.primary_emotion || "Untitled Entry",
        content: content,
        is_private: true
      };

      await journalAPI.createEntry(entryData);
      
      setIsCreating(false);
      setShowVoiceRecorder(false);
      loadJournalData();
      
      // Reset form
      setFormData({
        primary_emotion: "",
        secondary_emotions: [],
        intensity: 5,
        context: "",
        notes: ""
      });
    } catch (error) {
      console.error("Error saving journal entry:", error);
      alert("Failed to save journal entry. Please try again.");
    }
  };

  const handleVoiceAnalysisComplete = (analysisResults) => {
    // Pre-fill form with AI analysis results
    if (analysisResults.journal_entry_suggestion) {
      const suggestion = analysisResults.journal_entry_suggestion;
      setFormData({
        primary_emotion: suggestion.primary_emotion || "",
        secondary_emotions: suggestion.secondary_emotions || [],
        intensity: suggestion.intensity || 5,
        context: suggestion.context || "",
        notes: `${suggestion.notes || ""}\n\nVoice Analysis: ${analysisResults.supportive_message || ""}`
      });
    }
    
    // Also add suggested vocabulary to secondary emotions if not already present
    if (analysisResults.suggested_vocabulary) {
      const newVocab = analysisResults.suggested_vocabulary.filter(word => 
        !formData.secondary_emotions.includes(word) && word !== formData.primary_emotion
      );
      if (newVocab.length > 0) {
        setFormData(prev => ({
          ...prev,
          secondary_emotions: [...prev.secondary_emotions, ...newVocab.slice(0, 3)]
        }));
      }
    }

    setShowVoiceRecorder(false);
    setIsCreating(true);
  };

  const addSecondaryEmotion = (emotion) => {
    if (!formData.secondary_emotions.includes(emotion)) {
      setFormData({
        ...formData,
        secondary_emotions: [...formData.secondary_emotions, emotion]
      });
    }
  };

  const removeSecondaryEmotion = (emotion) => {
    setFormData({
      ...formData,
      secondary_emotions: formData.secondary_emotions.filter(e => e !== emotion)
    });
  };

  const today = format(new Date(), 'yyyy-MM-dd');

  return (
    <div className="p-6 max-w-4xl mx-auto space-y-6">
      {/* Header */}
      <div className="text-center mb-8">
        <div className="flex items-center justify-center gap-3 mb-4">
          <div className="w-12 h-12 bg-gradient-to-br from-pink-500 to-red-500 rounded-full flex items-center justify-center">
            <Heart className="w-6 h-6 text-white" />
          </div>
          <div>
            <h1 className="text-2xl font-bold text-gray-900">Emotion Journal</h1>
            <p className="text-gray-600">Track your emotional experiences</p>
          </div>
        </div>
      </div>

      {/* Voice Recorder */}
      {showVoiceRecorder && (
        <VoiceRecorder
          onAnalysisComplete={handleVoiceAnalysisComplete}
          onClose={() => setShowVoiceRecorder(false)}
        />
      )}

      {/* Today's Entry Form */}
      {!todayEntry && !isCreating && !showVoiceRecorder && (
        <Card className="p-6 bg-gradient-to-br from-pink-50 to-red-50 border-pink-200 text-center">
          <Calendar className="w-12 h-12 text-pink-500 mx-auto mb-4" />
          <h3 className="text-lg font-semibold text-gray-900 mb-2">
            How are you feeling today?
          </h3>
          <p className="text-gray-600 mb-6">
            Share your emotions through writing or speaking
          </p>
          
          <div className="flex gap-3 justify-center">
            <Button 
              onClick={() => setIsCreating(true)}
              className="bg-gradient-to-r from-pink-500 to-red-500 hover:from-pink-600 hover:to-red-600"
            >
              <Plus className="w-4 h-4 mr-2" />
              Write Entry
            </Button>
            <Button 
              onClick={() => setShowVoiceRecorder(true)}
              variant="outline"
              className="border-purple-300 text-purple-700 hover:bg-purple-50"
            >
              <Mic className="w-4 h-4 mr-2" />
              Voice Entry
            </Button>
          </div>
        </Card>
      )}

      {/* Create/Edit Entry Form */}
      {(isCreating || todayEntry) && !showVoiceRecorder && (
        <Card className="p-6">
          <form onSubmit={handleSubmit} className="space-y-6">
            <div className="flex items-center justify-between mb-4">
              <div className="flex items-center gap-2">
                <Calendar className="w-5 h-5 text-pink-500" />
                <h3 className="text-lg font-semibold">
                  {todayEntry ? 'Update' : 'Create'} Today's Entry
                </h3>
              </div>
              
              {!todayEntry && (
                <Button
                  type="button"
                  variant="outline"
                  size="sm"
                  onClick={() => setShowVoiceRecorder(true)}
                  className="border-purple-300 text-purple-700 hover:bg-purple-50"
                >
                  <Mic className="w-4 h-4 mr-2" />
                  Use Voice
                </Button>
              )}
            </div>

            {/* Primary Emotion */}
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                How are you feeling right now?
              </label>
              <Input
                placeholder="e.g., frustrated, content, overwhelmed..."
                value={formData.primary_emotion}
                onChange={(e) => setFormData({...formData, primary_emotion: e.target.value})}
                className="text-lg"
                required
              />
            </div>

            {/* Intensity Slider */}
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Intensity Level: {formData.intensity}/10
              </label>
              <input
                type="range"
                min="1"
                max="10"
                value={formData.intensity}
                onChange={(e) => setFormData({...formData, intensity: parseInt(e.target.value)})}
                className="w-full h-2 bg-pink-200 rounded-lg appearance-none cursor-pointer slider"
              />
              <div className="flex justify-between text-xs text-gray-500 mt-1">
                <span>Mild</span>
                <span>Intense</span>
              </div>
            </div>

            {/* Context */}
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                What's happening? (optional)
              </label>
              <Textarea
                placeholder="Describe the situation or what triggered these feelings..."
                value={formData.context}
                onChange={(e) => setFormData({...formData, context: e.target.value})}
                className="h-24"
              />
            </div>

            {/* Secondary Emotions */}
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Any other emotions you're experiencing?
              </label>
              <div style={{ display: 'flex', flexWrap: 'wrap', gap: '0.5rem', marginBottom: '0.75rem' }}>
                {formData.secondary_emotions.map((emotion, index) => (
                  <Badge 
                    key={index}
                    variant="secondary"
                    className="cursor-pointer bg-pink-100 text-pink-800 hover:bg-pink-200"
                    onClick={() => removeSecondaryEmotion(emotion)}
                  >
                    {emotion} ×
                  </Badge>
                ))}
              </div>
            </div>

            {/* Notes */}
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Additional thoughts (optional)
              </label>
              <Textarea
                placeholder="Any additional reflections or insights..."
                value={formData.notes}
                onChange={(e) => setFormData({...formData, notes: e.target.value})}
                className="h-24"
              />
            </div>

            <div className="flex gap-3">
              <Button 
                type="submit"
                className="flex-1 bg-gradient-to-r from-pink-500 to-red-500 hover:from-pink-600 hover:to-red-600"
              >
                {todayEntry ? 'Update Entry' : 'Save Entry'}
              </Button>
              {isCreating && (
                <Button 
                  type="button"
                  variant="outline"
                  onClick={() => setIsCreating(false)}
                >
                  Cancel
                </Button>
              )}
            </div>
          </form>
        </Card>
      )}

      {/* Suggested Words */}
      {suggestedWords.length > 0 && (isCreating || todayEntry) && !showVoiceRecorder && (
        <Card className="p-6 bg-gradient-to-br from-purple-50 to-indigo-50 border-purple-200">
          <div className="flex items-center gap-2 mb-4">
            <Lightbulb className="w-5 h-5 text-purple-500" />
            <h3 className="font-semibold text-purple-900">Emotion Vocabulary Suggestions</h3>
          </div>
          <div className="grid grid-cols-2 md:grid-cols-3 gap-2">
            {suggestedWords.map((word) => (
              <Button
                key={word.id}
                variant="outline"
                size="sm"
                onClick={() => addSecondaryEmotion(word.word)}
                className="text-left justify-start border-purple-300 hover:bg-purple-100"
              >
                {word.word}
              </Button>
            ))}
          </div>
        </Card>
      )}

      {/* Recent Entries */}
      {entries.length > 0 && !showVoiceRecorder && (
        <div>
          <h3 className="text-lg font-semibold text-gray-900 mb-4">Recent Entries</h3>
          <div className="space-y-4">
            {entries.map((entry) => (
              <Card key={entry.id} className="p-4 hover:shadow-md transition-shadow">
                <div className="flex justify-between items-start mb-3">
                  <div className="flex items-center gap-2">
                    <Calendar className="w-4 h-4 text-gray-400" />
                    <span className="font-medium text-gray-900">
                      {format(new Date(entry.created_at), 'EEEE, MMM d, yyyy')}
                    </span>
                  </div>
                  {entry.mood_score && (
                    <Badge variant="outline" className="text-pink-700 border-pink-300">
                      Mood: {entry.mood_score}/10
                    </Badge>
                  )}
                </div>
                
                <div className="mb-3">
                  <span className="text-lg font-semibold text-pink-700">
                    {entry.title || "Journal Entry"}
                  </span>
                  {entry.detected_emotions?.length > 0 && (
                    <div style={{ display: 'flex', flexWrap: 'wrap', gap: '0.25rem', marginTop: '0.5rem' }}>
                      {entry.detected_emotions.map((emotion, index) => (
                        <Badge key={index} variant="secondary" className="text-xs">
                          {emotion}
                        </Badge>
                      ))}
                    </div>
                  )}
                </div>
                
                {entry.content && (
                  <p className="text-gray-700 text-sm">{entry.content}</p>
                )}
              </Card>
            ))}
          </div>
        </div>
      )}

      {entries.length === 0 && !isCreating && !todayEntry && !showVoiceRecorder && (
        <Card className="p-8 text-center">
          <Heart className="w-16 h-16 text-gray-300 mx-auto mb-4" />
          <h3 className="text-lg font-semibold text-gray-900 mb-2">
            Start Your Emotional Journey
          </h3>
          <p className="text-gray-600">
            Begin tracking your emotions to build better self-awareness
          </p>
        </Card>
      )}
    </div>
  );
}
