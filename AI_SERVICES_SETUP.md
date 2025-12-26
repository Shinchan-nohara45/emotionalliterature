# AI Services Setup Guide

## OpenRouter (Claude AI) Setup

EmoLit uses OpenRouter to access Claude models for generating empathetic AI responses. This replaces Gemini/OpenAI.

### Steps:

1. **Create OpenRouter Account**
   - Go to https://openrouter.ai/
   - Sign up for an account
   - Navigate to https://openrouter.ai/keys
   - Create a new API key

2. **Configure Backend**
   - Add to your `.env` file:
   ```
   OPENROUTER_API_KEY=your_openrouter_api_key_here
   ```

3. **Model Used**
   - Default: `anthropic/claude-3.5-sonnet`
   - You can change this in `backend/app/services/response_generator.py`
   - See available models: https://openrouter.ai/models

### Reference
- OpenRouter Documentation: https://openrouter.ai/docs
- Claude Code Integration: https://openrouter.ai/docs/guides/guides/claude-code-integration

## Azure AI Services Setup

EmoLit uses Azure AI Services for speech features (text-to-speech, speech-to-text, translation).

### Available Services:
- **Speech Service**: Text-to-speech and speech-to-text
- **Translator Service**: Text translation

### Steps:

1. **Create Azure Account**
   - Go to https://portal.azure.com
   - Sign up for a free account (if you don't have one)

2. **Create Speech Resource**
   - In Azure Portal, click "Create a resource"
   - Search for "Speech"
   - Select "Speech" service
   - Create the resource
   - Note down the **Key** and **Region**

3. **Create Translator Resource** (Optional)
   - In Azure Portal, click "Create a resource"
   - Search for "Translator"
   - Select "Translator" service
   - Create the resource
   - Note down the **Key** and **Region**

4. **Configure Backend**
   - Add to your `.env` file:
   ```
   AZURE_SPEECH_KEY=your_azure_speech_key_here
   AZURE_SPEECH_REGION=eastus
   AZURE_TRANSLATOR_KEY=your_azure_translator_key_here
   AZURE_TRANSLATOR_REGION=eastus
   ```

### Reference
- Azure AI Services Overview: https://learn.microsoft.com/en-us/azure/ai-services/what-are-ai-services
- Speech Service: https://learn.microsoft.com/en-us/azure/ai-services/speech-service/
- Translator Service: https://learn.microsoft.com/en-us/azure/ai-services/translator/

## Features Enabled

### With OpenRouter (Claude):
- ✅ Empathetic AI responses to journal entries
- ✅ Emotional support and guidance
- ✅ Context-aware suggestions

### With Azure AI Services:
- ✅ Speech-to-text for voice journal entries
- ✅ Text-to-speech (can be added to frontend)
- ✅ Multi-language translation support

## Free Tiers

- **OpenRouter**: Pay-per-use, very affordable
- **Azure Speech**: Free tier includes 5 hours of speech-to-text and 5 hours of text-to-speech per month
- **Azure Translator**: Free tier includes 2 million characters per month

## Testing

After configuration, test the services:

1. **Test OpenRouter**: Create a journal entry and check if you get AI responses
2. **Test Azure Speech**: Use the voice journal feature to record and transcribe

## Troubleshooting

- **"Failed to fetch" error**: Check CORS settings and ensure backend is running
- **No AI responses**: Verify OpenRouter API key is set correctly
- **Speech not working**: Check Azure Speech key and region
- **Translation not working**: Check Azure Translator key and region

