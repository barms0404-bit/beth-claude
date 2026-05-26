/**
 * Multi-Model AI Service
 * Routes specialists to Claude, OpenAI, Gemini, or Manus LLM
 * Each specialist has a primary model + optional second opinion
 */

import { invokeLLM } from "./_core/llm";

export type AIModel = "claude" | "openai" | "gemini" | "manus";

// Model assignments — diversify perspectives across models
export const MODEL_ASSIGNMENTS: Record<string, { primary: AIModel; secondary?: AIModel }> = {
  // AI/Thematic Pod — Claude primary (best at nuanced analysis)
  "david-park": { primary: "claude", secondary: "openai" },
  "marcus-chen": { primary: "claude", secondary: "gemini" },
  "elena-vasquez": { primary: "openai", secondary: "claude" },
  "sarah-nakamura": { primary: "gemini", secondary: "claude" },
  "james-okafor": { primary: "openai" },
  "priya-sharma": { primary: "gemini" },
  // Technology Pod — Mix of models
  "michael-torres": { primary: "claude", secondary: "openai" },
  "rachel-kim": { primary: "openai", secondary: "claude" },
  "andrew-walsh": { primary: "gemini", secondary: "openai" },
  "sophia-reyes": { primary: "openai" },
  // Healthcare Pod — Claude primary (best at scientific reasoning)
  "dr-laura-mitchell": { primary: "claude", secondary: "gemini" },
  "dr-nathan-cole": { primary: "claude", secondary: "openai" },
  "dr-kevin-zhao": { primary: "gemini", secondary: "claude" },
  // Consumer Pod
  "catherine-brooks": { primary: "openai" },
  "daniel-ortiz": { primary: "gemini" },
  "jessica-huang": { primary: "openai", secondary: "gemini" },
  // Economic Advisory Pod — Claude primary (best at macro reasoning)
  "dr-robert-kessler": { primary: "claude", secondary: "openai" },
  "victoria-sterling": { primary: "openai", secondary: "claude" },
  "wei-lin": { primary: "gemini", secondary: "claude" },
  "thomas-brennan": { primary: "claude" },
  "patricia-duval": { primary: "openai" },
  "alexander-petrov": { primary: "gemini", secondary: "openai" },
  "maria-santos": { primary: "openai" },
  // Style/Factor Pod
  "richard-callahan": { primary: "claude" },
  "gregory-ashford": { primary: "openai", secondary: "claude" },
  "claire-donovan": { primary: "gemini", secondary: "claude" },
  // Space & Aerospace
  "colonel-derek-hayes": { primary: "claude", secondary: "openai" },
};

export async function callModel(model: AIModel, systemPrompt: string, userPrompt: string): Promise<string> {
  let result: string;
  
  switch (model) {
    case "claude":
    case "manus":
      result = await callManus(systemPrompt, userPrompt);
      break;
    case "openai":
      result = await callOpenAI(systemPrompt, userPrompt);
      break;
    case "gemini":
      result = await callGemini(systemPrompt, userPrompt);
      break;
    default:
      result = await callManus(systemPrompt, userPrompt);
  }

  // Fallback to Manus/Claude if primary model failed
  if (result.includes("unavailable") || result.includes("quota") || result.includes("failed")) {
    console.log(`[MultiModel] ${model} failed, falling back to Manus/Claude`);
    result = await callManus(systemPrompt, userPrompt);
  }

  return result;
}

async function callManus(systemPrompt: string, userPrompt: string): Promise<string> {
  const response = await invokeLLM({
    messages: [
      { role: "system", content: systemPrompt },
      { role: "user", content: userPrompt },
    ],
  });
  const content = response.choices?.[0]?.message?.content;
  return typeof content === "string" ? content : "Research unavailable.";
}

async function callOpenAI(systemPrompt: string, userPrompt: string): Promise<string> {
  const apiKey = process.env.OPENAI_API_KEY;
  if (!apiKey) return "OpenAI API key not configured.";

  try {
    const response = await fetch("https://api.openai.com/v1/chat/completions", {
      method: "POST",
      headers: {
        "Authorization": `Bearer ${apiKey}`,
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        model: "gpt-4o",
        messages: [
          { role: "system", content: systemPrompt },
          { role: "user", content: userPrompt },
        ],
        temperature: 0.2,
        max_tokens: 2000,
      }),
    });

    if (!response.ok) {
      const err = await response.text();
      console.error("[OpenAI] Error:", err);
      return "OpenAI temporarily unavailable.";
    }

    const data = await response.json();
    return data.choices?.[0]?.message?.content || "No response from OpenAI.";
  } catch (error) {
    console.error("[OpenAI] Failed:", error);
    return "OpenAI request failed.";
  }
}

async function callGemini(systemPrompt: string, userPrompt: string): Promise<string> {
  const apiKey = process.env.GEMINI_API_KEY;
  if (!apiKey) return "Gemini API key not configured.";

  try {
    const response = await fetch(
      `https://generativelanguage.googleapis.com/v1beta/models/gemini-2.5-flash:generateContent?key=${apiKey}`,
      {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          contents: [
            { role: "user", parts: [{ text: `${systemPrompt}\n\n${userPrompt}` }] },
          ],
          generationConfig: {
            temperature: 0.2,
            maxOutputTokens: 2000,
          },
        }),
      }
    );

    if (!response.ok) {
      const err = await response.text();
      console.error("[Gemini] Error:", err);
      return "Gemini temporarily unavailable.";
    }

    const data = await response.json();
    return data.candidates?.[0]?.content?.parts?.[0]?.text || "No response from Gemini.";
  } catch (error) {
    console.error("[Gemini] Failed:", error);
    return "Gemini request failed.";
  }
}

export function getModelForSpecialist(slug: string): { primary: AIModel; secondary?: AIModel } {
  return MODEL_ASSIGNMENTS[slug] || { primary: "manus" };
}
