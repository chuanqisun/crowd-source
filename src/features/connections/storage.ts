import { BehaviorSubject } from "rxjs";

export interface ApiKeys {
  openai?: string;
  gemini?: string;
  github?: string;
}

const STORAGE_KEY = "moodboard-ai-api-keys";

export const apiKeys$ = new BehaviorSubject<ApiKeys>(loadApiKeys());

export function saveApiKeys(keys: ApiKeys): void {
  localStorage.setItem(STORAGE_KEY, JSON.stringify(keys));
}

export function loadApiKeys(): ApiKeys {
  const stored = localStorage.getItem(STORAGE_KEY);
  return stored ? JSON.parse(stored) : {};
}

export function clearApiKeys(): void {
  localStorage.removeItem(STORAGE_KEY);
}
