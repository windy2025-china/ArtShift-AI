
import { GoogleGenAI, Type } from "@google/genai";
import { ArtStyle, StyleOption, TextReplacement, EntityModification, AspectRatio } from "../types";

const IMAGE_MODEL = 'gemini-2.5-flash-image';
const TEXT_MODEL = 'gemini-3-flash-preview';

export const detectTextInImage = async (base64Image: string): Promise<string[]> => {
  // Fix: Initialize GoogleGenAI correctly with named parameter
  const ai = new GoogleGenAI({ apiKey: process.env.API_KEY });
  const base64Data = base64Image.split(',')[1] || base64Image;
  const mimeType = base64Image.split(';')[0].split(':')[1] || 'image/png';

  try {
    const response = await ai.models.generateContent({
      model: TEXT_MODEL,
      contents: {
        parts: [
          {
            inlineData: {
              data: base64Data,
              mimeType: mimeType,
            },
          },
          {
            text: "Please extract all visible text strings from this image. Return them as a simple JSON array of strings. Only return the JSON array, nothing else.",
          },
        ],
      },
      config: {
        responseMimeType: "application/json",
        responseSchema: {
          type: Type.ARRAY,
          items: { type: Type.STRING }
        }
      }
    });

    // Fix: Access response.text directly (it's a property, not a method)
    const text = response.text?.trim();
    if (text) {
      const cleaned = text.replace(/^```json\s*/, '').replace(/\s*```$/, '');
      return JSON.parse(cleaned);
    }
    return [];
  } catch (error) {
    console.error("Text Detection Error:", error);
    return [];
  }
};

export const detectEntitiesInImage = async (base64Image: string): Promise<string[]> => {
  // Fix: Initialize GoogleGenAI correctly with named parameter
  const ai = new GoogleGenAI({ apiKey: process.env.API_KEY });
  const base64Data = base64Image.split(',')[1] || base64Image;
  const mimeType = base64Image.split(';')[0].split(':')[1] || 'image/png';

  try {
    const response = await ai.models.generateContent({
      model: TEXT_MODEL,
      contents: {
        parts: [
          {
            inlineData: {
              data: base64Data,
              mimeType: mimeType,
            },
          },
          {
            text: "Analyze this image and identify the 3-5 most distinct visual entities or subjects. Be descriptive and granular (e.g., 'Woman in red dress', 'Modern skyscraper', 'Lush forest background', 'Vintage wooden table', 'Neon city lights'). These entities will be presented to the user for individual modification. Return ONLY a valid JSON array of strings. Do not include markdown formatting or conversational text.",
          },
        ],
      },
      config: {
        responseMimeType: "application/json",
        responseSchema: {
          type: Type.ARRAY,
          items: { type: Type.STRING }
        }
      }
    });

    // Fix: Access response.text directly (it's a property, not a method)
    const text = response.text?.trim();
    if (text) {
      const cleaned = text.replace(/^```json\s*/, '').replace(/\s*```$/, '');
      const parsed = JSON.parse(cleaned);
      if (Array.isArray(parsed) && parsed.length > 0) {
        return parsed;
      }
    }
    return ["主体人物", "主体背景", "核心对象"];
  } catch (error) {
    console.error("Entity Detection Error:", error);
    return ["主体人物", "环境背景", "视觉重心"];
  }
};

export const transformImage = async (
  base64Image: string,
  style: StyleOption,
  customPrompt: string = "",
  textReplacements: TextReplacement[] = [],
  entityModifications: EntityModification[] = [],
  aspectRatio?: AspectRatio
): Promise<string> => {
  // Fix: Initialize GoogleGenAI correctly with named parameter
  const ai = new GoogleGenAI({ apiKey: process.env.API_KEY });
  
  const base64Data = base64Image.split(',')[1] || base64Image;
  const mimeType = base64Image.split(';')[0].split(':')[1] || 'image/png';

  // Construct the final prompt
  let finalPrompt = style.id === ArtStyle.CUSTOM ? customPrompt : style.prompt;
  
  // Add text replacement instructions
  if (textReplacements.length > 0) {
    const replacementInstructions = textReplacements
      .filter(tr => tr.original.trim() !== "" && tr.replacement.trim() !== "" && tr.original !== tr.replacement)
      .map(tr => `Change the text that says "${tr.original}" to "${tr.replacement}".`)
      .join(" ");
    
    if (replacementInstructions) {
      finalPrompt += ` IMPORTANT: ${replacementInstructions} Ensure the new text is rendered clearly and integrated naturally.`;
    }
  }

  // Add entity modification instructions
  if (entityModifications.length > 0) {
    const modInstructions = entityModifications
      .filter(em => em.instruction.trim() !== "")
      .map(em => `Specifically for the "${em.entity}", modify it as follows: ${em.instruction}.`)
      .join(" ");
    
    if (modInstructions) {
      finalPrompt += ` SUBJECT MODIFICATIONS: ${modInstructions}`;
    }
  }

  // Prepare optional configuration like aspectRatio for gemini-2.5-flash-image
  const config: any = {};
  if (aspectRatio && aspectRatio !== 'original') {
    config.imageConfig = { aspectRatio };
  }

  try {
    const response = await ai.models.generateContent({
      model: IMAGE_MODEL,
      contents: {
        parts: [
          {
            inlineData: {
              data: base64Data,
              mimeType: mimeType,
            },
          },
          {
            text: finalPrompt,
          },
        ],
      },
      config,
    });

    // Fix: Correctly iterate through parts to find image data as per guidelines
    const candidates = response.candidates;
    if (candidates && candidates.length > 0) {
      for (const part of candidates[0].content.parts) {
        if (part.inlineData) {
          return `data:image/png;base64,${part.inlineData.data}`;
        }
      }
    }

    throw new Error("No image data returned from AI");
  } catch (error) {
    console.error("Gemini Transformation Error:", error);
    throw error;
  }
};
