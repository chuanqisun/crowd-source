import { html } from "lit-html";
import { distinct, from, map, merge, mergeMap } from "rxjs";
import { createComponent } from "../../sdk/create-component";
import { apiKeys$ } from "../connections/storage";
import { escapeKeydown$, idle$, line$ } from "../editor/editor.component";
import { searchDiscussions$, searchIssues$, searchPullRequests$ } from "./search";
import { generateAudioBlob, playAudioBlob } from "./tts";

export const SearchDebuggerComponent = createComponent(() => {
  const handleSearch = () => {
    console.log({ line: line$.value, apiKey: apiKeys$.value.github });

    const issues$ = searchIssues$(line$.value).pipe(
      map((results) => [...new Set(results)]),
      mergeMap((items) => from(items))
    );
    const prs$ = searchPullRequests$(line$.value).pipe(
      map((results) => [...new Set(results)]),
      mergeMap((items) => from(items))
    );
    const disucssions = searchDiscussions$(line$.value).pipe(
      map((results) => [...new Set(results)]),
      mergeMap((items) => from(items))
    );

    const uniqueStream = merge(issues$, prs$, disucssions).pipe(
      distinct(),
      mergeMap((item) => generateAudioBlob(item), 3),
      mergeMap((blob) => playAudioBlob(blob), 2)
    );

    uniqueStream.subscribe({ error: (error) => console.error("Error:", error) });
  };

  escapeKeydown$.subscribe(() => {});

  idle$.subscribe(() => {});

  return html` <button @click=${handleSearch}>Search</button> `;
});
