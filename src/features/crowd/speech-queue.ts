import { BehaviorSubject } from "rxjs";

/**
 * Simple queue for managing audio blobs
 * Users can enqueue blobs and dequeue them for playback
 */
export class SpeechQueue {
  private queue: Blob[] = [];
  private _queueLength$ = new BehaviorSubject<number>(0);

  /**
   * Add a blob to the queue
   */
  enqueue(blob: Blob): void {
    this.queue.push(blob);
    this._queueLength$.next(this.queue.length);
  }

  /**
   * Get the next blob from the queue, or null if empty
   */
  dequeue(): Blob | null {
    const blob = this.queue.shift() || null;
    this._queueLength$.next(this.queue.length);
    return blob;
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
