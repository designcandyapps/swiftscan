// This file uses server-side code.
'use server';

/**
 * @fileOverview Extracts text from an image using OCR.
 *
 * - ocrExtraction - A function that handles the OCR extraction process.
 * - OcrExtractionInput - The input type for the ocrExtraction function.
 * - OcrExtractionOutput - The return type for the ocrExtraction function.
 */

import {ai} from '@/ai/genkit';
import {z} from 'genkit';

const OcrExtractionInputSchema = z.object({
  photoDataUri: z
    .string()
    .describe(
      "A photo of a document, as a data URI that must include a MIME type and use Base64 encoding. Expected format: 'data:<mimetype>;base64,<encoded_data>'."
    ),
  layoutPreservation: z.boolean().optional().describe("Whether to attempt preservation of the document's original layout in the output."),
});
export type OcrExtractionInput = z.infer<typeof OcrExtractionInputSchema>;

const OcrExtractionOutputSchema = z.object({
  extractedText: z.string().describe('The extracted text from the image.'),
});
export type OcrExtractionOutput = z.infer<typeof OcrExtractionOutputSchema>;

export async function ocrExtraction(input: OcrExtractionInput): Promise<OcrExtractionOutput> {
  return ocrExtractionFlow(input);
}

const ocrExtractionPrompt = ai.definePrompt({
  name: 'ocrExtractionPrompt',
  input: {schema: OcrExtractionInputSchema},
  output: {schema: OcrExtractionOutputSchema},
  prompt: `You are an expert OCR tool.

You will extract the text from the image provided, and return it in the extractedText field.

Image: {{media url=photoDataUri}}

Attempt to preserve the layout of the document: {{{layoutPreservation}}}`,
});

const ocrExtractionFlow = ai.defineFlow(
  {
    name: 'ocrExtractionFlow',
    inputSchema: OcrExtractionInputSchema,
    outputSchema: OcrExtractionOutputSchema,
  },
  async input => {
    try {
      const response = await ocrExtractionPrompt(input);
      if (response?.output?.extractedText !== undefined) {
        return response.output;
      }
      if (response?.text) {
        return { extractedText: response.text };
      }
      throw new Error('OCR prompt returned empty output.');
    } catch (error) {
      console.error('Error in ocrExtractionFlow:', error);
      throw error;
    }
  }
);
