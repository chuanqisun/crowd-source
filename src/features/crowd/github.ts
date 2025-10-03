/**
 * Defines the standard structure of a successful GraphQL response payload.
 * T is the expected shape of the 'data' field.
 */
interface GraphQLResponse<T> {
  data?: T;
  errors?: Array<{ message: string; locations?: any; path?: any }>;
}

export async function graphqlRequest<T, V = Record<string, any>>(
  token: string,
  query: string,
  variables?: V,
  endpointUrl: string = "https://api.github.com/graphql"
): Promise<T> {
  const response = await fetch(endpointUrl, {
    method: "POST",
    headers: {
      Authorization: `Bearer ${token}`,
      "Content-Type": "application/json",
    },
    body: JSON.stringify({
      query,
      variables,
    }),
  });

  // 1. Check for HTTP errors (e.g., 401, 404, 500)
  if (!response.ok) {
    const errorText = await response.text();
    throw new Error(`GraphQL HTTP Error: ${response.status} ${response.statusText}. Details: ${errorText.substring(0, 200)}`);
  }

  const result: GraphQLResponse<T> = await response.json();

  // 2. Check for GraphQL execution errors (e.g., syntax errors, permission issues)
  if (result.errors) {
    const errorMessages = result.errors.map((e) => e.message).join("; ");
    throw new Error(`GraphQL Execution Errors: ${errorMessages}`);
  }

  // 3. Ensure data exists before casting and returning
  if (!result.data) {
    throw new Error("GraphQL response was successful but returned no 'data' field.");
  }

  return result.data;
}

export async function restRequest<T>(url: string, token: string): Promise<T> {
  const response = await fetch(url, {
    headers: {
      Authorization: `Bearer ${token}`,
      "Content-Type": "application/json",
    },
  });

  if (!response.ok) {
    const errorText = await response.text();
    throw new Error(`REST HTTP Error: ${response.status} ${response.statusText}. Details: ${errorText.substring(0, 200)}`);
  }

  return response.json();
}
