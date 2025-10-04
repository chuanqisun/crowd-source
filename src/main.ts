import { html, render } from "lit-html";
import { ConnectionsComponent } from "./features/connections/connections.component";
import { CrowdComponent } from "./features/crowd/crowd.component";
import { useDanmaku } from "./features/crowd/danmaku";
import { useEditor } from "./features/editor/editor.component";
import { createComponent } from "./sdk/create-component";
import "./style.css";

const App = createComponent(() => {
  return html`
    <header>
      <button commandfor="connection-dialog" command="show-modal">Setup</button>
      ${CrowdComponent()}
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

useDanmaku();
