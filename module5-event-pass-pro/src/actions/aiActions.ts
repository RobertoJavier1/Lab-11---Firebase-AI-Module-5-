// =============================================================================
// AI ACTIONS - Module 5: EventPass Pro
// =============================================================================
//
// ## Educational Note: Server Actions para IA Generativa
//
// Este archivo contiene Server Actions que integran Gemini AI para generar
// contenido de eventos. Usamos Server Actions en lugar de API Routes porque:
//
// 1. **Seguridad**: Las API keys NUNCA llegan al cliente
// 2. **Simplicidad**: No necesitamos crear endpoints REST
// 3. **Type Safety**: TypeScript end-to-end sin serializacion manual
// 4. **Caching**: Next.js puede cachear resultados automaticamente
//
// ### Flujo de Generación con Gemini
//
// ```
// ┌─────────────────────────────────────────────────────────────────────────┐
// │                    FLUJO: CLIENTE → SERVER ACTION → GEMINI              │
// ├─────────────────────────────────────────────────────────────────────────┤
// │                                                                          │
// │   1. Usuario escribe título ────────────────────────────────────────┐    │
// │      "Conferencia de React 2025"                                    │    │
// │                                                                     │    │
// │   2. Click "Generar con IA" ────────────────────────────────────────┤    │
// │                                                                     │    │
// │   3. EventForm llama generateEventDetailsAction(title) ─────────────┤    │
// │      (Server Action, ejecuta en el servidor)                        │    │
// │                                                                     │    │
// │   4. Server Action construye prompt ────────────────────────────────┤    │
// │      + Envía a Gemini API                                           │    │
// │                                                                     │    │
// │   5. Gemini retorna JSON ───────────────────────────────────────────┤    │
// │      { description, category, tags }                                │    │
// │                                                                     │    │
// │   6. Server Action parsea y valida ─────────────────────────────────┤    │
// │                                                                     │    │
// │   7. Retorna datos al cliente ──────────────────────────────────────┘    │
// │      EventForm actualiza campos automáticamente                          │
// │                                                                          │
// └─────────────────────────────────────────────────────────────────────────┘
// ```
//
// ### Prompt Engineering
//
// El prompt está diseñado para:
// 1. Dar contexto claro al modelo (eres un experto en eventos)
// 2. Especificar el formato exacto de salida (JSON)
// 3. Incluir restricciones (categorías válidas, límite de caracteres)
// 4. Pedir respuesta sin formato markdown (solo JSON)
//
// =============================================================================

'use server';

import { getGeminiClient, GEMINI_MODELS } from '@/lib/gemini';
import { EVENT_CATEGORIES } from '@/types/event';

// =============================================================================
// TIPOS DE RESPUESTA
// =============================================================================

export interface GeneratedEventDetails {
    description: string;
    category: string;
    tags: string[];
}

export async function generateEventDetailsAction(title: string): Promise<{ success: boolean; data?: GeneratedEventDetails; error?: string }> {
    try {
        if (!process.env.GEMINI_API_KEY) {
            throw new Error('GEMINI_API_KEY is not configured');
        }

        if (!title || title.length < 3) {
            return { success: false, error: 'Please provide a valid event title' };
        }

        const client = getGeminiClient();

        const prompt = `
      You are an expert event planner. Based on the event title "${title}", please generate:
      1. A compelling and engaging description (2-3 paragraphs, MUST be under 1000 characters).
      2. The most suitable category from this list: ${EVENT_CATEGORIES.join(', ')}.
      3. A list of 5 relevant tags (lowercase, concise).

      Return the response in strictly valid JSON format with this structure:
      {
        "description": "string",
        "category": "string",
        "tags": ["tag1", "tag2"]
      }
      Do not include any markdown formatting or explanations, just the JSON string.
    `;

        // The new SDK syntax might differ, but assuming standardized usage:
        // client.models.generateContent({ model: 'model-name', contents: ... })
        const result = await client.models.generateContent({
            model: GEMINI_MODELS.TEXT,
            contents: [
                {
                    role: 'user',
                    parts: [{ text: prompt }]
                }
            ],
            config: {
                responseMimeType: 'application/json'
            }
        });

        const text = result.text;

        if (!text) {
            throw new Error('No content generated');
        }

        // Clean up markdown code blocks if present (common in LLM responses)
        // Even with JSON mode, sometimes it might add wrapping
        const cleanedText = text.replace(/```json\n?|\n?```/g, '').trim();

        const data = JSON.parse(cleanedText) as GeneratedEventDetails;

        // Validate category
        if (!EVENT_CATEGORIES.includes(data.category as any)) {
            data.category = 'otro';
        }

        // Limit tags to 5
        data.tags = (data.tags || []).slice(0, 5);

        return { success: true, data };
    } catch (error) {
        console.error('Gemini API Error:', error);
        return { success: false, error: 'Failed to generate content. Please try again.' };
    }
}

