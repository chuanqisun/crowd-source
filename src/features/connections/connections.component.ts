import { html } from "lit-html";
import { BehaviorSubject, Subject, ignoreElements, map, merge, of } from "rxjs";
import { catchError, debounceTime, distinctUntilChanged, mergeMap, startWith, tap } from "rxjs/operators";
import { createComponent } from "../../sdk/create-component";
import { observe } from "../../sdk/observe-directive";
import "./connections.component.css";
import { loadApiKeys, saveApiKeys, type ApiKeys } from "./storage";
import { testConnection } from "./test-connections";

export interface ConnectionsComponentProps {
  apiKeys$: BehaviorSubject<ApiKeys>;
}

export const apiKeys$ = new BehaviorSubject<ApiKeys>(loadApiKeys());

export const ConnectionsComponent = createComponent(() => {
  // 1. Internal state
  const testResults$ = new BehaviorSubject<{ openai?: string; gemini?: string; github?: string }>({});
  const testErrors$ = new BehaviorSubject<{ openai?: string; gemini?: string; github?: string }>({});
  const testLoading$ = new BehaviorSubject<{ openai?: boolean; gemini?: boolean; github?: boolean }>({});

  // 2. Actions (user interactions)
  const apiKeyChange$ = new Subject<{ provider: keyof ApiKeys; value: string }>();
  const testConnection$ = new Subject<{ provider: "openai" | "gemini" | "github" }>();

  // 3. Effects (state changes)
  const persistKeys$ = apiKeyChange$.pipe(
    debounceTime(300),
    distinctUntilChanged((a, b) => a.provider === b.provider && a.value === b.value),
    tap(({ provider, value }) => {
      const currentKeys = apiKeys$.value;
      const updatedKeys = { ...currentKeys, [provider]: value };
      apiKeys$.next(updatedKeys);
      saveApiKeys(updatedKeys);
    })
  );

  const handleTestConnection$ = testConnection$.pipe(
    tap(({ provider }) => {
      const currentLoading = testLoading$.value;
      testLoading$.next({ ...currentLoading, [provider]: true });
    }),
    mergeMap(({ provider }) =>
      testConnection({
        provider,
        apiKeys: apiKeys$.value,
      }).pipe(
        tap((result) => {
          const currentResults = testResults$.value;
          const currentErrors = testErrors$.value;
          const currentLoading = testLoading$.value;
          testResults$.next({ ...currentResults, [provider]: result });
          testErrors$.next({ ...currentErrors, [provider]: undefined });
          testLoading$.next({ ...currentLoading, [provider]: false });
        }),
        catchError((error) => {
          const currentResults = testResults$.value;
          const currentErrors = testErrors$.value;
          const currentLoading = testLoading$.value;
          testResults$.next({ ...currentResults, [provider]: undefined });
          testErrors$.next({ ...currentErrors, [provider]: error.message });
          testLoading$.next({ ...currentLoading, [provider]: false });
          return of(null);
        })
      )
    )
  );

  // Helper functions
  const clearTestResults = (provider: keyof ApiKeys) => {
    const currentResults = testResults$.value;
    const currentErrors = testErrors$.value;
    testResults$.next({ ...currentResults, [provider]: undefined });
    testErrors$.next({ ...currentErrors, [provider]: undefined });
  };

  const handleOpenAIChange = (e: Event) => {
    const input = e.target as HTMLInputElement;
    apiKeyChange$.next({ provider: "openai", value: input.value });
    clearTestResults("openai");
  };

  const handleGitHubChange = (e: Event) => {
    const input = e.target as HTMLInputElement;
    apiKeyChange$.next({ provider: "github", value: input.value });
    clearTestResults("github");
  };

  const handleTestSubmit = (e: Event) => {
    e.preventDefault();

    const currentApiKeys = apiKeys$.value;
    // Test OpenAI first
    if (currentApiKeys.openai) {
      testConnection$.next({ provider: "openai" });
    }

    // Then test Gemini
    if (currentApiKeys.gemini) {
      testConnection$.next({ provider: "gemini" });
    }

    // Then test GitHub
    if (currentApiKeys.github) {
      testConnection$.next({ provider: "github" });
    }
  };

  // Derived observables for template
  const isDisabled$ = testLoading$.pipe(
    mergeMap((loading) =>
      apiKeys$.pipe(map((apiKeys) => loading.openai || loading.gemini || loading.github || (!apiKeys.openai && !apiKeys.gemini && !apiKeys.github)))
    )
  );

  const buttonText$ = testLoading$.pipe(map((loading) => (loading.openai || loading.gemini || loading.github ? "Testing..." : "Test Connections")));

  const openaiStatus$ = testLoading$.pipe(
    mergeMap((loading) =>
      testResults$.pipe(
        mergeMap((results) =>
          testErrors$.pipe(
            mergeMap((errors) =>
              apiKeys$.pipe(
                map((apiKeys) => {
                  if (!apiKeys.openai) return "✗ Not set";
                  if (loading.openai) return `Testing...`;
                  if (errors.openai) return `✗ ${errors.openai}`;
                  if (results.openai) return `✓ ${results.openai}`;
                  return "✓ Set";
                })
              )
            )
          )
        )
      )
    )
  );

  const githubStatus$ = testLoading$.pipe(
    mergeMap((loading) =>
      testResults$.pipe(
        mergeMap((results) =>
          testErrors$.pipe(
            mergeMap((errors) =>
              apiKeys$.pipe(
                map((apiKeys) => {
                  if (!apiKeys.github) return "✗ Not set";
                  if (loading.github) return "Testing...";
                  if (errors.github) return `✗ ${errors.github}`;
                  if (results.github) return `✓ ${results.github}`;
                  return "✓ Set";
                })
              )
            )
          )
        )
      )
    )
  );

  // 4. Combine state and template
  const openaiApiKey$ = apiKeys$.pipe(map((keys) => keys.openai || ""));
  const githubApiKey$ = apiKeys$.pipe(map((keys) => keys.github || ""));

  const template = html`
    <form class="connections-form" @submit=${handleTestSubmit}>
      <div class="form-field">
        <label for="openai-key">OpenAI API Key</label>
        <input id="openai-key" type="password" value=${observe(openaiApiKey$)} placeholder="sk-..." @input=${handleOpenAIChange} />
      </div>

      <div class="form-field">
        <label for="github-key">GitHub API Key</label>
        <input id="github-key" type="password" value=${observe(githubApiKey$)} placeholder="ghp_..." @input=${handleGitHubChange} />
      </div>

      <button type="submit" ?disabled=${observe(isDisabled$)}>${observe(buttonText$)}</button>

      <div class="form-status">
        <small>OpenAI: ${observe(openaiStatus$)}</small><br />
        <small>GitHub: ${observe(githubStatus$)}</small>
      </div>
    </form>
  `;

  const effects$ = merge(persistKeys$, handleTestConnection$).pipe(ignoreElements());

  return effects$.pipe(startWith(template));
});
