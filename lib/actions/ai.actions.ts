"use server";

import { createAdminClient } from "@/lib/appwrite";
import { appwriteConfig } from "@/lib/appwrite/config";
import { getCurrentUser } from "@/lib/actions/user.actions";

// pdf-parse v1.1.1 exports a single function as default
// eslint-disable-next-line @typescript-eslint/no-require-imports
const pdfParse = require("pdf-parse");

const GROQ_API_URL = "https://api.groq.com/openai/v1/chat/completions";

// ─── Groq helper ────────────────────────────────────────────────────────────

async function callGroq(
  systemPrompt: string,
  userMessage: string,
): Promise<string> {
  const apiKey = process.env.GROQ_API_KEY;
  if (!apiKey) throw new Error("GROQ_API_KEY is not set");

  const response = await fetch(GROQ_API_URL, {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      Authorization: `Bearer ${apiKey}`,
    },
    body: JSON.stringify({
      model: "llama-3.3-70b-versatile",
      messages: [
        { role: "system", content: systemPrompt },
        { role: "user", content: userMessage },
      ],
      temperature: 0.3,
      max_tokens: 1024,
    }),
  });

  const data = await response.json();
  if (!response.ok) {
    throw new Error(data?.error?.message || "Groq API error");
  }

  return data.choices?.[0]?.message?.content || "";
}

// ─── Extension-based file type helpers ──────────────────────────────────────
// Appwrite stores file.type as "document", "image", "video" — NOT mime types.
// We use the file extension to determine how to read the file.

const PDF_EXTENSIONS = ["pdf"];

const TEXT_EXTENSIONS = [
  "txt",
  "md",
  "markdown",
  "csv",
  "json",
  "xml",
  "html",
  "htm",
  "yaml",
  "yml",
  "toml",
  "ini",
  "log",
  "ts",
  "tsx",
  "js",
  "jsx",
  "py",
  "java",
  "c",
  "cpp",
  "cs",
  "go",
  "rb",
  "php",
  "sh",
  "sql",
];

function getExtension(fileName: string): string {
  return fileName.split(".").pop()?.toLowerCase() ?? "";
}

function isPdf(fileName: string): boolean {
  return PDF_EXTENSIONS.includes(getExtension(fileName));
}

function isTextReadable(fileName: string): boolean {
  return TEXT_EXTENSIONS.includes(getExtension(fileName));
}

function isReadable(fileName: string): boolean {
  return isPdf(fileName) || isTextReadable(fileName);
}

// ─── File content extractor ─────────────────────────────────────────────────

async function extractTextContent(
  bucketFileId: string,
  fileName: string,
): Promise<string | null> {
  if (!isReadable(fileName)) {
    console.log(`[AI] Skipping unreadable file: ${fileName}`);
    return null;
  }

  try {
    const { storage } = await createAdminClient();

    const arrayBuffer = await storage.getFileDownload(
      appwriteConfig.bucketId,
      bucketFileId,
    );

    const buffer = Buffer.from(arrayBuffer);

    if (isPdf(fileName)) {
      try {
        const data = await pdfParse(buffer);
        const text = data.text?.trim();
        if (!text) return null;
        console.log(`[AI] PDF extracted ${text.length} chars from ${fileName}`);
        return text.slice(0, 6000);
      } catch (err) {
        console.error("[AI] PDF parsing failed:", err);
        return null;
      }
    }

    // Plain text, CSV, JSON, code files etc.
    const text = buffer.toString("utf-8").trim();
    console.log(`[AI] Text extracted ${text.length} chars from ${fileName}`);
    return text.slice(0, 6000);
  } catch (err) {
    console.error("[AI] Failed to extract file content:", err);
    return null;
  }
}

// ─── Summarize ───────────────────────────────────────────────────────────────

