import express from "express";
import path from "path";
import { createServer as createViteServer } from "vite";
import { GoogleGenAI, Type } from "@google/genai";
import dotenv from "dotenv";
import { embeddedThemes, getSampleWords } from "./src/themesData";

// Load environment variables
dotenv.config();

// Lazy initialization of Gemini API client
let aiClient: GoogleGenAI | null = null;
function getGeminiClient(): GoogleGenAI {
  if (!aiClient) {
    const apiKey = process.env.GEMINI_API_KEY;
    if (!apiKey) {
      throw new Error("GEMINI_API_KEY environment variable is not defined");
    }
    aiClient = new GoogleGenAI({
      apiKey: apiKey,
      httpOptions: {
        headers: {
          "User-Agent": "aistudio-build",
        },
      },
    });
  }
  return aiClient;
}

// Helper to implement retry and fallback model strategy for Gemini API
async function generateWordsWithAI(prompt: string, wordCount: number): Promise<any> {
  const client = getGeminiClient();
  const modelsToTry = ["gemini-3.5-flash", "gemini-3.1-flash-lite"];
  let lastError: any = null;

  for (const model of modelsToTry) {
    for (let attempt = 1; attempt <= 2; attempt++) {
      try {
        console.log(`[Gemini] Tentando gerar com o modelo ${model} (tentativa ${attempt}/2)...`);
        const response = await client.models.generateContent({
          model: model,
          contents: prompt,
          config: {
            responseMimeType: "application/json",
            responseSchema: {
              type: Type.OBJECT,
              properties: {
                words: {
                  type: Type.ARRAY,
                  items: {
                    type: Type.STRING,
                  },
                  description: `A lista de exatamente ${wordCount} palavras relacionadas ao tema`
                },
                themeFormatted: {
                  type: Type.STRING,
                  description: "O tema original limpo e formatado de forma bonita"
                }
              },
              required: ["words", "themeFormatted"],
            },
          },
        });

        const responseText = response.text?.trim();
        if (!responseText) {
          throw new Error("Resposta de texto vazia.");
        }

        const parsedData = JSON.parse(responseText);
        if (!parsedData.words || !Array.isArray(parsedData.words) || parsedData.words.length === 0) {
          throw new Error("Formato de resposta inválido.");
        }

        console.log(`[Gemini] Sucesso ao gerar com o modelo ${model} na tentativa ${attempt}!`);
        return parsedData;
      } catch (err: any) {
        lastError = err;
        console.warn(`[Gemini] Falha com modelo ${model} (tentativa ${attempt}):`, err.message || err);
        // Wait 300ms before retrying
        await new Promise((resolve) => setTimeout(resolve, 300));
      }
    }
  }

  throw lastError || new Error("Todos os modelos de IA falharam.");
}

// Helper to fuzzy match an entered theme to one of our 10 embedded high quality themes
function matchOfflineTheme(themeName: string): string | null {
  const normalized = themeName
    .toUpperCase()
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "")
    .replace(/[^A-Z]/g, " ")
    .replace(/\s+/g, " ")
    .trim();

  // Keyword associations for our 10 embedded categories
  const keywords: Record<string, string[]> = {
    ANIMAIS: ["ANIMAL", "CAO", "GATO", "BALEIA", "LEAO", "BICHO", "ANIMALS", "PET", "ZOOLOGICO", "FAUNA", "SELVA", "SAURO", "CACHORRO", "PASSARO", "INSETO", "PEIXE"],
    FRUTAS: ["FRUTA", "MACA", "LARANJA", "BANANA", "UVA", "SALADA DE FRUTA", "FRUIT", "SOBREMESA", "ALIMENTO", "MORANGO", "ABACAXI", "DOCE", "MELANCIA"],
    PAISES: ["PAIS", "ESTADO", "BRASIL", "ALEMANHA", "EUA", "EUROPA", "AMERICA", "NACAO", "NACION", "MONDO", "MAPA", "GEOGRAFIA", "PORTUGAL", "FRANCA", "JAPAO"],
    PROFISSOES: ["PROFISSAO", "TRABALHO", "EMPREGO", "MEDICO", "ADVOGADO", "ENGINEER", "CARREIRA", "VAGA", "OFICIO"],
    TECNOLOGIA: ["TECNOLOGIA", "COMPUTADOR", "SOFTWARE", "NET", "WEB", "CELULAR", "AI", "IA", "TECH", "DIGITAL", "DADOS", "ALGORITMO", "SISTEMA", "ROBO", "VIDEO"],
    ESPORTES: ["ESPORTE", "FUTEBOL", "JOGO", "BASQUETE", "TENIS", "CORRIDA", "SPORTS", "RECREACAO", "ATLETA", "NATACAO", "GINASTICA", "CORRE"],
    MUSICA: ["MUSICA", "CANTOR", "MELODIA", "BANDA", "SONG", "MUSIC", "INSTRUMENTO", "ROCK", "POP", "CANCAO", "SOM", "AUDIO", "SHOW"],
    FILMES: ["FILME", "CINEMA", "DIRETOR", "OSCAR", "MOVIE", "HOLLYWOOD", "SERIE", "ATORES", "ROTEIRO", "PRODUTORA", "PIPOCA", "CLAQUETE"],
    CIENCIAS: ["CIENCIA", "ATOMO", "BIOLOGIA", "FISICA", "QUIMICA", "SCIENCE", "PLANETA", "ESPACO", "UNIVERSO", "LABORATORIO", "PESQUISA", "ESTUDO", "VACINA"],
    VEICULOS: ["VEICULO", "CARRO", "AVIAO", "MOTO", "ONIBUS", "TRANSPORTE", "VAGAO", "ESTRADA", "VIAGEM", "FREIO", "BARCO", "MOTOR"]
  };

  for (const [theme, list] of Object.entries(keywords)) {
    // Check if whole term is close
    if (normalized.includes(theme) || theme.includes(normalized)) {
      return theme;
    }
    for (const kw of list) {
      if (normalized.includes(kw) || kw.includes(normalized)) {
        return theme;
      }
    }
  }
  return null;
}

