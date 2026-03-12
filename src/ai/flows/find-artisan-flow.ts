
'use server';
/**
 * @fileOverview AI flow to help users find the best artisan based on their needs.
 */

import {ai} from '@/ai/genkit';
import {z} from 'genkit';

const FindArtisanInputSchema = z.object({
  query: z.string().describe('The user\'s request for a specific service or artisan.'),
});
export type FindArtisanInput = z.infer<typeof FindArtisanInputSchema>;

const FindArtisanOutputSchema = z.object({
  recommendation: z.string().describe('The AI\'s response recommending a category or type of artisan.'),
  suggestedCategory: z.string().optional().describe('The specific category from the list that matches the request.'),
  advice: z.string().describe('Short advice for the user on what to ask the artisan.'),
});
export type FindArtisanOutput = z.infer<typeof FindArtisanOutputSchema>;

const ALL_CATEGORIES = [
  "Барномасоз", "Дӯзанда", "Дуредгар", "Сантехник", "Барқчӣ", "Меъмор", 
  "Ронанда", "Ошпаз", "Муаллим", "Табиб", "Сартарош", "Рангуборчӣ", 
  "Кафшергар", "Кондиционерсоз", "Автомеханик", "Дигар"
];

export async function findArtisan(input: FindArtisanInput): Promise<FindArtisanOutput> {
  return findArtisanFlow(input);
}

const prompt = ai.definePrompt({
  name: 'findArtisanPrompt',
  input: {schema: FindArtisanInputSchema},
  output: {schema: FindArtisanOutputSchema},
  prompt: `Шумо ёвари ҳуши сунъии платформаи "HUNAR-YOB" ҳастед. 
  Вазифаи шумо: кумак ба мизоҷон барои пайдо кардани устои мувофиқ.
  
  Рӯйхати категорияҳои мавҷуда: ${ALL_CATEGORIES.join(', ')}.
  
  Дархости корбар: "{{{query}}}"
  
  Лутфан ҷавоби кӯтоҳ ва муфид диҳед. Агар дархост ба ягон категория мувофиқ бошад, онро ҳатман зикр кунед.`,
});

const findArtisanFlow = ai.defineFlow(
  {
    name: 'findArtisanFlow',
    inputSchema: FindArtisanInputSchema,
    outputSchema: FindArtisanOutputSchema,
  },
  async input => {
    const {output} = await prompt(input);
    return output!;
  }
);
