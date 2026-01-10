# """
# Azure AI Services integration for Speech and Translation
# Based on: https://learn.microsoft.com/en-us/azure/ai-services/what-are-ai-services
# """
# import httpx
# from typing import Optional, Dict, Any
# from app.core.config import settings
# import logging
# import base64

# logger = logging.getLogger(__name__)

# class AzureSpeechService:
#     """Azure Speech Service for text-to-speech and speech-to-text"""
    
#     def __init__(self):
#         self.speech_key = settings.azure_speech_key
#         self.speech_region = settings.azure_speech_region or "eastus"
#         self.base_url = f"https://{self.speech_region}.tts.speech.microsoft.com"
        
#     async def text_to_speech(self, text: str, voice: str = "en-US-JennyNeural") -> Optional[bytes]:
#         """Convert text to speech using Azure Speech Service"""
#         if not self.speech_key:
#             logger.warning("Azure Speech key not configured")
#             return None
            
#         try:
#             async with httpx.AsyncClient(timeout=30.0) as client:
#                 # Get access token
#                 token_response = await client.post(
#                     f"https://{self.speech_region}.api.cognitive.microsoft.com/sts/v1.0/issueToken",
#                     headers={
#                         "Ocp-Apim-Subscription-Key": self.speech_key
#                     }
#                 )
                
#                 if token_response.status_code != 200:
#                     logger.error(f"Failed to get Azure Speech token: {token_response.status_code}")
#                     return None
                
#                 access_token = token_response.text
                
#                 # Generate speech
#                 ssml = f"""<speak version='1.0' xml:lang='en-US'>
#                     <voice xml:lang='en-US' name='{voice}'>
#                         {text}
#                     </voice>
#                 </speak>"""
                
#                 speech_response = await client.post(
#                     f"{self.base_url}/cognitiveservices/v1",
#                     headers={
#                         "Authorization": f"Bearer {access_token}",
#                         "Content-Type": "application/ssml+xml",
#                         "X-Microsoft-OutputFormat": "audio-16khz-128kbitrate-mono-mp3"
#                     },
#                     content=ssml
#                 )
                
#                 if speech_response.status_code == 200:
#                     return speech_response.content
#                 else:
#                     logger.error(f"Failed to generate speech: {speech_response.status_code}")
#                     return None
                    
#         except Exception as e:
#             logger.error(f"Azure Speech error: {str(e)}")
#             return None
    
#     async def speech_to_text(self, audio_data: bytes, language: str = "en-US") -> Optional[str]:
#         """Convert speech to text using Azure Speech Service"""
#         if not self.speech_key:
#             logger.warning("Azure Speech key not configured")
#             return None
            
#         try:
#             async with httpx.AsyncClient(timeout=30.0) as client:
#                 # Get access token
#                 token_response = await client.post(
#                     f"https://{self.speech_region}.api.cognitive.microsoft.com/sts/v1.0/issueToken",
#                     headers={
#                         "Ocp-Apim-Subscription-Key": self.speech_key
#                     }
#                 )
                
#                 if token_response.status_code != 200:
#                     logger.error(f"Failed to get Azure Speech token: {token_response.status_code}")
#                     return None
                
#                 access_token = token_response.text
                
#                 # Convert speech to text
#                 speech_response = await client.post(
#                     f"https://{self.speech_region}.stt.speech.microsoft.com/speech/recognition/conversation/cognitiveservices/v1?language={language}",
#                     headers={
#                         "Authorization": f"Bearer {access_token}",
#                         "Content-Type": "audio/wav"
#                     },
#                     content=audio_data
#                 )
                
#                 if speech_response.status_code == 200:
#                     result = speech_response.json()
#                     return result.get("DisplayText", "")
#                 else:
#                     logger.error(f"Failed to transcribe speech: {speech_response.status_code}")
#                     return None
                    
#         except Exception as e:
#             logger.error(f"Azure Speech error: {str(e)}")
#             return None


# class AzureTranslatorService:
#     """Azure Translator Service for text translation"""
    
#     def __init__(self):
#         self.translator_key = settings.azure_translator_key
#         self.translator_region = settings.azure_translator_region or "eastus"
#         self.base_url = f"https://api.cognitive.microsofttranslator.com"
        
#     async def translate_text(self, text: str, target_language: str = "en", source_language: str = "auto") -> Optional[str]:
#         """Translate text using Azure Translator Service"""
#         if not self.translator_key:
#             logger.warning("Azure Translator key not configured")
#             return None
            
