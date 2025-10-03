import { html, render } from "lit-html";
import { ConnectionsComponent } from "./features/connections/connections.component";
import { SearchDebuggerComponent } from "./features/crowd/search-debugger.component";
import { useEditor } from "./features/editor/editor.component";
import { createComponent } from "./sdk/create-component";
import "./style.css";

const App = createComponent(() => {
  return html`
    <header>
      Crowd Source <button commandfor="connection-dialog" command="show-modal">Setup</button>
      ${SearchDebuggerComponent()}
    </header>
    <main id="editor-root"></main>
    <dialog class="connection-form" id="connection-dialog">
      <div class="connections-dialog-body">
        ${ConnectionsComponent()}
        <form method="dialog">
          <button>Close</button>
        </form>
      </div>
    </dialog>
  `;
});

render(App(), document.getElementById("app")!);

useEditor();
