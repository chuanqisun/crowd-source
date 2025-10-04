import { BehaviorSubject } from "rxjs";
import type { PlayableSpeech } from "./tts";

/**
 * Simple queue for managing playable speech items
 * Users can enqueue items and dequeue them for playback
 */
export class SpeechQueue {
  private queue: PlayableSpeech[] = [];
  private _queueLength$ = new BehaviorSubject<number>(0);

  /**
   * Add a playable speech item to the queue
   */
  enqueue(item: PlayableSpeech): void {
    this.queue.push(item);
    this._queueLength$.next(this.queue.length);
  }

  /**
   * Get the next playable speech item from the queue, or null if empty
   */
  dequeue(): PlayableSpeech | null {
    const item = this.queue.shift() || null;
    this._queueLength$.next(this.queue.length);
    return item;
  }

  /**
   * Remove all items from the queue
   */
  clear(): void {
    this.queue = [];
    this._queueLength$.next(0);
  }

  /**
   * Get the number of items in the queue
   */
  get activeCount(): number {
    return this.queue.length;
  }

  /**
   * Observable for queue length changes
   */
  get queueLength$(): BehaviorSubject<number> {
    return this._queueLength$;
  }
}

// Initialize the speech queue
export const speechQueue = new SpeechQueue();
