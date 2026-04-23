import { GoogleGenAI, Type } from "@google/genai";

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
      return [];
    }

    // Generate a simple hash of input to use as cache key
    const cacheKey = JSON.stringify({ 
      p: projects.map(p => `${p.id}-${p.status}-${p.progress}`), 
      t: tasks.length 
    });
    
    if (insightCache[cacheKey] && (now - insightCache[cacheKey].timestamp < CACHE_TTL)) {
      return insightCache[cacheKey].data;
    }

    try {
      const apiKey = process.env.GEMINI_API_KEY;
      if (!apiKey) {
        console.error("Missing GEMINI_API_KEY");
        return [];
      }

      const ai = new GoogleGenAI({ apiKey });
      
      const prompt = `
        Analise o seguinte estado do espaço de trabalho do Opero e forneça 3 insights estratégicos curtos.
        Projetos: ${JSON.stringify(projects?.map((p: any) => ({ n: p.name, s: p.status, p: p.progress })) || [])}
        Tarefas: ${JSON.stringify(tasks?.slice(0, 5).map((t: any) => ({ ti: t.title, s: t.status })) || [])}
        
        Regras:
        1. Os insights devem ser ultra-curtos (máximo 12 palavras cada).
        2. Foque em risco, produtividade ou prazos.
        3. Use um tom executivo.
        4. Retorne em formato JSON.
      `;

      const response = await ai.models.generateContent({
        model: "gemini-3-flash-preview", 
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
      
      const text = response.text || "[]";
      const parsed = JSON.parse(text);
      
      insightCache[cacheKey] = { data: parsed, timestamp: now };
      return parsed;

    } catch (error: any) {
      console.error("Erro na análise Gemini direta:", error);
      if (error.message?.includes('429')) {
        lastQuotaErrorTime = Date.now();
      }
      return [];
    }
  },
  
  async analyzeReleaseLogs(logs: any[]) {
    try {
      const apiKey = process.env.GEMINI_API_KEY;
      if (!apiKey) {
        console.error("Missing GEMINI_API_KEY");
        return null;
      }

      const ai = new GoogleGenAI({ apiKey });
      
      const prompt = `
        Analise o seguinte histórico de lançamentos (releases) e gere uma retrospectiva de engenharia.
        
        Logs de Release:
        ${JSON.stringify(logs.map(l => ({ 
          version: l.version, 
          features: l.analysis.features, 
          bugs: l.analysis.bugs, 
          infra: l.analysis.infra 
        })))}
        
        Gere um relatório JSON contendo:
        1. "acertos" (Array de strings: Pontos fortes, o que o time fez bem, padrões positivos de feature delivery).
        2. "erros" (Array de strings: Padrões de bugs repetitivos, Gargalos, o que deu errado).
        3. "melhorias" (Array de strings: Sugestões práticas para os próximos ciclos de release).
        4. "conclusao" (String: Um parágrafo curto resumindo a estabilidade e velocidade do time).
      `;

      const response = await ai.models.generateContent({
        model: "gemini-3-flash-preview", 
        contents: prompt,
        config: {
          responseMimeType: "application/json",
          responseSchema: {
            type: Type.OBJECT,
            properties: {
              acertos: { type: Type.ARRAY, items: { type: Type.STRING } },
              erros: { type: Type.ARRAY, items: { type: Type.STRING } },
              melhorias: { type: Type.ARRAY, items: { type: Type.STRING } },
              conclusao: { type: Type.STRING }
            },
            required: ["acertos", "erros", "melhorias", "conclusao"]
          }
        }
      });
      
      const text = response.text;
      return text ? JSON.parse(text) : null;

    } catch (error: any) {
      console.error("Erro na retrospectiva Gemini:", error);
      return null;
    }
  }
};
