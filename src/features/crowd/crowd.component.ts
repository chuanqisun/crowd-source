import { html } from "lit-html";
import { interval, merge, mergeMap } from "rxjs";
import { debounceTime, distinctUntilChanged, filter, switchMap, take, takeUntil, tap } from "rxjs/operators";
import { createComponent } from "../../sdk/create-component";
import { escapeKeydown$, idle$, keydownInterrupt$, line$, lineChangeDebounce } from "../editor/editor.component";
import { showDanmaku } from "./danmaku";
import { audioPlayer } from "./player";
import { searchAll$ } from "./search";
import { speechQueue } from "./speech-queue";
import { generateAudioBlob, playAudioBlob } from "./tts";

export const CrowdComponent = createComponent(() => {
  speechQueue.queueLength$.pipe(distinctUntilChanged()).subscribe((length) => {
    console.log("Speech queue length:", length);
  });

  // Subscribe to line changes, debounce, generate voice, enqueue
  line$
    .pipe(
      filter((line) => line.trim().length > 3),
      distinctUntilChanged(),
      debounceTime(lineChangeDebounce),
      switchMap((line) => searchAll$(line).pipe(take(10), mergeMap(generateAudioBlob, 3), takeUntil(escapeKeydown$))),
      tap((playable) => speechQueue.enqueue(playable))
    )
    .subscribe();

  keydownInterrupt$.subscribe(() => {
    // speechQueue.clear();
  });

  escapeKeydown$.subscribe(() => {
    speechQueue.clear();
    audioPlayer.clear();
  });

  idle$
    .pipe(
      switchMap(() =>
        interval(500).pipe(
          takeUntil(merge(keydownInterrupt$, escapeKeydown$)),
          mergeMap(async () => {
            const playable = speechQueue.dequeue();
            if (playable) {
              try {
                await audioPlayer.play(playable.text, playAudioBlob(playable.blob));
              } catch (e) {}
            }
          }, 3)
        )
      )
    )
    .subscribe(() => {});

  audioPlayer.activeText$.subscribe((text) => {
    showDanmaku(text);
  });

  return html``;
});
