import { EditorView, basicSetup } from "codemirror";
import { BehaviorSubject } from "rxjs";

export const line$ = new BehaviorSubject<string>("");

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
        }
      }),
    ],
  });
}
