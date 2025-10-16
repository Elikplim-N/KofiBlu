import { createApp, serveFrom } from '@genkit-ai/next';
import path from 'path';

// Import flows for side-effects to register them
import '@/ai/flows/suggest-control-profiles';
import '@/ai/flows/suggest-controls-based-on-serial-data';

export const { GET, POST } = createApp({
  serve: serveFrom(path.join(process.cwd(), 'src', 'ai', 'genkit.ts')),
});
