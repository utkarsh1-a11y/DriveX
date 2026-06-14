"use server";

import { getCurrentUser } from "@/lib/actions/user.actions";

const GROQ_API_URL = "https://api.groq.com/openai/v1/chat/completions";

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

export async function summarizeFile(
  fileUrl: string,
  fileType: string,
  fileName: string,
) {
  try {
    const currentUser = await getCurrentUser();
    if (!currentUser) throw new Error("Unauthorized");

    const systemPrompt = `You are a concise document summarizer. When given a file name and type, provide:
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

    const userMessage = `Please summarize this file:
- File name: ${fileName}
- File type: ${fileType}
- File URL: ${fileUrl}

Analyze based on the filename and type to provide relevant insights.`;

    const result = await callGroq(systemPrompt, userMessage);
    return { success: true, result };
  } catch (error) {
    console.error("Summarize error:", error);
    return {
      success: false,
      result: "Failed to generate summary. Please try again.",
    };
  }
}

export async function generateTags(
  fileUrl: string,
  fileType: string,
  fileName: string,
) {
  try {
    const currentUser = await getCurrentUser();
    if (!currentUser) throw new Error("Unauthorized");

    const systemPrompt = `You are a smart file tagging system. Generate 5-8 relevant tags for a file based on its name and type.
Return ONLY a JSON array of tags, nothing else. No markdown, no explanation.
Example output: ["invoice", "finance", "2024", "receipt", "payment"]
Tags must be lowercase, relevant, and useful for search and organization.`;

    const userMessage = `Generate tags for this file:
- File name: ${fileName}
- File type: ${fileType}`;

    const result = await callGroq(systemPrompt, userMessage);

    const cleaned = result.replace(/```json|```/g, "").trim();
    const tags: string[] = JSON.parse(cleaned);

    return { success: true, tags };
  } catch (error) {
    console.error("Tags error:", error);
    return { success: false, tags: [] };
  }
}
