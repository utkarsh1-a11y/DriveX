"use server";

import { createAdminClient } from "@/lib/appwrite";
import { appwriteConfig } from "@/lib/appwrite/config";
import { getCurrentUser } from "@/lib/actions/user.actions";
import { Query } from "node-appwrite";

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

// ─── File content extractor ─────────────────────────────────────────────────

/**
 * Fetches real file content from Appwrite Storage and returns it as a string.
 * Supports: plain text, JSON, CSV, Markdown.
 * For other types (images, video, PDF) returns null so we fall back to
 * filename-based analysis — keeping the function safe for all file types.
 */
async function extractTextContent(
  bucketFileId: string,
  fileType: string,
): Promise<string | null> {
  const TEXT_TYPES = [
    "text/plain",
    "text/csv",
    "text/markdown",
    "application/json",
    "application/xml",
    "text/xml",
    "text/html",
  ];

  const isTextFile = TEXT_TYPES.some((t) => fileType.startsWith(t));
  if (!isTextFile) return null;

  try {
    const { storage } = await createAdminClient();

    // getFileDownload returns the raw file bytes as an ArrayBuffer
    const arrayBuffer = await storage.getFileDownload(
      appwriteConfig.bucketId,
      bucketFileId,
    );

    const text = Buffer.from(arrayBuffer).toString("utf-8");

    // Cap at 6000 chars — enough context for Groq without hitting token limits
    return text.slice(0, 6000);
  } catch (err) {
    console.error("Failed to extract file content:", err);
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

    // Try to read actual file content first
    const fileContent = bucketFileId
      ? await extractTextContent(bucketFileId, fileType)
      : null;

    let systemPrompt: string;
    let userMessage: string;

    if (fileContent) {
      // ── Real content path ──
      systemPrompt = `You are a concise document summarizer. You will be given the actual content of a file.
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

Keep it brief, clear, and professional. Base your analysis on the actual content provided.`;

      userMessage = `Please summarize this file:
- File name: ${fileName}
- File type: ${fileType}

File content:
${fileContent}`;
    } else {
      // ── Fallback: filename-based analysis ──
      systemPrompt = `You are a concise document summarizer. When given a file name and type, provide:
1. A 2-3 sentence summary of what this file likely contains based on its name and type
2. 3-5 key insights or important points as bullet points

Format your response exactly like this:
**Summary**
[your summary here]

**Key Insights**
• [insight 1]
• [insight 2]
• [insight 3]

Keep it brief, clear, and professional.`;

      userMessage = `Please summarize this file:
- File name: ${fileName}
- File type: ${fileType}
- File URL: ${fileUrl}

Analyze based on the filename and type to provide relevant insights.`;
    }

    const result = await callGroq(systemPrompt, userMessage);
    return { success: true, result, usedRealContent: !!fileContent };
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
  documentId?: string, // Appwrite DB document $id — pass this to persist tags
  bucketFileId?: string, // Appwrite Storage file id — used to read real content
) {
  try {
    const currentUser = await getCurrentUser();
    if (!currentUser) throw new Error("Unauthorized");

    // Try to read actual file content for smarter tagging
    const fileContent = bucketFileId
      ? await extractTextContent(bucketFileId, fileType)
      : null;

    const systemPrompt = `You are a smart file tagging system. Generate 5-8 relevant tags for a file.
Return ONLY a JSON array of tags, nothing else. No markdown, no explanation.
Example output: ["invoice", "finance", "2024", "receipt", "payment"]
Tags must be lowercase, single words or short phrases, relevant, and useful for search.`;

    const userMessage = fileContent
      ? `Generate tags for this file:
- File name: ${fileName}
- File type: ${fileType}

File content (first 2000 chars):
${fileContent.slice(0, 2000)}`
      : `Generate tags for this file:
- File name: ${fileName}
- File type: ${fileType}`;

    const result = await callGroq(systemPrompt, userMessage);

    const cleaned = result.replace(/```json|```/g, "").trim();
    const tags: string[] = JSON.parse(cleaned);

    // ── Persist tags to Appwrite if a document ID was provided ──
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
        // Don't fail the whole action if DB write fails — tags still returned to UI
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
// Phase 4 — ready to wire up to AIInsightsModal when you're ready

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
      ? await extractTextContent(bucketFileId, fileType)
      : null;

    const systemPrompt = fileContent
      ? `You are a helpful assistant that answers questions about documents.
Answer using ONLY the information present in the document content provided.
If the answer is not in the document, say "I couldn't find that information in this file."
Be concise — 1-3 sentences unless the question requires more detail.`
      : `You are a helpful assistant. The user is asking about a file but its content could not be read.
Answer based on what you can infer from the filename and file type only.
Be honest that you cannot read the actual content.`;

    const userMessage = fileContent
      ? `Document: ${fileName} (${fileType})

Content:
${fileContent}

Question: ${question}`
      : `File: ${fileName} (${fileType})
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
