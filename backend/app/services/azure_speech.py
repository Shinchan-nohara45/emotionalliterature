"""
Azure AI Services integration for Speech and Translation
Based on: https://learn.microsoft.com/en-us/azure/ai-services/what-are-ai-services
"""
import httpx
from typing import Optional, Dict, Any
from app.core.config import settings
import logging
import base64

logger = logging.getLogger(__name__)

class AzureSpeechService:
    """Azure Speech Service for text-to-speech and speech-to-text"""
    
    def __init__(self):
        self.speech_key = settings.azure_speech_key
        self.speech_region = settings.azure_speech_region or "eastus"
        self.base_url = f"https://{self.speech_region}.tts.speech.microsoft.com"
        
    async def text_to_speech(self, text: str, voice: str = "en-US-JennyNeural") -> Optional[bytes]:
        """Convert text to speech using Azure Speech Service"""
        if not self.speech_key:
            logger.warning("Azure Speech key not configured")
            return None
            
        try:
            async with httpx.AsyncClient(timeout=30.0) as client:
                # Get access token
                token_response = await client.post(
                    f"https://{self.speech_region}.api.cognitive.microsoft.com/sts/v1.0/issueToken",
                    headers={
                        "Ocp-Apim-Subscription-Key": self.speech_key
                    }
                )
                
                if token_response.status_code != 200:
                    logger.error(f"Failed to get Azure Speech token: {token_response.status_code}")
                    return None
                
                access_token = token_response.text
                
                # Generate speech
                ssml = f"""<speak version='1.0' xml:lang='en-US'>
                    <voice xml:lang='en-US' name='{voice}'>
                        {text}
                    </voice>
                </speak>"""
                
                speech_response = await client.post(
                    f"{self.base_url}/cognitiveservices/v1",
                    headers={
                        "Authorization": f"Bearer {access_token}",
                        "Content-Type": "application/ssml+xml",
                        "X-Microsoft-OutputFormat": "audio-16khz-128kbitrate-mono-mp3"
                    },
                    content=ssml
                )
                
                if speech_response.status_code == 200:
                    return speech_response.content
                else:
                    logger.error(f"Failed to generate speech: {speech_response.status_code}")
                    return None
                    
        except Exception as e:
            logger.error(f"Azure Speech error: {str(e)}")
            return None
    
    async def speech_to_text(self, audio_data: bytes, language: str = "en-US") -> Optional[str]:
        """Convert speech to text using Azure Speech Service"""
        if not self.speech_key:
            logger.warning("Azure Speech key not configured")
            return None
            
        try:
            async with httpx.AsyncClient(timeout=30.0) as client:
                # Get access token
                token_response = await client.post(
                    f"https://{self.speech_region}.api.cognitive.microsoft.com/sts/v1.0/issueToken",
                    headers={
                        "Ocp-Apim-Subscription-Key": self.speech_key
                    }
                )
                
                if token_response.status_code != 200:
                    logger.error(f"Failed to get Azure Speech token: {token_response.status_code}")
                    return None
                
                access_token = token_response.text
                
                # Convert speech to text
                speech_response = await client.post(
                    f"https://{self.speech_region}.stt.speech.microsoft.com/speech/recognition/conversation/cognitiveservices/v1?language={language}",
                    headers={
                        "Authorization": f"Bearer {access_token}",
                        "Content-Type": "audio/wav"
                    },
                    content=audio_data
                )
                
                if speech_response.status_code == 200:
                    result = speech_response.json()
                    return result.get("DisplayText", "")
                else:
                    logger.error(f"Failed to transcribe speech: {speech_response.status_code}")
                    return None
                    
        except Exception as e:
            logger.error(f"Azure Speech error: {str(e)}")
            return None


class AzureTranslatorService:
    """Azure Translator Service for text translation"""
    
    def __init__(self):
        self.translator_key = settings.azure_translator_key
        self.translator_region = settings.azure_translator_region or "eastus"
        self.base_url = f"https://api.cognitive.microsofttranslator.com"
        
    async def translate_text(self, text: str, target_language: str = "en", source_language: str = "auto") -> Optional[str]:
        """Translate text using Azure Translator Service"""
        if not self.translator_key:
            logger.warning("Azure Translator key not configured")
            return None
            
        try:
            async with httpx.AsyncClient(timeout=30.0) as client:
                response = await client.post(
                    f"{self.base_url}/translate",
                    headers={
                        "Ocp-Apim-Subscription-Key": self.translator_key,
                        "Ocp-Apim-Subscription-Region": self.translator_region,
                        "Content-Type": "application/json"
                    },
                    params={
                        "api-version": "3.0",
                        "from": source_language,
                        "to": target_language
                    },
                    json=[{"text": text}]
                )
                
                if response.status_code == 200:
                    result = response.json()
                    return result[0]["translations"][0]["text"]
                else:
                    logger.error(f"Failed to translate text: {response.status_code}")
                    return None
                    
        except Exception as e:
            logger.error(f"Azure Translator error: {str(e)}")
            return None

