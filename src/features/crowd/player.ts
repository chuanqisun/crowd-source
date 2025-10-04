import { BehaviorSubject, type Observable } from "rxjs";

export class AudioPlayer {
  private maxConcurrent: number;
  private playing: Set<any> = new Set(); // subscriptions
  private queue: Array<{ text: string; observable: Observable<void>; resolve: () => void; reject: (error: any) => void }> = [];
  private activeItems: Array<{ text: string; subscription: any }> = [];
  public activeText$ = new BehaviorSubject<string[]>([]);

  constructor(maxConcurrent: number = 3) {
    this.maxConcurrent = maxConcurrent;
  }

  play(text: string, observable: Observable<void>): Promise<void> {
    return new Promise<void>((resolve, reject) => {
      if (this.playing.size < this.maxConcurrent) {
        this.startPlaying(text, observable, resolve, reject);
      } else {
        this.queue.push({ text, observable, resolve, reject });
      }
    });
  }

  private startPlaying(text: string, observable: Observable<void>, resolve: () => void, reject: (error: any) => void): void {
    const subscription = observable.subscribe({
      next: () => {},
      complete: () => {
        this.playing.delete(subscription);
        this.removeActiveItem(subscription);
        this.checkQueue();
        resolve();
      },
      error: (err: any) => {
        this.playing.delete(subscription);
        this.removeActiveItem(subscription);
        this.checkQueue();
        reject(err);
      },
    });
    this.playing.add(subscription);
    this.activeItems.push({ text, subscription });
    this.activeText$.next(this.activeItems.map((item) => item.text));
  }

  private removeActiveItem(subscription: any): void {
    const index = this.activeItems.findIndex((item) => item.subscription === subscription);
    if (index >= 0) {
      this.activeItems.splice(index, 1);
      this.activeText$.next(this.activeItems.map((item) => item.text));
    }
  }

  private checkQueue(): void {
    if (this.queue.length > 0 && this.playing.size < this.maxConcurrent) {
      const { text, observable, resolve, reject } = this.queue.shift()!;
      this.startPlaying(text, observable, resolve, reject);
    }
  }

  clear(): void {
    for (const subscription of this.playing) {
      subscription.unsubscribe();
    }
    this.playing.clear();
    this.activeItems = [];
    this.activeText$.next([]);
    // Reject all pending promises in the queue
    for (const item of this.queue) {
      item.reject(new Error("Audio player cleared"));
    }
    this.queue = [];
  }
}

export const audioPlayer = new AudioPlayer(3);