#         try:
#             async with httpx.AsyncClient(timeout=30.0) as client:
#                 response = await client.post(
#                     f"{self.base_url}/translate",
#                     headers={
#                         "Ocp-Apim-Subscription-Key": self.translator_key,
#                         "Ocp-Apim-Subscription-Region": self.translator_region,
#                         "Content-Type": "application/json"
#                     },
#                     params={
#                         "api-version": "3.0",
#                         "from": source_language,
#                         "to": target_language
#                     },
#                     json=[{"text": text}]
#                 )
                
#                 if response.status_code == 200:
#                     result = response.json()
#                     return result[0]["translations"][0]["text"]
#                 else:
#                     logger.error(f"Failed to translate text: {response.status_code}")
#                     return None
                    
#         except Exception as e:
#             logger.error(f"Azure Translator error: {str(e)}")
#             return None



"""
Azure AI Services integration for Speech, Translation, and Blob Storage
Based on: https://learn.microsoft.com/en-us/azure/ai-services/what-are-ai-services
"""
import httpx
from typing import Optional, Dict, Any
from app.core.config import settings
import logging
import base64
from azure.storage.blob import BlobServiceClient, ContentSettings
from datetime import datetime
import uuid
import io

logger = logging.getLogger(__name__)

class AzureBlobStorageService:
    """Azure Blob Storage Service for storing audio files"""
    
    def __init__(self):
        self.connection_string = settings.azure_storage_connection_string
        self.container_name = settings.azure_blob_container_name or "voice-recordings"
        self.blob_service_client = None
        
        if self.connection_string:
            try:
                self.blob_service_client = BlobServiceClient.from_connection_string(self.connection_string)
                # Create container if it doesn't exist
                try:
                    self.blob_service_client.create_container(self.container_name)
                    logger.info(f"Created container: {self.container_name}")
                except Exception:
                    # Container already exists
                    pass
            except Exception as e:
                logger.error(f"Failed to initialize Blob Storage: {str(e)}")
    
    async def upload_audio(
        self, 
        audio_data: bytes, 
        file_extension: str = "mp3",
        metadata: Optional[Dict[str, str]] = None
    ) -> Optional[Dict[str, str]]:
        """
        Upload audio file to Azure Blob Storage
        
        Args:
            audio_data: Audio file bytes
            file_extension: File extension (mp3, wav, etc.)
            metadata: Optional metadata to store with the blob
            
        Returns:
            Dictionary with blob_url, blob_name, and file_id
            
        Raises:
            Exception: If blob storage is not configured or upload fails
        """
        if not self.blob_service_client:
            error_msg = (
                "Azure Blob Storage is not configured. "
                "Please set AZURE_STORAGE_CONNECTION_STRING in your .env file. "
                "Get your connection string from Azure Portal > Storage Account > Access Keys"
            )
            logger.error(error_msg)
            raise Exception(error_msg)
            
        try:
            # Generate unique filename
            file_id = str(uuid.uuid4())
            timestamp = datetime.utcnow().strftime("%Y%m%d_%H%M%S")
            blob_name = f"{timestamp}_{file_id}.{file_extension}"
            
            # Get blob client
            blob_client = self.blob_service_client.get_blob_client(
                container=self.container_name,
                blob=blob_name
            )
            
            # Set content type based on file extension
            content_type_map = {
                "mp3": "audio/mpeg",
                "wav": "audio/wav",
                "m4a": "audio/mp4",
                "ogg": "audio/ogg"
            }
            content_type = content_type_map.get(file_extension.lower(), "audio/mpeg")
            
            # Upload the blob
            blob_client.upload_blob(
                audio_data,
                overwrite=True,
                content_settings=ContentSettings(content_type=content_type),
                metadata=metadata or {}
            )
            
            # Get the blob URL
            blob_url = blob_client.url
            
            logger.info(f"Successfully uploaded audio to blob: {blob_name}")
            
            return {
                "blob_url": blob_url,
                "blob_name": blob_name,
                "file_id": file_id,
                "container_name": self.container_name
            }
            
        except Exception as e:
            logger.error(f"Failed to upload audio to blob storage: {str(e)}")
            return None
    
    async def download_audio(self, blob_name: str) -> Optional[bytes]:
        """
        Download audio file from Azure Blob Storage
        
        Args:
            blob_name: Name of the blob to download
            
        Returns:
            Audio file bytes
        """
        if not self.blob_service_client:
            logger.warning("Azure Blob Storage not configured")
            return None
            
        try:
            blob_client = self.blob_service_client.get_blob_client(
                container=self.container_name,
                blob=blob_name
            )
            
            # Download the blob
            download_stream = blob_client.download_blob()
            audio_data = download_stream.readall()
            
            logger.info(f"Successfully downloaded audio from blob: {blob_name}")
            return audio_data
            
        except Exception as e:
            logger.error(f"Failed to download audio from blob storage: {str(e)}")
            return None
    
    async def delete_audio(self, blob_name: str) -> bool:
        """
        Delete audio file from Azure Blob Storage
        
        Args:
            blob_name: Name of the blob to delete
            
        Returns:
            True if successful, False otherwise
        """
        if not self.blob_service_client:
            logger.warning("Azure Blob Storage not configured")
            return False
            
        try:
            blob_client = self.blob_service_client.get_blob_client(
                container=self.container_name,
                blob=blob_name
            )
            
            blob_client.delete_blob()
            logger.info(f"Successfully deleted audio blob: {blob_name}")
            return True
            
        except Exception as e:
            logger.error(f"Failed to delete audio from blob storage: {str(e)}")
            return False
    
    async def get_blob_url(self, blob_name: str) -> Optional[str]:
        """
        Get the URL of a blob
        
        Args:
            blob_name: Name of the blob
            
        Returns:
            Blob URL
        """
        if not self.blob_service_client:
            logger.warning("Azure Blob Storage not configured")
            return None
            
        try:
            blob_client = self.blob_service_client.get_blob_client(
                container=self.container_name,
                blob=blob_name
            )
            return blob_client.url
        except Exception as e:
            logger.error(f"Failed to get blob URL: {str(e)}")
            return None


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
    
    async def speech_to_text(self, audio_data: bytes, language: str = "en-US", audio_format: str = "audio/wav") -> Optional[str]:
        """
        Convert speech to text using Azure Speech Service
        
        Args:
            audio_data: Audio file bytes
            language: Language code (default: "en-US")
            audio_format: Audio MIME type (default: "audio/wav")
                          Supported: audio/wav, audio/mp3, audio/m4a, audio/ogg
        """
        if not self.speech_key:
            error_msg = (
                "Azure Speech Service is not configured. "
                "Please set AZURE_SPEECH_KEY and AZURE_SPEECH_REGION in your .env file."
            )
            logger.error(error_msg)
            raise Exception(error_msg)
            
        try:
            async with httpx.AsyncClient(timeout=60.0) as client:  # Increased timeout for longer recordings
                # Get access token
                token_response = await client.post(
                    f"https://{self.speech_region}.api.cognitive.microsoft.com/sts/v1.0/issueToken",
                    headers={
                        "Ocp-Apim-Subscription-Key": self.speech_key
                    }
                )
                
                if token_response.status_code != 200:
                    error_msg = f"Failed to get Azure Speech token: {token_response.status_code}"
                    logger.error(error_msg)
                    raise Exception(error_msg)
                
                access_token = token_response.text
                
                # Use the newer Speech-to-Text API endpoint which supports more formats
                # For conversation mode, we use the conversation endpoint
                # For better format support, we can use the REST API with proper content type
                speech_response = await client.post(
                    f"https://{self.speech_region}.stt.speech.microsoft.com/speech/recognition/conversation/cognitiveservices/v1?language={language}",
                    headers={
                        "Authorization": f"Bearer {access_token}",
                        "Content-Type": audio_format
                    },
                    content=audio_data
                )
                
                if speech_response.status_code == 200:
                    result = speech_response.json()
                    transcript = result.get("DisplayText", "")
                    if transcript:
                        logger.info(f"Successfully transcribed {len(transcript)} characters")
                    return transcript
                else:
                    error_text = speech_response.text if hasattr(speech_response, 'text') else ""
                    error_msg = f"Failed to transcribe speech: {speech_response.status_code} - {error_text}"
                    logger.error(error_msg)
                    raise Exception(error_msg)
                    
        except Exception as e:
            logger.error(f"Azure Speech error: {str(e)}")
            raise


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
                    return result["translations"]["text"]
                else:
                    logger.error(f"Failed to translate text: {response.status_code}")
                    return None
                    
        except Exception as e:
            logger.error(f"Azure Translator error: {str(e)}")
            return None