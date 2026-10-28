// src/ai/flows/layout-preservation-flow.ts
'use server';

/**
 * @fileOverview This file defines a Genkit flow for preserving the layout of a document during OCR.
 *
 * - layoutPreservation - A function that handles the layout preservation process.
 * - LayoutPreservationInput - The input type for the layoutPreservation function.
 * - LayoutPreservationOutput - The return type for the layoutPreservation function.
 */

import {ai} from '@/ai/genkit';
import {z} from 'genkit';

const LayoutPreservationInputSchema = z.object({
  ocrText: z.string().describe('The OCRed text from the document.'),
  originalLayoutDescription: z
    .string()
    .describe(
      'A description of the original document layout, including elements like headings, paragraphs, lists, and tables.'
    ),
});
export type LayoutPreservationInput = z.infer<typeof LayoutPreservationInputSchema>;

const LayoutPreservationOutputSchema = z.object({
  layoutPreservedText: z
    .string()
    .describe(
      'The OCRed text, formatted to preserve the original layout of the document.'
    ),
});
export type LayoutPreservationOutput = z.infer<typeof LayoutPreservationOutputSchema>;

export async function layoutPreservation(input: LayoutPreservationInput): Promise<LayoutPreservationOutput> {
  return layoutPreservationFlow(input);
}

const prompt = ai.definePrompt({
  name: 'layoutPreservationPrompt',
  input: {schema: LayoutPreservationInputSchema},
  output: {schema: LayoutPreservationOutputSchema},
  prompt: `You are an AI expert in document formatting and layout preservation.

  You are given the OCRed text of a document and a description of its original layout.

  Your task is to reformat the OCRed text to closely match the original layout.

  Here's the OCRed text:
  {{ocrText}}

  Here's the description of the original layout:
  {{originalLayoutDescription}}

  Please provide the reformatted text that preserves the original layout as closely as possible.
  `,
});

const layoutPreservationFlow = ai.defineFlow(
  {
    name: 'layoutPreservationFlow',
    inputSchema: LayoutPreservationInputSchema,
    outputSchema: LayoutPreservationOutputSchema,
  },
  async input => {
    try {
      const response = await prompt(input);
      if (response?.output?.layoutPreservedText !== undefined) {
        return response.output;
      }
      if (response?.text) {
        return { layoutPreservedText: response.text };
      }
      throw new Error('Layout preservation prompt returned empty output.');
    } catch (error) {
      console.error('Error in layoutPreservationFlow:', error);
      throw error;
    }
  }
);
