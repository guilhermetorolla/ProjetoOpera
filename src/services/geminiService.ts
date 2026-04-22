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

    try {
      const response = await fetch('/api/analyze', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ projects, tasks })
      });

      if (!response.ok) {
        if (response.status === 429) {
          lastQuotaErrorTime = Date.now();
          return { error: "QUOTA_EXCEEDED", message: "Limite de taxa atingido." };
        }
        throw new Error("Failed to fetch from /api/analyze");
      }

      const parsed = await response.json();
      
      // If the backend hits a quota limit or errors out natively
      if (parsed.error === 'QUOTA_EXCEEDED') {
        lastQuotaErrorTime = Date.now();
      } else {
        insightCache[cacheKey] = { data: parsed, timestamp: now };
        lastQuotaErrorTime = 0; // Reset on success
      }
      
      return parsed;

    } catch (error: any) {
      console.error("Erro na análise Gemini via backend:", error);
      return [];
    }
  }
};
