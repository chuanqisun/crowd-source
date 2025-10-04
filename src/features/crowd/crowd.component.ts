import { html } from "lit-html";
import { interval, merge, mergeMap } from "rxjs";
import { debounceTime, distinctUntilChanged, filter, switchMap, take, takeUntil, tap } from "rxjs/operators";
import { createComponent } from "../../sdk/create-component";
import { escapeKeydown$, idle$, keydownInterrupt$, line$, lineChangeDebounce } from "../editor/editor.component";
import { audioPlayer } from "./player";
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
      debounceTime(lineChangeDebounce),
      tap(() => speechQueue.clear()),
      switchMap((line) => searchAll$(line).pipe(take(20), mergeMap(generateAudioBlob, 3), takeUntil(escapeKeydown$))),
      tap((blob) => speechQueue.enqueue(blob))
    )
    .subscribe();

  merge(keydownInterrupt$, escapeKeydown$).subscribe(() => {
    speechQueue.clear();
    audioPlayer.clear();
  });

  idle$
    .pipe(
      switchMap(() =>
        interval(500).pipe(
          takeUntil(merge(keydownInterrupt$, escapeKeydown$)),
          mergeMap(async () => {
            const blob = speechQueue.dequeue();
            if (blob) {
              try {
                await audioPlayer.play(blob);
              } catch (e) {}
            }
          }, 1)
        )
      )
    )
    .subscribe(() => {});

  return html``;
});
