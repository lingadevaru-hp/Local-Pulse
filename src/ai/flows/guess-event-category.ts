

import { ai } from '@/ai/genkit';
import { z } from 'genkit';

const GuessEventCategoryInputSchema = z.object({
  query: z.string(),
});
export type GuessEventCategoryInput = z.infer<typeof GuessEventCategoryInputSchema>;

const GuessEventCategoryOutputSchema = z.object({
  category: z.string(),
});
export type GuessEventCategoryOutput = z.infer<typeof GuessEventCategoryOutputSchema>;

export async function guessEventCategory(input: GuessEventCategoryInput): Promise<GuessEventCategoryOutput> {
  return guessEventCategoryFlow(input);
}

const prompt = ai.definePrompt({
  name: 'guessEventCategoryPrompt',
  input: { schema: GuessEventCategoryInputSchema },
  output: { schema: GuessEventCategoryOutputSchema },
  prompt: `You are an AI assistant that suggests an event category based on a user's search query.

  Given the following search query, suggest a relevant event category.  The category should be a single word or short phrase.

  Search Query: {{{query}}}
  Category:`,
});

const guessEventCategoryFlow = ai.defineFlow(
  {
    name: 'guessEventCategoryFlow',
    inputSchema: GuessEventCategoryInputSchema,
    outputSchema: GuessEventCategoryOutputSchema,
  },
  async input => {
    const { output } = await prompt(input);
    return output!;
  }
);
