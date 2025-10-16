'use server';

/**
 * @fileOverview A flow to suggest control profiles based on previously saved and user profiles.
 *
 * - suggestControlProfiles - A function that suggests control profiles.
 * - SuggestControlProfilesInput - The input type for the suggestControlProfiles function.
 * - SuggestControlProfilesOutput - The return type for the suggestControlProfiles function.
 */

import {ai} from '@/ai/genkit';
import {z} from 'genkit';

const SuggestControlProfilesInputSchema = z.object({
  deviceDescription: z.string().describe('A description of the connected device.'),
  previousProfiles: z.array(z.string()).describe('A list of previously saved control profile names.'),
  userProfile: z.string().describe('The user profile information.'),
});
export type SuggestControlProfilesInput = z.infer<typeof SuggestControlProfilesInputSchema>;

const SuggestControlProfilesOutputSchema = z.object({
  suggestedProfiles: z.array(z.string()).describe('A list of suggested control profile names.'),
});
export type SuggestControlProfilesOutput = z.infer<typeof SuggestControlProfilesOutputSchema>;

export async function suggestControlProfiles(input: SuggestControlProfilesInput): Promise<SuggestControlProfilesOutput> {
  return suggestControlProfilesFlow(input);
}

const prompt = ai.definePrompt({
  name: 'suggestControlProfilesPrompt',
  input: {schema: SuggestControlProfilesInputSchema},
  output: {schema: SuggestControlProfilesOutputSchema},
  prompt: `You are an expert in suggesting control profiles for Arduino/ESP projects.

  Based on the device description, previously saved control profiles, and user profile information, suggest a list of control profiles that would be suitable for the user.

  Device Description: {{{deviceDescription}}}
  Previously Saved Control Profiles: {{#each previousProfiles}}{{{this}}}{{#unless @last}}, {{/unless}}{{/each}}
  User Profile: {{{userProfile}}}

  Please provide a list of suggested control profile names.
  Ensure your response is well-formatted.
  `,
});

const suggestControlProfilesFlow = ai.defineFlow(
  {
    name: 'suggestControlProfilesFlow',
    inputSchema: SuggestControlProfilesInputSchema,
    outputSchema: SuggestControlProfilesOutputSchema,
  },
  async input => {
    const {output} = await prompt(input);
    return output!;
  }
);