export async function generateEventPosterAction(prompt: string, eventId?: string): Promise<{ success: boolean; imageUrl?: string; error?: string }> {
    try {
        if (!process.env.GEMINI_API_KEY) {
            throw new Error('GEMINI_API_KEY is not configured');
        }

        const client = getGeminiClient();

        // Generate image
        const result = await client.models.generateContent({
            model: GEMINI_MODELS.IMAGE,
            contents: [
                {
                    role: 'user',
                    parts: [{ text: `Create a professional, modern, and clean business event poster for: ${prompt}. Style: High-quality photorealistic imagery, elegant typography. Avoid futuristic, sci-fi, or neon aesthetics. 16:9 aspect ratio. Minimal text.` }]
                }
            ],
        });

        // Extract base64
        // According to context7 docs for gemini-3-pro-image-preview:
        // response.candidates[0].content.parts[0].inlineData.data
        const candidates = result.candidates; // Access property directly
        const part = candidates?.[0]?.content?.parts?.[0];

        let base64Image: string | undefined;

        if (part?.inlineData?.data) {
            base64Image = part.inlineData.data;
        } else {
            console.error('No inlineData in response:', JSON.stringify(part));
            throw new Error('No image generated');
        }

        const buffer = Buffer.from(base64Image, 'base64');

        // Upload to storage
        // If no eventId, generate a temporary one
        const targetId = eventId || crypto.randomUUID();

        const { uploadPosterToStorage } = await import('@/lib/firebase/storage');
        const imageUrl = await uploadPosterToStorage(targetId, buffer, 'image/png');

        if (!imageUrl) {
            throw new Error('Failed to upload image to storage');
        }

        return { success: true, imageUrl };
    } catch (error) {
        console.error('Gemini Image Generation Error:', error);
        return { success: false, error: 'Failed to generate poster.' };
    }
}

  export interface GeneratedVariants {
    variants: string[];
  }

//genera 3 variantes de descripcion para un evento usando Gemini AI segun el tono indicado
export async function generateEventVariantsAction(
    title: string,
    tone: 'formal' | 'casual' | 'exciting'
  ): Promise<{ success: boolean; data?: GeneratedVariants; error?: string }> {
    try {
      if (!process.env.GEMINI_API_KEY) {
        throw new Error('GEMINI_API_KEY is not configured');
      }

      if (!title || title.length < 3) {
        return { success: false, error: 'Escribe un título válido primero' };
      }

      const toneDescriptions = {
        formal: 'professional, formal and corporate tone',
        casual: 'friendly, casual and approachable tone',
        exciting: 'energetic, exciting and enthusiastic tone',
      };

      const client = getGeminiClient();

      const prompt = `
        You are an expert event copywriter. Generate 3 different descriptions for an event titled "${title}".
        Use a ${toneDescriptions[tone]}.
        Each description should be 2-3 sentences, under 300 characters.

        Return strictly valid JSON with this structure:
        {
          "variants": ["description1", "description2", "description3"]
        }
        No markdown, no explanations, just the JSON.
      `;

      const result = await client.models.generateContent({
        model: GEMINI_MODELS.TEXT,
        contents: [{ role: 'user', parts: [{ text: prompt }] }],
        config: { responseMimeType: 'application/json' },
      });

      const text = result.text;
      if (!text) throw new Error('No content generated');

      const cleanedText = text.replace(/```json\n?|\n?```/g, '').trim();
      const data = JSON.parse(cleanedText) as GeneratedVariants;

      return { success: true, data };
    } catch (error) {
      console.error('Gemini Variants Error:', error);
      return { success: false, error: 'No se pudieron generar las variantes. Intenta de nuevo.' };
    }
}