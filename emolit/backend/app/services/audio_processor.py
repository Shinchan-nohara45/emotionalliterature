import librosa
import numpy as np
import speech_recognition as sr
from pydub import AudioSegment
import io
import logging
from typing import Dict, Any, Optional

logger = logging.getLogger(__name__)

class AudioProcessor:
    def __init__(self):
        self.recognizer = sr.Recognizer()
    
    async def process_audio(self, audio_content: bytes, filename: str = "audio.wav") -> Dict[str, Any]:
        """Process audio file for speech-to-text and emotion analysis"""
        try:
            # Convert to wav format if needed
            audio_data = self._convert_to_wav(audio_content, filename)
            
            # Perform speech-to-text
            transcript = await self._speech_to_text(audio_data)
            
            # Extract audio features for emotion analysis
            features = self._extract_audio_features(audio_data)
            
            return {
                "transcript": transcript,
                "features": features,
                "duration": features.get("duration", 0),
                "sample_rate": features.get("sample_rate", 22050)
            }
            
        except Exception as e:
            logger.error(f"Error processing audio: {str(e)}")
            return {
                "error": "Audio processing failed",
                "transcript": "",
                "features": {}
            }
    
    def _convert_to_wav(self, audio_content: bytes, filename: str) -> bytes:
        """Convert audio to WAV format"""
        try:
            # Detect format and convert
            if filename.lower().endswith(('.mp3', '.m4a', '.ogg')):
                audio = AudioSegment.from_file(io.BytesIO(audio_content))
                wav_buffer = io.BytesIO()
                audio.export(wav_buffer, format="wav")
                return wav_buffer.getvalue()
            else:
                # Assume it's already WAV
                return audio_content
        except Exception as e:
            logger.error(f"Error converting audio format: {str(e)}")
            return audio_content
    
    async def _speech_to_text(self, audio_data: bytes) -> str:
        """Convert speech to text"""
        try:
            with sr.AudioFile(io.BytesIO(audio_data)) as source:
                audio = self.recognizer.record(source)
                text = self.recognizer.recognize_google(audio)
                return text
        except sr.UnknownValueError:
            return "Could not understand audio"
        except sr.RequestError as e:
            logger.error(f"Speech recognition error: {str(e)}")
            return "Speech recognition service unavailable"
        except Exception as e:
            logger.error(f"Error in speech-to-text: {str(e)}")
            return "Audio processing error"
    
    def _extract_audio_features(self, audio_data: bytes) -> Dict[str, Any]:
        """Extract audio features for emotion analysis"""
        try:
            # Load audio with librosa
            y, sr = librosa.load(io.BytesIO(audio_data), sr=None)
            
            # Extract features
            features = {
                "duration": librosa.get_duration(y=y, sr=sr),
                "sample_rate": sr,
                "tempo": float(librosa.beat.tempo(y=y, sr=sr)[0]),
                "spectral_centroid": float(np.mean(librosa.feature.spectral_centroid(y=y, sr=sr))),
                "zero_crossing_rate": float(np.mean(librosa.feature.zero_crossing_rate(y))),
                "mfcc": librosa.feature.mfcc(y=y, sr=sr, n_mfcc=13).mean(axis=1).tolist(),
                "energy": float(np.mean(y**2))
            }
            
            return features
            
        except Exception as e:
            logger.error(f"Error extracting audio features: {str(e)}")
            return {"error": "Feature extraction failed"}
