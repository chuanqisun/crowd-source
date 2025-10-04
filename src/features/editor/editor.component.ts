import { javascript } from "@codemirror/lang-javascript";
import { oneDark } from "@codemirror/theme-one-dark";
import { EditorView, keymap } from "@codemirror/view";
import { basicSetup } from "codemirror";
import { BehaviorSubject, merge, Subject } from "rxjs";
import { debounceTime, distinctUntilChanged, skip } from "rxjs/operators";
import initialDoc from "./quick-sort.ts?raw";

export const lineChangeDebounce = 200;
export const idleDebounce = 500;

export const line$ = new BehaviorSubject<string>("");

export const keydownInterrupt$ = line$.pipe(skip(1));

/* emit when user presses escape */
export const escapeKeydown$ = new Subject<void>();

/* emit when user idles for 1 second: no typing at all, no escape keydown */
export const idle$ = new BehaviorSubject<void>(undefined);

export function useEditor() {
  new EditorView({
    parent: document.getElementById("editor-root")!,
    doc: initialDoc,
    extensions: [
      basicSetup,
      javascript({ typescript: true, jsx: true }),
      oneDark,
      EditorView.updateListener.of((update) => {
        const line = update.state.doc.lineAt(update.state.selection.main.head).text;
        line$.next(line);
      }),
      keymap.of([
        {
          key: "Escape",
          run: () => {
            escapeKeydown$.next();
            return true;
          },
        },
      ]),
    ],
  });

  const idleSource$ = merge(line$.pipe(distinctUntilChanged()), escapeKeydown$).pipe(debounceTime(idleDebounce), skip(1));
  idleSource$.subscribe(() => idle$.next());
}
