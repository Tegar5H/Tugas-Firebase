'use server';

/**
 * @fileOverview Provides intelligent task label suggestions based on task title and description.
 *
 * - suggestTaskLabels - A function that suggests task labels.
 * - SuggestTaskLabelsInput - The input type for the suggestTaskLabels function.
 * - SuggestTaskLabelsOutput - The return type for the suggestTaskLabels function.
 */

import {ai} from '@/ai/genkit';
import {z} from 'genkit';

const SuggestTaskLabelsInputSchema = z.object({
  title: z.string().describe('The title of the task.'),
  description: z.string().describe('The description of the task.'),
});
export type SuggestTaskLabelsInput = z.infer<typeof SuggestTaskLabelsInputSchema>;

const SuggestTaskLabelsOutputSchema = z.object({
  labels: z.array(z.string()).describe('Suggested labels for the task.'),
});
export type SuggestTaskLabelsOutput = z.infer<typeof SuggestTaskLabelsOutputSchema>;

export async function suggestTaskLabels(input: SuggestTaskLabelsInput): Promise<SuggestTaskLabelsOutput> {
  return suggestTaskLabelsFlow(input);
}

const prompt = ai.definePrompt({
  name: 'suggestTaskLabelsPrompt',
  input: {schema: SuggestTaskLabelsInputSchema},
  output: {schema: SuggestTaskLabelsOutputSchema},
  prompt: `Suggest relevant labels for the following task. These labels will help the user categorize, search, and filter their tasks.

Task Title: {{{title}}}
Task Description: {{{description}}}

Respond with a JSON array of strings.  Here are some examples:

["Urgent", "Work", "Meeting"]
["Home", "Cleaning"]
["Personal", "Finance"]`,
});

const suggestTaskLabelsFlow = ai.defineFlow(
  {
    name: 'suggestTaskLabelsFlow',
    inputSchema: SuggestTaskLabelsInputSchema,
    outputSchema: SuggestTaskLabelsOutputSchema,
  },
  async input => {
    const {output} = await prompt(input);
    return output!;
  }
);