export async function summarizeFile(
  fileUrl: string,
  fileType: string,
  fileName: string,
  bucketFileId?: string,
) {
  try {
    const currentUser = await getCurrentUser();
    if (!currentUser) throw new Error("Unauthorized");

    const fileContent = bucketFileId
      ? await extractTextContent(bucketFileId, fileName)
      : null;

    if (!fileContent) {
      return {
        success: false,
        result:
          "Could not read this file's content. AI Summary works with PDF, TXT, CSV, JSON, Markdown, and code files. Images, videos, and audio are not supported.",
        usedRealContent: false,
      };
    }

    const systemPrompt = `You are a concise document summarizer. You will be given the actual content of a file.
Provide:
1. A 2-3 sentence summary of what this file contains
2. 3-5 key insights or important points as bullet points

Format your response exactly like this:
**Summary**
[your summary here]

**Key Insights**
• [insight 1]
• [insight 2]
• [insight 3]

Keep it brief, clear, and professional. Base your analysis ONLY on the actual content provided. Do not guess or make assumptions.`;

    const userMessage = `Please summarize this file:
- File name: ${fileName}

File content:
${fileContent}`;

    const result = await callGroq(systemPrompt, userMessage);
    return { success: true, result, usedRealContent: true };
  } catch (error) {
    console.error("Summarize error:", error);
    return {
      success: false,
      result: "Failed to generate summary. Please try again.",
      usedRealContent: false,
    };
  }
}

// ─── Generate & persist tags ─────────────────────────────────────────────────

export async function generateTags(
  fileUrl: string,
  fileType: string,
  fileName: string,
  documentId?: string,
  bucketFileId?: string,
) {
  try {
    const currentUser = await getCurrentUser();
    if (!currentUser) throw new Error("Unauthorized");

    const fileContent = bucketFileId
      ? await extractTextContent(bucketFileId, fileName)
      : null;

    const systemPrompt = `You are a smart file tagging system. Generate 5-8 relevant tags for a file.
Return ONLY a JSON array of tags, nothing else. No markdown, no explanation.
Example output: ["invoice", "finance", "2024", "receipt", "payment"]
Tags must be lowercase, single words or short phrases, relevant, and useful for search.`;

    const userMessage = fileContent
      ? `Generate tags for this file based on its actual content:
- File name: ${fileName}

File content (first 2000 chars):
${fileContent.slice(0, 2000)}`
      : `Generate tags for this file based on its name only:
- File name: ${fileName}
- File type: ${fileType}`;

    const result = await callGroq(systemPrompt, userMessage);

    const cleaned = result.replace(/```json|```/g, "").trim();
    const tags: string[] = JSON.parse(cleaned);

    if (documentId) {
      try {
        const { databases } = await createAdminClient();
        await databases.updateDocument(
          appwriteConfig.databaseId,
          appwriteConfig.filesCollectionId,
          documentId,
          { tags },
        );
      } catch (dbError) {
        console.error("Failed to persist tags to Appwrite:", dbError);
      }
    }

    return { success: true, tags };
  } catch (error) {
    console.error("Tags error:", error);
    return { success: false, tags: [] };
  }
}

// ─── Ask your file ───────────────────────────────────────────────────────────

export async function askFile(
  question: string,
  fileType: string,
  fileName: string,
  bucketFileId?: string,
) {
  try {
    const currentUser = await getCurrentUser();
    if (!currentUser) throw new Error("Unauthorized");

    const fileContent = bucketFileId
      ? await extractTextContent(bucketFileId, fileName)
      : null;

    if (!fileContent) {
      return {
        success: true,
        result:
          "I can't read the content of this file. Ask File works with PDF, TXT, CSV, JSON, Markdown, and code files. Images, videos, and audio files are not supported.",
      };
    }

    const systemPrompt = `You are a helpful assistant that answers questions about documents.
Answer using ONLY the information present in the document content provided below.
If the answer is not found in the document, say exactly: "I couldn't find that information in this file."
Do NOT guess, assume, or use any outside knowledge.
Be concise — 1-3 sentences unless the question requires more detail.`;

    const userMessage = `Document: ${fileName}

Content:
${fileContent}

Question: ${question}`;

    const result = await callGroq(systemPrompt, userMessage);
    return { success: true, result };
  } catch (error) {
    console.error("Ask file error:", error);
    return {
      success: false,
      result: "Failed to answer your question. Please try again.",
    };
  }
}
