import React, { useState, useRef, useEffect } from "react";
import { Button } from "../ui/button";
import { Card } from "../ui/card";
import { Badge } from "../ui/badge";
import { Progress } from "../ui/progress";
import { 
  Mic, 
  MicOff, 
  Square, 
  Play, 
  Pause, 
  Trash2, 
  Upload,
  Loader2,
  Sparkles,
  Volume2
} from "lucide-react";
// import { UploadFile, InvokeLLM } from "@/integrations/Core";

export default function VoiceRecorder({ onAnalysisComplete, onClose }) {
  const [isRecording, setIsRecording] = useState(false);
  const [isPaused, setIsPaused] = useState(false);
  const [recordingTime, setRecordingTime] = useState(0);
  const [audioBlob, setAudioBlob] = useState(null);
  const [audioUrl, setAudioUrl] = useState(null);
  const [isPlaying, setIsPlaying] = useState(false);
  const [isAnalyzing, setIsAnalyzing] = useState(false);
  const [analysisResults, setAnalysisResults] = useState(null);

  const mediaRecorderRef = useRef(null);
  const audioRef = useRef(null);
  const timerRef = useRef(null);
  const chunksRef = useRef([]);

  useEffect(() => {
    return () => {
      if (timerRef.current) {
        clearInterval(timerRef.current);
      }
      if (audioUrl) {
        URL.revokeObjectURL(audioUrl);
      }
    };
  }, [audioUrl]);

  const startRecording = async () => {
    try {
      const stream = await navigator.mediaDevices.getUserMedia({ 
        audio: {
          echoCancellation: true,
          noiseSuppression: true,
          sampleRate: 44100
        } 
      });

      const mediaRecorder = new MediaRecorder(stream, {
        mimeType: 'audio/webm;codecs=opus'
      });

      mediaRecorderRef.current = mediaRecorder;
      chunksRef.current = [];

      mediaRecorder.ondataavailable = (event) => {
        if (event.data.size > 0) {
          chunksRef.current.push(event.data);
        }
      };

      mediaRecorder.onstop = () => {
        const blob = new Blob(chunksRef.current, { type: 'audio/webm' });
        setAudioBlob(blob);
        setAudioUrl(URL.createObjectURL(blob));
        
        // Stop all tracks to release microphone
        stream.getTracks().forEach(track => track.stop());
      };

      mediaRecorder.start(100);
      setIsRecording(true);
      setRecordingTime(0);

      // Start timer
      timerRef.current = setInterval(() => {
        setRecordingTime(prev => prev + 1);
      }, 1000);

    } catch (error) {
      console.error("Error starting recording:", error);
      alert("Could not access microphone. Please ensure microphone permissions are granted.");
    }
  };

  const pauseRecording = () => {
    if (mediaRecorderRef.current && isRecording) {
      mediaRecorderRef.current.pause();
      setIsPaused(true);
      clearInterval(timerRef.current);
    }
  };

  const resumeRecording = () => {
    if (mediaRecorderRef.current && isPaused) {
      mediaRecorderRef.current.resume();
      setIsPaused(false);
      
      // Resume timer
      timerRef.current = setInterval(() => {
        setRecordingTime(prev => prev + 1);
      }, 1000);
    }
  };

  const stopRecording = () => {
    if (mediaRecorderRef.current) {
      mediaRecorderRef.current.stop();
      setIsRecording(false);
      setIsPaused(false);
      clearInterval(timerRef.current);
    }
  };

  const playAudio = () => {
    if (audioRef.current) {
      audioRef.current.play();
      setIsPlaying(true);
    }
  };

  const pauseAudio = () => {
    if (audioRef.current) {
      audioRef.current.pause();
      setIsPlaying(false);
    }
  };

  const deleteRecording = () => {
    if (audioUrl) {
      URL.revokeObjectURL(audioUrl);
    }
    setAudioBlob(null);
    setAudioUrl(null);
    setIsPlaying(false);
    setAnalysisResults(null);
    setRecordingTime(0);
  };

  const analyzeRecording = async () => {
    if (!audioBlob) return;

    setIsAnalyzing(true);
    try {
      // In production, this would upload to backend and use AI analysis
      // For now, we'll create a mock analysis result
      // TODO: Integrate with backend API endpoint for voice analysis
      
      // Simulate API call delay
      await new Promise(resolve => setTimeout(resolve, 2000));
      
      // Mock analysis result - in production, this would come from the backend
      const result = {
        transcription: "I'm feeling a bit overwhelmed today with all the tasks I need to complete.",
        detected_emotions: [
          { emotion: "overwhelmed", intensity: 7, confidence: 0.85 },
          { emotion: "stressed", intensity: 6, confidence: 0.75 }
        ],
        suggested_vocabulary: ["overwhelmed", "stressed", "anxious", "pressured"],
        context_triggers: ["work tasks", "time pressure"],
        overall_tone: "slightly anxious and pressured",
        supportive_message: "It sounds like you're dealing with a lot right now. Remember to take breaks and prioritize what's most important.",
        journal_entry_suggestion: {
          primary_emotion: "overwhelmed",
          secondary_emotions: ["stressed", "anxious"],
          intensity: 7,
          context: "Feeling overwhelmed with multiple tasks and deadlines",
          notes: "Need to break down tasks into smaller, manageable pieces"
        }
      };

      setAnalysisResults(result);
    } catch (error) {
      console.error("Error analyzing recording:", error);
      alert("Could not analyze the recording. Please try again.");
    }
    setIsAnalyzing(false);
  };

  const useAnalysisForJournal = () => {
    if (analysisResults?.journal_entry_suggestion) {
      onAnalysisComplete(analysisResults);
    }
  };

  const formatTime = (seconds) => {
    const mins = Math.floor(seconds / 60);
    const secs = seconds % 60;
    return `${mins}:${secs.toString().padStart(2, '0')}`;
  };

  return (
    <Card className="p-6 bg-gradient-to-br from-purple-50 to-indigo-50 border-purple-200">
      <div className="flex items-center justify-between mb-6">
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 bg-purple-100 rounded-full flex items-center justify-center">
            <Mic className="w-5 h-5 text-purple-500" />
          </div>
          <div>
            <h3 className="text-lg font-semibold text-purple-900">Voice Journal</h3>
            <p className="text-sm text-purple-600">Speak your feelings, let AI help you understand them</p>
          </div>
        </div>
        <Button variant="ghost" size="sm" onClick={onClose} className="text-gray-500">
          ×
        </Button>
      </div>

      {/* Recording Controls */}
      {!audioBlob && (
        <div className="text-center space-y-4">
          {!isRecording ? (
            <Button
              onClick={startRecording}
              className="w-20 h-20 rounded-full bg-gradient-to-r from-red-500 to-pink-500 hover:from-red-600 hover:to-pink-600 text-white shadow-lg"
            >
              <Mic className="w-8 h-8" />
            </Button>
          ) : (
            <div className="space-y-4">
              <div className="w-20 h-20 mx-auto rounded-full bg-red-500 flex items-center justify-center animate-pulse">
                <MicOff className="w-8 h-8 text-white" />
              </div>
              
              <div className="space-y-2">
                <div className="text-2xl font-bold text-red-600">
                  {formatTime(recordingTime)}
                </div>
                <Progress value={Math.min((recordingTime / 300) * 100, 100)} className="h-2" />
                <p className="text-xs text-gray-600">Maximum 5 minutes</p>
              </div>

              <div className="flex gap-3 justify-center">
                {!isPaused ? (
                  <Button onClick={pauseRecording} variant="outline" size="sm">
                    <Pause className="w-4 h-4" />
                  </Button>
                ) : (
                  <Button onClick={resumeRecording} variant="outline" size="sm">
                    <Play className="w-4 h-4" />
                  </Button>
                )}
                <Button onClick={stopRecording} variant="outline" size="sm">
                  <Square className="w-4 h-4" />
                </Button>
              </div>
            </div>
          )}

          {!isRecording && (
            <p className="text-sm text-gray-600">
              Tap the microphone to start recording your thoughts and feelings
            </p>
          )}
        </div>
      )}

      {/* Audio Playback */}
      {audioBlob && !analysisResults && (
        <div className="space-y-4">
          <div className="bg-white p-4 rounded-lg border">
            <div className="flex items-center justify-between mb-3">
              <div className="flex items-center gap-2">
                <Volume2 className="w-4 h-4 text-gray-500" />
                <span className="font-medium">Your Recording</span>
                <Badge variant="outline">{formatTime(recordingTime)}</Badge>
              </div>
              <Button variant="ghost" size="sm" onClick={deleteRecording}>
                <Trash2 className="w-4 h-4 text-red-500" />
              </Button>
            </div>

            <audio
              ref={audioRef}
              src={audioUrl}
              onEnded={() => setIsPlaying(false)}
              className="w-full"
              controls
            />
          </div>

          <div className="flex gap-3">
            <Button 
              onClick={analyzeRecording}
              className="flex-1 bg-gradient-to-r from-purple-500 to-indigo-500 hover:from-purple-600 hover:to-indigo-600"
              disabled={isAnalyzing}
            >
              {isAnalyzing ? (
                <>
                  <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                  Analyzing...
                </>
              ) : (
                <>
                  <Sparkles className="w-4 h-4 mr-2" />
                  Analyze Emotions
                </>
              )}
            </Button>
          </div>
        </div>
      )}

      {/* Analysis Results */}
      {analysisResults && (
        <div className="space-y-4">
          <div className="bg-white p-4 rounded-lg border">
            <h4 className="font-semibold mb-3 flex items-center gap-2">
              <Sparkles className="w-4 h-4 text-purple-500" />
              AI Analysis Results
            </h4>

            {/* Transcription */}
            {analysisResults.transcription && (
              <div className="mb-4 p-3 bg-gray-50 rounded-lg">
                <p className="text-sm font-medium text-gray-700 mb-1">What you said:</p>
                <p className="text-gray-800 italic">"{analysisResults.transcription}"</p>
              </div>
            )}

            {/* Detected Emotions */}
            {analysisResults.detected_emotions && (
              <div className="mb-4">
                <p className="text-sm font-medium text-gray-700 mb-2">Detected emotions:</p>
                <div className="flex flex-wrap gap-2">
                  {analysisResults.detected_emotions.map((emotion, index) => (
                    <Badge 
                      key={index} 
                      variant="secondary"
                      className="bg-purple-100 text-purple-800"
                    >
                      {emotion.emotion} ({emotion.intensity}/10)
                    </Badge>
                  ))}
                </div>
              </div>
            )}

            {/* Suggested Vocabulary */}
            {analysisResults.suggested_vocabulary && (
              <div className="mb-4">
                <p className="text-sm font-medium text-gray-700 mb-2">Suggested emotion words:</p>
                <div className="flex flex-wrap gap-2">
                  {analysisResults.suggested_vocabulary.map((word, index) => (
                    <Badge key={index} variant="outline" className="border-indigo-300 text-indigo-700">
                      {word}
                    </Badge>
                  ))}
                </div>
              </div>
            )}

            {/* Supportive Message */}
            {analysisResults.supportive_message && (
              <div className="mb-4 p-3 bg-blue-50 border-l-4 border-blue-500 rounded-r-lg">
                <p className="text-blue-800 text-sm">{analysisResults.supportive_message}</p>
              </div>
            )}
          </div>

          <div className="flex gap-3">
            <Button 
              onClick={useAnalysisForJournal}
              className="flex-1 bg-gradient-to-r from-green-500 to-teal-500 hover:from-green-600 hover:to-teal-600"
            >
              <Upload className="w-4 h-4 mr-2" />
              Use for Journal Entry
            </Button>
            <Button variant="outline" onClick={deleteRecording}>
              <Trash2 className="w-4 h-4 mr-2" />
              Record Again
            </Button>
          </div>
        </div>
      )}
    </Card>
  );
}