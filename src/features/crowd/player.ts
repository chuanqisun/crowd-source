export class AudioPlayer {
  private maxConcurrent: number;
  private playing: Set<HTMLAudioElement> = new Set();
  private queue: Array<{ blob: Blob; resolve: () => void; reject: (error: any) => void }> = [];

  constructor(maxConcurrent: number = 3) {
    this.maxConcurrent = maxConcurrent;
  }

  play(blob: Blob): Promise<void> {
    return new Promise<void>((resolve, reject) => {
      if (this.playing.size < this.maxConcurrent) {
        this.startPlaying(blob, resolve, reject);
      } else {
        this.queue.push({ blob, resolve, reject });
      }
    });
  }

  private startPlaying(blob: Blob, resolve: () => void, reject: (error: any) => void): void {
    const audio = new Audio(URL.createObjectURL(blob));
    this.playing.add(audio);
    audio.onended = () => {
      this.playing.delete(audio);
      URL.revokeObjectURL(audio.src);
      this.checkQueue();
    };
    audio
      .play()
      .then(resolve)
      .catch((error) => {
        console.error("Error playing audio:", error);
        this.playing.delete(audio);
        URL.revokeObjectURL(audio.src);
        reject(error);
        this.checkQueue();
      });
  }

  private checkQueue(): void {
    if (this.queue.length > 0 && this.playing.size < this.maxConcurrent) {
      const { blob, resolve, reject } = this.queue.shift()!;
      this.startPlaying(blob, resolve, reject);
    }
  }

  clear(): void {
    for (const audio of this.playing) {
      audio.pause();
      audio.currentTime = 0;
      URL.revokeObjectURL(audio.src);
    }
    this.playing.clear();
    // Reject all pending promises in the queue
    for (const item of this.queue) {
      item.reject(new Error("Audio player cleared"));
    }
    this.queue = [];
  }
}

export const audioPlayer = new AudioPlayer(3);
