import { Router } from "express";
import { requireAuth, type AuthenticatedRequest } from "../lib/requireAuth.js";

const router = Router();

const SYSTEM_CONTEXT = "System-Kontext: Du bist CLYVEN AI, ein intelligenter Assistent für Notizen, Journaling und Produktivität.";

interface GeminiPart {
  text: string;
}

interface GeminiContent {
  role?: "user" | "model";
  parts: GeminiPart[];
}

async function callGeminiApi(contents: GeminiContent[]): Promise<string> {
  const apiKey = process.env.GEMINI_API_KEY || process.env.GOOGLE_AI_API_KEY;
  if (!apiKey) {
    const err = new Error("GEMINI_API_KEY environment variable is missing.");
    console.error("Gemini API Error:", err);
    throw new Error("Fehler bei der Verarbeitung über die Gemini API");
  }

  try {
    const response = await fetch(
      `https://generativelanguage.googleapis.com/v1beta/models/gemini-1.5-flash:generateContent?key=${apiKey}`,
      {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ contents }),
      }
    );

    if (!response.ok) {
      const errorText = await response.text();
      const err = new Error(`Gemini API returned status ${response.status}: ${errorText}`);
      console.error("Gemini API Error:", err);
      throw new Error("Fehler bei der Verarbeitung über die Gemini API");
    }

    const data = (await response.json()) as any;
    const generatedText = data?.candidates?.[0]?.content?.parts?.[0]?.text;

    if (!generatedText) {
      const err = new Error("No text content found in Gemini API response.");
      console.error("Gemini API Error:", err);
      throw new Error("Fehler bei der Verarbeitung über die Gemini API");
    }

    return generatedText.trim();
  } catch (error: any) {
    if (error.message !== "Fehler bei der Verarbeitung über die Gemini API") {
      console.error("Gemini API Error:", error);
    }
    throw new Error("Fehler bei der Verarbeitung über die Gemini API");
  }
}

// POST /api/ai/journal-summary
router.post("/journal-summary", requireAuth, async (req, res) => {
  const authReq = req as AuthenticatedRequest;

  // Server-Side Premium Gate
  if (!authReq.isPremium) {
    return res.status(403).json({
      error: "PREMIUM_REQUIRED",
      message: "Schalte CLYVEN AI mit CLYVEN PLUS frei",
    });
  }

  try {
    const { entries = [] } = req.body;
    const entriesText = JSON.stringify(entries, null, 2);

    const userQuery = `Analysiere die folgenden Journal-Einträge und erstelle eine prägnante wöchentliche Zusammenfassung mit Mood-Trend und konkreten Empfehlungen:\n\n${entriesText}`;

    const summary = await callGeminiApi([
      {
        role: "user",
        parts: [{ text: `${SYSTEM_CONTEXT}\n\nUser Anfrage: ${userQuery}` }],
      },
    ]);

    res.json({ success: true, summary });
  } catch (err: any) {
    res.status(500).json({ error: "AI_GENERATION_FAILED", message: "Fehler bei der Verarbeitung über die Gemini API" });
  }
});

// POST /api/ai/chat
router.post("/chat", requireAuth, async (req, res) => {
  const authReq = req as AuthenticatedRequest;

  // Server-Side Premium Gate
  if (!authReq.isPremium) {
    return res.status(403).json({
      error: "PREMIUM_REQUIRED",
      message: "Nutze CLYVEN AI mit CLYVEN PLUS",
    });
  }

  try {
    const { message = "", messages = [], noteContext = "" } = req.body;

    const userPrompt = message || (messages.length > 0 ? messages[messages.length - 1].content : "");
    if (!userPrompt) {
      return res.status(400).json({ error: "MESSAGE_REQUIRED", message: "Eine Nachricht ist erforderlich." });
    }

    const contents: GeminiContent[] = [];

    // Process chat history if provided
    if (Array.isArray(messages) && messages.length > 0) {
      let hasFirstUser = false;
      for (const m of messages) {
        if (!m.content) continue;
        const role: "user" | "model" = m.role === "assistant" || m.role === "model" ? "model" : "user";
        if (!hasFirstUser && role === "model") {
          continue;
        }
        hasFirstUser = true;

        if (contents.length > 0 && contents[contents.length - 1].role === role) {
          contents[contents.length - 1].parts[0].text += `\n${m.content}`;
        } else {
          contents.push({ role, parts: [{ text: m.content }] });
        }
      }
    }

    // Format note context if active
    let currentPrompt = userPrompt;
    if (noteContext && noteContext.trim()) {
      currentPrompt = `Kontext der aktuellen Notiz:\n---\n${noteContext.trim()}\n---\n\nFrage dazu: ${userPrompt}`;
    }

    if (contents.length === 0) {
      contents.push({
        role: "user",
        parts: [{ text: `${SYSTEM_CONTEXT}\n\nUser Anfrage: ${currentPrompt}` }],
      });
    } else {
      if (contents[0].role === "user") {
        contents[0].parts[0].text = `${SYSTEM_CONTEXT}\n\n${contents[0].parts[0].text}`;
      }
      if (contents[contents.length - 1].role === "user") {
        contents[contents.length - 1].parts[0].text += `\n\nUser Anfrage: ${currentPrompt}`;
      } else {
        contents.push({
          role: "user",
          parts: [{ text: `User Anfrage: ${currentPrompt}` }],
        });
      }
    }

    const responseText = await callGeminiApi(contents);

    res.json({
      success: true,
      message: {
        role: "assistant",
        content: responseText,
        timestamp: new Date().toISOString(),
      },
    });
  } catch (err: any) {
    res.status(500).json({ error: "AI_CHAT_FAILED", message: "Fehler bei der Verarbeitung über die Gemini API" });
  }
});

// POST /api/ai/notes-assistant
router.post("/notes-assistant", requireAuth, async (req, res) => {
  const authReq = req as AuthenticatedRequest;

  // Server-Side Premium Gate
  if (!authReq.isPremium) {
    return res.status(403).json({
      error: "PREMIUM_REQUIRED",
      message: "Schalte CLYVEN AI mit CLYVEN PLUS frei",
    });
  }

  try {
    const { action, text = "" } = req.body;

    let instruction = "Du bist ein intelligenter Schreib- und Notiz-Assistent.";
    if (action === "fix_spelling") {
      instruction = "Korrigiere Rechtschreibung, Grammatik und Satzbau im folgenden Text. Gib nur den korrigierten Text zurück.";
    } else if (action === "summarize") {
      instruction = "Erstelle eine prägnante Zusammenfassung (3-4 Bulletpoints) des folgenden Textes.";
    } else if (action === "todo_list") {
      instruction = "Extrahiere konkrete To-Do-Punkte aus dem Notiztext und formatiere sie als Markdown-Checkliste (- [ ] Task).";
    }

    const userQuery = `${instruction}\n\nText:\n${text}`;

    const result = await callGeminiApi([
      {
        role: "user",
        parts: [{ text: `${SYSTEM_CONTEXT}\n\nUser Anfrage: ${userQuery}` }],
      },
    ]);

    res.json({ success: true, result, action });
  } catch (err: any) {
    res.status(500).json({ error: "AI_GENERATION_FAILED", message: "Fehler bei der Verarbeitung über die Gemini API" });
  }
});

export default router;