async function startServer() {
  const app = express();
  const PORT = 3000;

  // Middleware to support JSON request bodies
  app.use(express.json());

  // API Route: Check visual connectivity state and server status
  app.get("/api/health", (req, res) => {
    res.json({ status: "ok", mode: process.env.NODE_ENV });
  });

  // API Route: Generate words via Gemini for a theme when online
  app.post("/api/generate-words", async (req, res) => {
    const { theme, difficulty } = req.body;
    if (!theme) {
      return res.status(400).json({ error: "O tema é obrigatório." });
    }

    // Default counts per difficulty: Fácil (8), Médio (15), Difícil (25)
    let wordCount = 8;
    if (difficulty === "medio") {
      wordCount = 15;
    } else if (difficulty === "dificil") {
      wordCount = 25;
    }

    // Check if we can initialize Gemini client
    let hasAI = false;
    try {
      getGeminiClient();
      hasAI = true;
    } catch (err: any) {
      console.warn("[Server] Chave de API indisponível, usando fallback embutido:", err.message);
    }

    if (hasAI) {
      try {
        const prompt = `Gere exatamente ${wordCount} palavras em português que estejam intimamente relacionadas com o tema "${theme}".
Regras estritas:
1. Cada palavra deve possuir entre 4 e 15 letras.
2. NÃO use acentos, hifens, espaços, cedilhas ou caracteres especiais. Remova qualquer acentuação (ex: de "ÁGUA" para "AGUA", "MAÇÃ" para "MACA", "GUARDA-CHUVA" para "GUARDACHUVA").
3. A lista deve possuir exatamente ${wordCount} palavras únicas.
4. Não use palavras ofensivas, impróprias ou obscenas.
5. Retorne as palavras em CAIXA ALTA (maiúsculas).`;

        const parsedData = await generateWordsWithAI(prompt, wordCount);
        
        // Clean words backend-side just to be extremely secure
        const cleanedWords = (parsedData.words || [])
          .map((w: string) => {
            return w
              .toUpperCase()
              .normalize("NFD")
              .replace(/[\u0300-\u036f]/g, "") // remove accents
              .replace(/Ç/g, "C")
              .replace(/[^A-Z]/g, "") // remove anything non A-Z
              .trim();
          })
          .filter((w: string) => w.length >= 4 && w.length <= 15);

        if (cleanedWords.length > 0) {
          return res.json({
            success: true,
            words: cleanedWords,
            theme: parsedData.themeFormatted || theme,
          });
        }
        throw new Error("Nenhuma palavra válida gerada pelo modelo.");
      } catch (error: any) {
        console.error("Gemini failed after all attempts. Falling back to semantic matching.", error.message);
      }
    }

    // Trigger Server side automatic fallback to local semantic match or random high quality theme
    const matchedTheme = matchOfflineTheme(theme);
    if (matchedTheme) {
      console.log(`[Server Offline Fallback] Tema embutido correspondente: "${matchedTheme}" para "${theme}"`);
      const fallbackWords = getSampleWords(matchedTheme, wordCount);
      return res.json({
        success: true,
        words: fallbackWords,
        theme: `${theme.toUpperCase()} (Offline: ${matchedTheme})`,
        fallback: true
      });
    } else {
      // Pick a random embedded theme
      const themesList = Object.keys(embeddedThemes);
      const randomTheme = themesList[Math.floor(Math.random() * themesList.length)];
      console.log(`[Server Offline Fallback] Nenhum tema correspondente. Utilizando random: "${randomTheme}" para "${theme}"`);
      const fallbackWords = getSampleWords(randomTheme, wordCount);
      return res.json({
        success: true,
        words: fallbackWords,
        theme: `${theme.toUpperCase()} (Offline: ${randomTheme})`,
        fallback: true
      });
    }
  });

  // Vite middleware or Static files
  if (process.env.NODE_ENV !== "production") {
    const vite = await createViteServer({
      server: { middlewareMode: true },
      appType: "spa",
    });
    app.use(vite.middlewares);
  } else {
    const distPath = path.join(process.cwd(), "dist");
    app.use(express.static(distPath));
    app.get("*", (req, res) => {
      res.sendFile(path.join(distPath, "index.html"));
    });
  }

  app.listen(PORT, "0.0.0.0", () => {
    console.log(`[e-Spiando Palavras] Servidor rodando na porta ${PORT} em modo ${process.env.NODE_ENV || "dev"}`);
  });
}

startServer();
