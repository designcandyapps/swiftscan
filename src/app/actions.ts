'use server';

import { ocrExtraction, OcrExtractionInput } from '@/ai/flows/ocr-flow';

export async function extractTextFromImage(
  data: OcrExtractionInput
): Promise<{ extractedText?: string; error?: string }> {
  try {
    if (!data?.photoDataUri) {
      throw new Error('No image data provided for extraction.');
    }

    if (data.photoDataUri.startsWith('http')) {
      const response = await fetch(data.photoDataUri);
      if (!response.ok) {
        throw new Error(`Failed to fetch image from URL: ${response.statusText} (${response.status})`);
      }
      const contentType = response.headers.get('content-type');
      if (!contentType || !contentType.startsWith('image')) {
        throw new Error('URL does not point to a valid image.');
      }
      const buffer = await response.arrayBuffer();
      const base64 = Buffer.from(buffer).toString('base64');
      data.photoDataUri = `data:${contentType};base64,${base64}`;
    }

    const result = await ocrExtraction(data);
    if (!result || typeof result.extractedText !== 'string') {
      throw new Error('Failed to extract text: no content returned.');
    }
    return { extractedText: result.extractedText };
  } catch (e: any) {
    console.error('Error in extractTextFromImage action:', e);
    return { error: e?.message || 'An unknown error occurred' };
  }
}
