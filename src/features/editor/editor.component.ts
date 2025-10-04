import { EditorView, keymap } from "@codemirror/view";
import { basicSetup } from "codemirror";
import { BehaviorSubject, merge } from "rxjs";
import { debounceTime } from "rxjs/operators";

export const line$ = new BehaviorSubject<string>("");

/* emit when user types anything */
export const typingInterrupt$ = new BehaviorSubject<void>(undefined);

/* emit when user presses escape */
export const escapeKeydown$ = new BehaviorSubject<void>(undefined);

/* emit when user idles for 1 second: no typing at all, no escape keydown */
export const idle$ = new BehaviorSubject<void>(undefined);

export function useEditor() {
  new EditorView({
    parent: document.getElementById("editor-root")!,
    doc: "",
    extensions: [
      basicSetup,
      EditorView.updateListener.of((update) => {
        if (!update.changes.empty) {
          const line = update.state.doc.lineAt(update.state.selection.main.head).text;
          line$.next(line);
          typingInterrupt$.next();
        }
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

  const idleSource$ = merge(typingInterrupt$, escapeKeydown$).pipe(debounceTime(1000));
  idleSource$.subscribe(() => idle$.next());
}
