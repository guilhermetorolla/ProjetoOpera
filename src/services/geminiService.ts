import { GoogleGenAI, Type } from "@google/genai";

const ai = new GoogleGenAI({ apiKey: process.env.GEMINI_API_KEY });

// Simple cache to prevent excessive calls
const insightCache: Record<string, { data: any, timestamp: number }> = {};
const CACHE_TTL = 1000 * 60 * 10; // Increased to 10 minutes

// Circuit breaker state
let lastQuotaErrorTime = 0;
const QUOTA_BLOCK_DURATION = 1000 * 60 * 2; // Block for 2 minutes after a 429

export const geminiService = {
  async analyzeProjects(projects: any[], tasks: any[]) {
    const now = Date.now();

    // Circuit breaker check
    if (lastQuotaErrorTime > 0 && (now - lastQuotaErrorTime < QUOTA_BLOCK_DURATION)) {
      console.warn("Gemini API em modo de proteção (quota excedida).");
      return { error: "QUOTA_EXCEEDED", message: "Limite atingido. Motor em repouso." };
    }

    // Generate a simple hash of input to use as cache key
    // We only care about counts and statuses for the summary
    const cacheKey = JSON.stringify({ 
      p: projects.map(p => `${p.id}-${p.status}-${p.progress}`), 
      t: tasks.length 
    });
    
    if (insightCache[cacheKey] && (now - insightCache[cacheKey].timestamp < CACHE_TTL)) {
      return insightCache[cacheKey].data;
    }

    const prompt = `
      Analise o seguinte estado do espaço de trabalho do Opero e forneça 3 insights estratégicos curtos.
      Projetos: ${JSON.stringify(projects.map(p => ({ n: p.name, s: p.status, p: p.progress })))}
      Tarefas: ${JSON.stringify(tasks.slice(0, 5).map(t => ({ ti: t.title, s: t.status })))}
      
      Regras:
      1. Os insights devem ser ultra-curtos (máximo 12 palavras cada).
      2. Foque em risco, produtividade ou prazos.
      3. Use um tom executivo.
      4. Retorne em formato JSON.
    `;

    try {
      const response = await ai.models.generateContent({
        model: "gemini-3-flash-preview", // Using standard flash instead of lite for better stability if lite is unstable
        contents: prompt,
        config: {
          responseMimeType: "application/json",
          responseSchema: {
            type: Type.ARRAY,
            items: {
              type: Type.OBJECT,
              properties: {
                title: { type: Type.STRING },
                insight: { type: Type.STRING },
                level: { type: Type.STRING }
              },
              required: ["title", "insight", "level"]
            }
          }
        }
      });

      const parsed = JSON.parse(response.text || "[]");
      insightCache[cacheKey] = { data: parsed, timestamp: now };
      lastQuotaErrorTime = 0; // Reset on success
      return parsed;
    } catch (error: any) {
      const errorStr = JSON.stringify(error);
      console.error("Erro na análise Gemini:", errorStr);
      
      // Check for quota error in various formats
      if (errorStr.includes("429") || errorStr.includes("RESOURCE_EXHAUSTED") || errorStr.includes("quota")) {
        lastQuotaErrorTime = Date.now();
        return { error: "QUOTA_EXCEEDED", message: "Limite de taxa atingido." };
      }
      
      return [];
    }
  }
};
