import type { Observable } from "rxjs";
import { catchError, map, mergeMap } from "rxjs";
import { fromFetch } from "rxjs/fetch";
import { apiKeys$ } from "../connections/storage";

export interface SearchItem {
  name: string;
  path: string;
  sha: string;
  url: string;
  git_url: string;
  html_url: string;
  repository: {
    id: number;
    name: string;
    full_name: string;
    owner: {
      login: string;
      id: number;
      avatar_url: string;
      url: string;
    };
  };
  score: number;
}

export interface SearchResponse {
  total_count: number;
  incomplete_results: boolean;
  items: SearchItem[];
}

export function search$(query: string): Observable<SearchResponse> {
  const token = apiKeys$.value.github;
  if (!token) {
    throw new Error("GitHub token not found");
  }

  const fileExtensions = "extension:js OR extension:ts OR extension:jsx OR extension:tsx OR extension:py";
  const fullQuery = `${query} ${fileExtensions}`;
  const url = `https://api.github.com/search/code?q=${encodeURIComponent(fullQuery)}`;

  return fromFetch(url, {
    headers: {
      Authorization: `Bearer ${token}`,
      "Content-Type": "application/json",
    },
  }).pipe(
    mergeMap((response) => {
      if (!response.ok) {
        return response.text().then((errorText) => {
          throw new Error(`REST HTTP Error: ${response.status} ${response.statusText}. Details: ${errorText.substring(0, 200)}`);
        });
      }
      return response.json();
    }),
    map((data: SearchResponse) => data),
    catchError((error) => {
      console.error("GitHub search error:", error);
      throw error;
    })
  );
}

export interface GetCommitMessageProps {
  token: string;
  repo: string;
  owner: string;
  ref: string;
}

export interface CommitNode {
  oid: string;
  message: string;
  committedDate: string;
  url: string;
}

export interface GraphQLResponse {
  data?: {
    repository?: {
      object?: {
        history?: {
          edges?: Array<{
            node: CommitNode;
          }>;
        };
      };
    };
  };
  errors?: Array<{
    message: string;
    [key: string]: any;
  }>;
}

export function getCommitMessage$({ token, repo, owner, ref }: GetCommitMessageProps): Observable<CommitNode | null> {
  const query = `
    query($owner: String!, $repo: String!, $ref: String!) {
      repository(owner: $owner, name: $repo) {
        object(expression: $ref) {
          ... on Commit {
            oid
            message
            committedDate
            url
          }
        }
      }
    }
  `;

  const variables = {
    owner,
    repo,
    ref,
  };

  return fromFetch("https://api.github.com/graphql", {
    method: "POST",
    headers: {
      Authorization: `Bearer ${token}`,
      "Content-Type": "application/json",
    },
    body: JSON.stringify({ query, variables }),
  }).pipe(
    mergeMap((response) => {
      if (!response.ok) {
        return response.text().then((errorText) => {
          throw new Error(`GraphQL HTTP Error: ${response.status} ${response.statusText}. Details: ${errorText.substring(0, 200)}`);
        });
      }
      return response.json();
    }),
    map((data: GraphQLResponse) => {
      if (data.errors) {
        throw new Error(`GraphQL Error: ${data.errors.map((e) => e.message).join(", ")}`);
      }
      const commit = data.data?.repository?.object;
      if (!commit) {
        return null;
      }
      return commit as CommitNode;
    }),
    catchError((error) => {
      console.error("GitHub GraphQL error:", error);
      throw error;
    })
  );
}
