
'use server';
/**
 * @fileOverview AI flow to improve a chat message for artisans/clients.
 */

import {ai} from '@/ai/genkit';
import {z} from 'genkit';

const ImproveMessageInputSchema = z.object({
  text: z.string().describe('The chat message to improve.'),
});
export type ImproveMessageInput = z.infer<typeof ImproveMessageInputSchema>;

const ImproveMessageOutputSchema = z.object({
  improvedText: z.string().describe('The professional and catchy version of the message in Tajik.'),
});
export type ImproveMessageOutput = z.infer<typeof ImproveMessageOutputSchema>;

export async function improveMessage(input: ImproveMessageInput): Promise<ImproveMessageOutput> {
  return improveMessageFlow(input);
}

const improveMessageFlow = ai.defineFlow(
  {
    name: 'improveMessageFlow',
    inputSchema: ImproveMessageInputSchema,
    outputSchema: ImproveMessageOutputSchema,
  },
  async input => {
    const {output} = await ai.generate({
      prompt: `Шумо ёвари ҳуши сунъии платформаи "HUNAR-YOB" ҳастед. 
      Ин паёми чатро таҳрир кунед, то он касбӣ, боэътимод ва ҷолиб барояд. 
      Танҳо матни таҳриршударо ба забони тоҷикӣ баргардонед.
      
      Паём: "${input.text}"`,
      output: {schema: ImproveMessageOutputSchema},
    });
    return output!;
  }
);
