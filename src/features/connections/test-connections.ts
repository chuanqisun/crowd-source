import { GoogleGenAI } from "@google/genai";
import OpenAI from "openai";
import { from, Observable } from "rxjs";
import type { ApiKeys } from "./storage";

export interface TestConnectionRequest {
  provider: "openai" | "gemini" | "github";
  apiKeys: ApiKeys;
}

export function testOpenAIConnection(apiKey: string): Observable<string> {
  const request = async (): Promise<string> => {
    const openai = new OpenAI({
      apiKey,
      dangerouslyAllowBrowser: true,
    });

    const response = await openai.responses.create({
      model: "gpt-5-nano",
      input: "Please respond with exactly 'OpenAI test success!'",
      text: {
        verbosity: "low",
      },
      reasoning: {
        effort: "minimal",
      },
      max_output_tokens: 32,
    });

    if (response.output && response.output.length > 0) {
      const firstMessage = response.output.find((msg) => msg.type === "message");
      if (firstMessage) {
        const content = firstMessage.content[0];
        if (content.type === "output_text") {
          return content.text;
        }
      }
    }

    return "No response received from OpenAI";
  };

  return from(request());
}

export function testGeminiConnection(apiKey: string): Observable<string> {
  const request = async (): Promise<string> => {
    const ai = new GoogleGenAI({
      apiKey,
    });
    const config = {
      thinkingConfig: {
        thinkingBudget: 0,
      },
    };
    const model = "gemini-2.5-flash-lite";
    const contents = [
      {
        role: "user",
        parts: [
          {
            text: "Please respond with exactly 'Gemini test success!'",
          },
        ],
      },
    ];

    const response = await ai.models.generateContentStream({
      model,
      config,
      contents,
    });

    let fullText = "";
    for await (const chunk of response) {
      if (chunk.text) {
        fullText += chunk.text;
      }
    }

    return fullText || "No response received from Gemini";
  };

  return from(request());
}

export function testGitHubConnection(apiKey: string): Observable<string> {
  const request = async (): Promise<string> => {
    const response = await fetch("https://api.github.com/user", {
      headers: {
        Authorization: `token ${apiKey}`,
      },
    });

    if (!response.ok) {
      throw new Error(`GitHub API error: ${response.status} ${response.statusText}`);
    }

    const user = await response.json();
    return `GitHub test success! User: ${user.login}`;
  };

  return from(request());
}

export function testConnection({ provider, apiKeys }: TestConnectionRequest): Observable<string> {
  switch (provider) {
    case "openai":
      if (!apiKeys.openai) {
        throw new Error("OpenAI API key is not set");
      }
      return testOpenAIConnection(apiKeys.openai);

    case "gemini":
      if (!apiKeys.gemini) {
        throw new Error("Gemini API key is not set");
      }
      return testGeminiConnection(apiKeys.gemini);

    case "github":
      if (!apiKeys.github) {
        throw new Error("GitHub API key is not set");
      }
      return testGitHubConnection(apiKeys.github);

    default:
      throw new Error(`Unknown provider: ${provider}`);
  }
}
