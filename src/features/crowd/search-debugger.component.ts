import { html } from "lit-html";
import { createComponent } from "../../sdk/create-component";
import { apiKeys$ } from "../connections/storage";
import { line$ } from "../editor/editor.component";
import { searchDiscussions$ } from "./search";

export const SearchDebuggerComponent = createComponent(() => {
  const handleSearch = () => {
    console.log({ line: line$.value, apiKey: apiKeys$.value.github });

    searchDiscussions$(line$.value).subscribe({
      next: (titles) => {
        console.log("Pull request titles:", titles);
      },
      error: (error) => {
        console.error("Error:", error);
      },
    });

    // search$(line$.value)
    //   .pipe(
    //     mergeMap((result) => {
    //       console.log("Search results:", result);
    //       return result.items;
    //     }),
    //     mergeMap((item) => {
    //       return getCommitMessage$({
    //         token: apiKeys$.value.github!,
    //         repo: item.repository.name,
    //         owner: item.repository.owner.login,
    //         ref: new URL(item.url).searchParams.get("ref")!,
    //       });
    //     }, 3)
    //   )
    //   .subscribe({
    //     next: (message) => {
    //       console.log("Commit message suggestion:", message?.message);
    //     },
    //     error: (error) => {
    //       console.error("Error:", error);
    //     },
    //   });
  };

  return html` <button @click=${handleSearch}>Search</button> `;
});
