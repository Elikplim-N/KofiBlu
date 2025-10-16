'use server';
/**
 * @fileOverview This file defines a Genkit flow that suggests appropriate UI controls (buttons, sliders, input fields) based on serial data received from a connected device.
 *
 * - suggestControlsBasedOnSerialData - A function that accepts serial data and returns suggested UI controls.
 * - SuggestControlsBasedOnSerialDataInput - The input type for the suggestControlsBasedOnSerialData function.
 * - SuggestedControl - Represents a single suggested control with its type and purpose.
 * - SuggestControlsBasedOnSerialDataOutput - The return type for the suggestControlsBasedOnSerialData function.
 */

import {ai} from '@/ai/genkit';
import {z} from 'genkit';

const SuggestControlsBasedOnSerialDataInputSchema = z.object({
  serialData: z.string().describe('The serial data received from the connected device.'),
});
export type SuggestControlsBasedOnSerialDataInput = z.infer<typeof SuggestControlsBasedOnSerialDataInputSchema>;

const SuggestedControlSchema = z.object({
  type: z.enum(['button', 'slider', 'textInput']).describe('The type of the suggested control.'),
  purpose: z.string().describe('The purpose of the suggested control based on the serial data.'),
});
export type SuggestedControl = z.infer<typeof SuggestedControlSchema>;

const SuggestControlsBasedOnSerialDataOutputSchema = z.array(SuggestedControlSchema);
export type SuggestControlsBasedOnSerialDataOutput = z.infer<typeof SuggestControlsBasedOnSerialDataOutputSchema>;

export async function suggestControlsBasedOnSerialData(input: SuggestControlsBasedOnSerialDataInput): Promise<SuggestControlsBasedOnSerialDataOutput> {
  return suggestControlsBasedOnSerialDataFlow(input);
}

const suggestControlsBasedOnSerialDataPrompt = ai.definePrompt({
  name: 'suggestControlsBasedOnSerialDataPrompt',
  input: {schema: SuggestControlsBasedOnSerialDataInputSchema},
  output: {schema: SuggestControlsBasedOnSerialDataOutputSchema},
  prompt: `You are an expert in user interface design for embedded systems.
Based on the following serial data received from a connected device, suggest appropriate UI controls (buttons, sliders, and text input fields) to interact with the device.
Explain the purpose of each suggested control.

Serial Data:
{{serialData}}

Format your response as a JSON array of objects. Each object should have 'type' and 'purpose' fields.
The 'type' field can be one of the following string values: 'button', 'slider', or 'textInput'.
The 'purpose' field should be a brief explanation of what the suggested control does. If the serial data looks like it's for selecting a speed, return a slider. If it looks like a setting that needs to be toggled, return a button. If it looks like data that needs to be set manually, return a textInput. Give 3 suggestions.
`,
});

const suggestControlsBasedOnSerialDataFlow = ai.defineFlow(
  {
    name: 'suggestControlsBasedOnSerialDataFlow',
    inputSchema: SuggestControlsBasedOnSerialDataInputSchema,
    outputSchema: SuggestControlsBasedOnSerialDataOutputSchema,
  },
  async input => {
    const {output} = await suggestControlsBasedOnSerialDataPrompt(input);
    return output!;
  }
);
