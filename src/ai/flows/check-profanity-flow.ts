
'use server';
/**
 * @fileOverview AI flow to check for profanity and bad language in Tajik.
 */

import {ai} from '@/ai/genkit';
import {z} from 'genkit';

const CheckProfanityInputSchema = z.object({
  text: z.string().describe('The text to check for profanity.'),
});
export type CheckProfanityInput = z.infer<typeof CheckProfanityInputSchema>;

const CheckProfanityOutputSchema = z.object({
  isProfane: z.boolean().describe('Whether the text contains profanity or offensive language.'),
  reason: z.string().optional().describe('Reason if profane.'),
});
export type CheckProfanityOutput = z.infer<typeof CheckProfanityOutputSchema>;

export async function checkProfanity(input: CheckProfanityInput): Promise<CheckProfanityOutput> {
  return checkProfanityFlow(input);
}

const checkProfanityFlow = ai.defineFlow(
  {
    name: 'checkProfanityFlow',
    inputSchema: CheckProfanityInputSchema,
    outputSchema: CheckProfanityOutputSchema,
  },
  async input => {
    const {output} = await ai.generate({
      prompt: `Шумо назоратчии амният дар платформаи "HUNAR-YOB" ҳастед. 
      Матни зеринро барои мавҷуд будани калимаҳои қабеҳ, дашномҳо ва ҳақоратҳои тоҷикӣ таҳлил кунед. 
      Агар матн дашном ё калимаи қабеҳ дошта бошад, 'isProfane'-ро true гузоред. 
      Мо бояд фарҳанг ва одоби муоширатро ҳифз кунем.
      
      Матн: "${input.text}"`,
      output: {schema: CheckProfanityOutputSchema},
    });
    return output!;
  }
);
