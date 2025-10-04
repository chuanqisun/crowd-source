import Danmaku from "danmaku";
import { Subject } from "rxjs";

export const showText$ = new Subject<string>();

export function useDanmaku() {
  const danmu = new Danmaku({ container: document.querySelector("#danmaku-container")!, speed: 120 });

  // on window resize, resize danmaku
  window.addEventListener("resize", () => {
    danmu.resize();
  });

  showText$.subscribe((text) => {
    danmu!.emit({
      text,
      style: {
        fontSize: "48px",
        color: ["white", "yellow", "red", "lime", "cyan", "magenta"][Math.floor(Math.random() * 6)],
        textShadow: "-1px -1px #000, -1px 1px #000, 1px -1px #000, 1px 1px #000",
      },
    });
  });
}

export function showDanmaku(text: string) {
  showText$.next(text);
}
