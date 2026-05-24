import { Injectable, Logger } from '@nestjs/common';
import axios from 'axios';

export interface TranslationResult {
  translatedText: string;
  detectedLanguage?: string;
  provider: string;
}

@Injectable()
export class TranslationService {
  private readonly logger = new Logger(TranslationService.name);

  /**
   * Translate text to target language.
   * Tries: OpenAI → Google Translate → Mock fallback
   */
  async translate(text: string, targetLang: string, sourceLang?: string): Promise<TranslationResult> {
    if (!text?.trim()) return { translatedText: text, provider: 'passthrough' };
    if (sourceLang && sourceLang === targetLang) {
      return { translatedText: text, provider: 'passthrough' };
    }

    // Try OpenAI
    if (process.env.OPENAI_API_KEY) {
      try {
        return await this.translateWithOpenAI(text, targetLang, sourceLang);
      } catch (err) {
        this.logger.warn(`OpenAI translation failed: ${err.message}, falling back to Google`);
      }
    }

    // Try Google Translate
    if (process.env.GOOGLE_TRANSLATE_API_KEY) {
      try {
        return await this.translateWithGoogle(text, targetLang, sourceLang);
      } catch (err) {
        this.logger.warn(`Google translation failed: ${err.message}, using mock`);
      }
    }

    // Mock fallback
    return this.mockTranslate(text, targetLang);
  }

  private async translateWithOpenAI(text: string, targetLang: string, sourceLang?: string): Promise<TranslationResult> {
    const response = await axios.post(
      'https://api.openai.com/v1/chat/completions',
      {
        model: 'gpt-4o-mini',
        messages: [
          {
            role: 'system',
            content: `You are a translator. Translate the user's message to ${targetLang}. Return ONLY the translated text, nothing else.`,
          },
          { role: 'user', content: text },
        ],
        max_tokens: 1000,
        temperature: 0.1,
      },
      {
        headers: {
          Authorization: `Bearer ${process.env.OPENAI_API_KEY}`,
          'Content-Type': 'application/json',
        },
        timeout: 10000,
      },
    );

    return {
      translatedText: response.data.choices[0].message.content.trim(),
      provider: 'openai',
    };
  }

  private async translateWithGoogle(text: string, targetLang: string, sourceLang?: string): Promise<TranslationResult> {
    const params: any = {
      q: text,
      target: targetLang,
      key: process.env.GOOGLE_TRANSLATE_API_KEY,
      format: 'text',
    };
    if (sourceLang) params.source = sourceLang;

    const response = await axios.post(
      'https://translation.googleapis.com/language/translate/v2',
      params,
      { timeout: 8000 },
    );

    const data = response.data.data.translations[0];
    return {
      translatedText: data.translatedText,
      detectedLanguage: data.detectedSourceLanguage,
      provider: 'google',
    };
  }

  private mockTranslate(text: string, targetLang: string): TranslationResult {
    // Mock: adds language tag to simulate translation
    return {
      translatedText: `[${targetLang.toUpperCase()}] ${text}`,
      provider: 'mock',
    };
  }

  async detectLanguage(text: string): Promise<string> {
    if (process.env.GOOGLE_TRANSLATE_API_KEY) {
      try {
        const response = await axios.post(
          'https://translation.googleapis.com/language/translate/v2/detect',
          { q: text, key: process.env.GOOGLE_TRANSLATE_API_KEY },
          { timeout: 5000 },
        );
        return response.data.data.detections[0][0].language;
      } catch {}
    }
    return 'en'; // default fallback
  }

  /** Translate a message for multiple recipients with different language preferences */
  async translateForRecipients(
    text: string,
    sourceLang: string,
    recipientLanguages: string[],
  ): Promise<Record<string, string>> {
    const uniqueLangs = [...new Set(recipientLanguages)].filter(l => l !== sourceLang);
    const translations: Record<string, string> = { [sourceLang]: text };

    await Promise.all(
      uniqueLangs.map(async (lang) => {
        const result = await this.translate(text, lang, sourceLang);
        translations[lang] = result.translatedText;
      }),
    );

    return translations;
  }
}
