import dotenv from 'dotenv';
import express from 'express';
import path from 'path';
import { fileURLToPath } from 'url';
import { createServer as createViteServer } from 'vite';
import { GoogleGenAI, Type } from '@google/genai';

dotenv.config();

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

function getGenAIClient(): GoogleGenAI | null {
  const apiKey = process.env.GEMINI_API_KEY;
  if (!apiKey || apiKey === 'MY_GEMINI_API_KEY') {
    return null;
  }
  return new GoogleGenAI({
    apiKey,
    httpOptions: {
      headers: {
        'User-Agent': 'aistudio-build',
      },
    },
  });
}

async function startServer() {
  const app = express();
  const PORT = 3000;

  app.use(express.json({ limit: '15mb' }));

  // Live Web-Grounding & Temporal Delta Watchtower endpoint
  app.post('/api/watchtower/delta', async (req, res) => {
    try {
      const { entityName, jurisdiction, mai, fri, sourceIndexCsv, executiveSummary } = req.body;
      const ai = getGenAIClient();

      if (!ai) {
        return res.status(200).json({
          grounded: false,
          reason: 'Using deterministic statutory ledger baseline (configure GEMINI_API_KEY in Secrets for live Google Search grounding).',
          items: null,
        });
      }

      const prompt = `You are the Sovereign Temporal Delta Watchtower auditing an investigative intelligence cartridge for "${entityName}" (Jurisdiction: ${jurisdiction}, Baseline MAI: ${mai}, Baseline FRI: ${fri}).

Cached 08_SOURCE_INDEX.csv from archive:
${(sourceIndexCsv || '').slice(0, 2000)}

Executive Summary excerpt:
${(executiveSummary || '').slice(0, 1200)}

Execute live search grounding to check for recent regulatory filings, antitrust dockets, statutory disclosures, or governance updates involving ${entityName}.
Return a strictly valid JSON object with the following fields:
- summary: string (2-3 sentences summarizing temporal risk drift since archive creation)
- deltaMai: number (between -0.08 and +0.09)
- deltaFri: number (between -0.08 and +0.09)
- events: array of 3-4 objects, each with:
  - id: string
  - date: string (YYYY-MM-DD)
  - sourceAuthority: string (e.g., SEC EDGAR, DOJ Antitrust, EU DMA Commission, SAMR / MOST China, GitHub Advisory)
  - title: string
  - finding: string
  - impactOnMai: number
  - impactOnFri: number
  - verificationStatus: "CONFIRMED_FILING" | "ACTIVE_DOCKET" | "SILENT_RETRACTION" | "COMPLIANCE_AMENDMENT"
  - sourceUrl: string`;

      const response = await ai.models.generateContent({
        model: 'gemini-3.8-flash',
        contents: prompt,
        config: {
          tools: [{ googleSearch: {} }],
          responseMimeType: 'application/json',
          responseSchema: {
            type: Type.OBJECT,
            properties: {
              summary: { type: Type.STRING },
              deltaMai: { type: Type.NUMBER },
              deltaFri: { type: Type.NUMBER },
              events: {
                type: Type.ARRAY,
                items: {
                  type: Type.OBJECT,
                  properties: {
                    id: { type: Type.STRING },
                    date: { type: Type.STRING },
                    sourceAuthority: { type: Type.STRING },
                    title: { type: Type.STRING },
                    finding: { type: Type.STRING },
                    impactOnMai: { type: Type.NUMBER },
                    impactOnFri: { type: Type.NUMBER },
                    verificationStatus: { type: Type.STRING },
                    sourceUrl: { type: Type.STRING },
                  },
                  required: [
                    'id',
                    'date',
                    'sourceAuthority',
                    'title',
                    'finding',
                    'impactOnMai',
                    'impactOnFri',
                    'verificationStatus',
                  ],
                },
              },
            },
            required: ['summary', 'deltaMai', 'deltaFri', 'events'],
          },
        },
      });

      const rawText = response.text || '{}';
      const parsed = JSON.parse(rawText);
      return res.json({
        grounded: true,
        data: parsed,
      });
    } catch (error: unknown) {
      const errMsg = error instanceof Error ? error.message : String(error);
      return res.status(200).json({
        grounded: false,
        reason: `Live grounding fallback active: ${errMsg}`,
        items: null,
      });
    }
  });

  // Multi-Voice Neural TTS Executive Briefing Studio endpoint
  app.post('/api/briefing/tts', async (req, res) => {
    try {
      const { turns } = req.body as {
        turns: Array<{ speaker: 'Prosecutor' | 'Defense'; text: string }>;
      };

      const ai = getGenAIClient();
      if (!ai) {
        return res.status(400).json({
          error: 'GEMINI_API_KEY is not configured for neural WAV synthesis. Using browser neural speech synthesizer.',
        });
      }

      const parts = (turns || []).map((t) => ({
        text: `${t.speaker}: ${t.text}`,
        speechMetadata: {
          speaker: t.speaker,
          style:
            t.speaker === 'Prosecutor'
              ? 'Authoritative, incisive sovereign lead prosecutor'
              : 'Measured, precise institutional defense counsel',
        },
      }));

      const response = await ai.models.generateContent({
        model: 'gemini-3.8-flash-tts',
        contents: [
          {
            role: 'user',
            parts,
          },
        ],
        config: {
          responseModalities: ['AUDIO'],
          speechConfig: {
            multiSpeakerVoiceConfig: {
              speakerVoiceConfigs: [
                {
                  speaker: 'Prosecutor',
                  voiceConfig: {
                    prebuiltVoiceConfig: { voiceName: 'Fenrir' },
                  },
                },
                {
                  speaker: 'Defense',
                  voiceConfig: {
                    prebuiltVoiceConfig: { voiceName: 'Kore' },
                  },
                },
              ],
            },
          },
        },
      });

      const base64Audio =
        response.candidates?.[0]?.content?.parts?.[0]?.inlineData?.data;

      if (!base64Audio) {
        return res.status(502).json({
          error: 'No audio payload returned from gemini-3.8-flash-tts.',
        });
      }

      return res.json({
        audioBase64: base64Audio,
        mimeType: 'audio/wav',
      });
    } catch (error: unknown) {
      const errMsg = error instanceof Error ? error.message : String(error);
      return res.status(500).json({
        error: errMsg,
      });
    }
  });

  if (process.env.NODE_ENV !== 'production') {
    const vite = await createViteServer({
      server: { middlewareMode: true },
      appType: 'spa',
    });
    app.use(vite.middlewares);
  } else {
    const distPath = path.join(__dirname, 'dist');
    app.use(express.static(distPath));
    app.get('*', (_req, res) => {
      res.sendFile(path.join(distPath, 'index.html'));
    });
  }

  app.listen(PORT, '0.0.0.0', () => {
    console.log(`Sovereign Tribunal & Crucible Server listening on http://localhost:${PORT}`);
  });
}

startServer();
