import OpenAI from "openai";
import type { Observable } from "rxjs";
import { Observable as RxObservable, map, mergeMap } from "rxjs";
import { apiKeys$ } from "../connections/storage";

export interface PlayableSpeech {
  text: string;
  blob: Blob;
}
export function generateAudioBlob(text: string): Observable<PlayableSpeech> {
  return new RxObservable<PlayableSpeech>((subscriber) => {
    const openAIKey = apiKeys$.value.openai;
    if (!openAIKey) {
      subscriber.error(new Error("OpenAI API key not set"));
      return;
    }

    const abortController = new AbortController();

    const openai = new OpenAI({
      apiKey: openAIKey,
      dangerouslyAllowBrowser: true,
    });

    const voices = ["alloy", "ash", "ballad", "coral", "echo", "fable", "nova", "onyx", "sage", "shimmer"];
    const randomVoice = voices[Math.floor(Math.random() * voices.length)];

    openai.audio.speech
      .create(
        {
          model: "gpt-4o-mini-tts",
          voice: randomVoice as any,
          input: text,
          instructions: "Quickly reading a git commit message in a friendly gentle whisper voice without pause.",
        },
        { signal: abortController.signal }
      )
      .then(async (mp3) => {
        if (abortController.signal.aborted) return;
        const audioBlob = new Blob([await mp3.arrayBuffer()], { type: "audio/mpeg" });
        subscriber.next({ text, blob: audioBlob });
        subscriber.complete();
      })
      .catch((err) => {
        if (err.name === "AbortError") {
          subscriber.complete();
        } else {
          subscriber.next({ text: err.message || "Error generating speech", blob: new Blob() });
        }
      });

    return () => abortController.abort();
  });
}

export function playAudioBlob(blob: Blob): Observable<void> {
  return new RxObservable<void>((subscriber) => {
    const abortController = new AbortController();
    let audio: HTMLAudioElement | null = null;
    let audioUrl: string | null = null;

    const cleanup = () => {
      abortController.abort();
      if (audio) {
        audio.pause();
        audio.currentTime = 0;
      }
      if (audioUrl) {
        URL.revokeObjectURL(audioUrl);
      }
    };

    audioUrl = URL.createObjectURL(blob);
    audio = new Audio(audioUrl);

    audio.addEventListener("ended", () => {
      cleanup();
      subscriber.complete();
    });

    audio.addEventListener("error", (err) => {
      cleanup();
      subscriber.error(err);
    });

    try {
      audio.play();
    } catch (err) {
      cleanup();
      subscriber.error(err);
    }

    return cleanup;
  });
}

export function generateSpeech(text: string): Observable<PlayableSpeech> {
  return generateAudioBlob(text).pipe(mergeMap((playable) => playAudioBlob(playable.blob).pipe(map(() => playable))));
}
