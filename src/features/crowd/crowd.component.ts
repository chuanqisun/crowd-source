import { html } from "lit-html";
import { mergeMap } from "rxjs";
import { debounceTime, distinctUntilChanged, filter, switchMap, take, tap } from "rxjs/operators";
import { createComponent } from "../../sdk/create-component";
import { escapeKeydown$, idle$, line$ } from "../editor/editor.component";
import { searchAll$ } from "./search";
import { speechQueue } from "./speech-queue";
import { generateAudioBlob } from "./tts";

export const CrowdComponent = createComponent(() => {
  speechQueue.queueLength$.pipe(distinctUntilChanged()).subscribe((length) => {
    console.log("Speech queue length:", length);
  });

  // Subscribe to line changes, debounce, generate voice, enqueue
  line$
    .pipe(
      tap(() => speechQueue.clear()),
      filter((line) => line.trim().length > 3),
      distinctUntilChanged(),
      debounceTime(300),
      tap(() => speechQueue.clear()),
      switchMap((line) => searchAll$(line).pipe(take(20), mergeMap(generateAudioBlob, 3))),
      tap((blob) => speechQueue.enqueue(blob))
    )
    .subscribe();

  escapeKeydown$.subscribe(() => {});

  idle$.subscribe(() => {});

  return html``;
});
