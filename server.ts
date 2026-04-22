import express from "express";
import { createServer as createViteServer } from "vite";
import path from "path";
import { GoogleGenAI, Type } from "@google/genai";

async function startServer() {
  const app = express();
  const PORT = 3000;

  // JSON body parser
  app.use(express.json());

  // Simple API health check
  app.get("/api/health", (req, res) => {
    res.json({ 
      status: "ok", 
      timestamp: new Date().toISOString(),
      message: "Opero Backend subiu com sucesso!"
    });
  });

  // Example API route for initial data
  app.get("/api/init", async (req, res) => {
    res.json({
      environment: process.env.NODE_ENV || 'development',
      features: ['dashboard', 'projects', 'schedule'],
      database: 'supabase'
    });
  });

  // Gemini API Proxy
  app.post("/api/analyze", async (req, res) => {
    try {
      const apiKey = process.env.GEMINI_API_KEY;
      if (!apiKey) {
         return res.status(500).json({ error: "Missing GEMINI_API_KEY on the server." });
      }
      
      const { projects, tasks } = req.body;
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
      
      const parsed = JSON.parse(response.text || "[]");
      res.json(parsed);

    } catch (error: any) {
      console.error("Erro na rota /api/analyze:", error);
      res.status(500).json({ error: error.message || "Failed to analyze" });
    }
  });

  // Vite middleware for development
  if (process.env.NODE_ENV !== "production") {
    console.log("Starting in development mode with Vite middleware...");
    const vite = await createViteServer({
      server: { 
        middlewareMode: true,
        hmr: false // Disabled for agent stability
      },
      appType: "spa",
    });
    app.use(vite.middlewares);
  } else {
    // Production static serving
    const distPath = path.join(process.cwd(), 'dist');
    app.use(express.static(distPath));
    app.get('*', (req, res) => {
      res.sendFile(path.join(distPath, 'index.html'));
    });
  }

  app.listen(PORT, "0.0.0.0", () => {
    console.log(`Server running at http://0.0.0.0:${PORT}`);
  });
}

startServer().catch(err => {
  console.error("Error starting server:", err);
  process.exit(1);
});
