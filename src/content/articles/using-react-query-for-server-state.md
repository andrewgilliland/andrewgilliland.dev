---
title: Using React Query for Server State
date: 2026-09-06
excerpt: How to fetch, cache, update, and invalidate API data with TanStack Query without rebuilding server-state management in every React component.
draft: false
tags: ["react", "typescript", "tanstack"]
---

Fetching data in React is easy. Keeping that data correct is where the work starts.

A basic request only needs `fetch` and `useEffect`. A real application needs much more:

- Avoid sending duplicate requests when multiple components need the same data
- Reuse previously fetched data when users revisit a screen
- Decide when cached data is fresh and when it should be fetched again
- Keep old data visible during background refreshes
- Retry temporary failures without retrying permanent ones
- Update related screens after creating, editing, or deleting a record
- Prevent older responses from replacing newer data
- Handle pagination, dependent requests, and request cancellation

You can implement each concern with component state and effects. The problem is that every screen starts rebuilding the same server-state machinery, often with slightly different behavior.

TanStack Query, formerly called React Query, centralizes that machinery. It stores API responses in an in-memory cache, shares them across components, tracks their freshness, and coordinates background requests. Its mutation APIs also provide an explicit way to reconnect successful writes with the cached reads they changed.

It does not replace all React state. Form fields, open menus, and selected tabs still belong in component state. TanStack Query focuses on server state: asynchronous data owned elsewhere that the browser can only temporarily observe.

## Server State Is Not UI State

React is good at managing state owned by the current interface:

- Whether a modal is open
- The current value of a form field
- Which tab is selected

API data has different constraints. The server owns it. Other users or processes can change it, requests can fail, and the value in the browser is only a snapshot.

TanStack Query treats that snapshot as server state. It tracks whether the data is pending, fresh, stale, being refreshed, or no longer used. That removes a lot of coordination code from components without moving the actual source of truth out of the API.

## Setting Up the Query Client

Install the React package:

```bash
npm install @tanstack/react-query
```

Create one `QueryClient` and provide it near the root of the application:

```tsx
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { StrictMode } from "react";
import { createRoot } from "react-dom/client";
import { App } from "./App";

const queryClient = new QueryClient({
  defaultOptions: {
    queries: {
      staleTime: 30_000,
      retry: 2,
    },
  },
});

createRoot(document.getElementById("root")!).render(
  <StrictMode>
    <QueryClientProvider client={queryClient}>
      <App />
    </QueryClientProvider>
  </StrictMode>,
);
```

The client owns an in-memory `QueryCache`. `QueryClientProvider` makes that client available to every query and mutation below it in the component tree.

Create the client once. Creating it during a component render creates a new cache and discards the existing one.

## Reading Data with `useQuery`

Start with a typed request function. `fetch` only rejects for network failures, so the function must throw for unsuccessful HTTP responses:

```tsx
export type User = {
  id: string;
  name: string;
  email: string;
};

export async function getUsers(): Promise<User[]> {
  const response = await fetch("/api/users");

  if (!response.ok) {
    throw new Error(`Failed to load users: ${response.status}`);
  }

  return response.json() as Promise<User[]>;
}
```

Pass that function to `useQuery` with a query key:

```tsx
import { useQuery } from "@tanstack/react-query";
import { getUsers } from "./api/users";

export function UserList() {
  const usersQuery = useQuery({
    queryKey: ["users"],
    queryFn: getUsers,
  });

  if (usersQuery.isPending) {
    return <p>Loading users...</p>;
  }

  if (usersQuery.isError) {
    return <p>{usersQuery.error.message}</p>;
  }

  return (
    <ul>
      {usersQuery.data.map((user) => (
        <li key={user.id}>{user.name}</li>
      ))}
    </ul>
  );
}
```

The query key is the address of the cached data. Every component using the same key reads from the same cache entry. If two components request `["users"]` at the same time, TanStack Query can share the in-flight request instead of sending two identical requests.

Parameters that change the response belong in the key:

```tsx
const usersQuery = useQuery({
  queryKey: ["users", { page, status }],
  queryFn: () => getUsers({ page, status }),
});
```

Leaving `page` or `status` out would make different requests compete for the same cache entry.

## Fresh and Cached Are Different

Two options control different parts of a query's lifetime:

- `staleTime` controls how long cached data is considered fresh.
- `gcTime` controls how long an unused query stays in memory before garbage collection.

```tsx
const userQuery = useQuery({
  queryKey: ["users", userId],
  queryFn: () => getUser(userId),
  staleTime: 60_000,
  gcTime: 10 * 60_000,
});
```

For one minute, this user is fresh. After that, the cached value can still render immediately, but TanStack Query may refresh it when the component mounts, the window regains focus, or the browser reconnects. Once no component uses the query, it can remain cached for ten minutes before collection.

The default `staleTime` is `0`. That is a safe default because server data is immediately eligible for a background refresh, but it can surprise developers who expect caching to mean "never request this again." Set freshness based on the data, not an arbitrary global value. A list of countries can stay fresh much longer than a live order status.

The cache lives in the `QueryClient`'s memory. A page refresh clears it unless the application adds a persistence adapter.

## Writing Data with `useMutation`

Queries describe data that can be read repeatedly. Mutations represent an intentional operation such as creating, updating, or deleting a record.

First, define the request:

```tsx
export type CreateUserInput = {
  name: string;
  email: string;
};

export async function createUser(input: CreateUserInput): Promise<User> {
  const response = await fetch("/api/users", {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
    },
    body: JSON.stringify(input),
  });

  if (!response.ok) {
    throw new Error(`Failed to create user: ${response.status}`);
  }

  return response.json() as Promise<User>;
}
```

Then connect it to the UI with `useMutation`:

```tsx
import { useMutation, useQueryClient } from "@tanstack/react-query";
import { createUser } from "./api/users";

export function AddUserButton() {
  const queryClient = useQueryClient();

  const createUserMutation = useMutation({
    mutationFn: createUser,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["users"] });
    },
  });

  return (
    <button
      disabled={createUserMutation.isPending}
      onClick={() =>
        createUserMutation.mutate({
          name: "Ada Lovelace",
          email: "ada@example.com",
        })
      }
    >
      {createUserMutation.isPending ? "Adding..." : "Add user"}
    </button>
  );
}
```

Calling `mutate` passes the input to `createUser`. The mutation tracks whether the request is pending, successful, or failed. It also exposes the returned data or thrown error.

The mutation does not know that creating a user changes the user list. The `onSuccess` callback makes that relationship explicit.

## Invalidation Connects Writes to Reads

This line is the bridge between the mutation and the cached query:

```tsx
queryClient.invalidateQueries({ queryKey: ["users"] });
```

Invalidation marks matching queries as stale. Queries currently rendered by the application are refetched in the background, so the server remains the source of truth.

Query matching is prefix-based by default. Invalidating `["users"]` also matches keys such as:

```tsx
["users", { page: 1 }];
["users", { status: "active" }];
```

That is useful after creating a user because several user lists may now be outdated. Use `exact: true` when only one cache entry should be invalidated:

```tsx
queryClient.invalidateQueries({
  queryKey: ["users"],
  exact: true,
});
```

Invalidation is usually the safest update strategy. It asks the server for the canonical result instead of duplicating sorting, filtering, or authorization rules in the client.

## Update the Cache When You Already Have the Answer

Refetching is not always necessary. If the API returns the complete created user, `setQueryData` can update a known cache entry immediately:

```tsx
const createUserMutation = useMutation({
  mutationFn: createUser,
  onSuccess: (createdUser) => {
    queryClient.setQueryData<User[]>(["users"], (currentUsers = []) => [
      ...currentUsers,
      createdUser,
    ]);
  },
});
```

This avoids another network request and makes the new user appear immediately. It is only correct when the client can reproduce the server's list behavior. If the server applies sorting, pagination, permissions, or transformations, invalidation is less fragile.

Always return a new value from the updater. Mutating `currentUsers` in place can prevent subscribers from seeing a reliable state change.

## Keep Query Definitions Together

Repeated string keys are easy to mistype. Query option factories keep the key and request function paired:

```tsx
import { queryOptions } from "@tanstack/react-query";

export const userQueries = {
  all: () => ["users"] as const,
  detail: (userId: string) =>
    queryOptions({
      queryKey: ["users", userId] as const,
      queryFn: () => getUser(userId),
      staleTime: 60_000,
    }),
};
```

The same definition can power a component and prefetch data before navigation:

```tsx
useQuery(userQueries.detail(userId));

queryClient.prefetchQuery(userQueries.detail(userId));
```

This pattern becomes more valuable as keys gain filters and pagination parameters.

## Practical Tips

**Use `isPending` for the initial empty state.** Use `isFetching` when the UI needs to indicate any request, including a background refresh. During a refresh, cached data can remain visible while `isFetching` is `true`.

**Disable dependent queries until their input exists.**

```tsx
useQuery({
  queryKey: ["users", userId],
  queryFn: () => getUser(userId!),
  enabled: Boolean(userId),
});
```

**Keep previous pages visible while the next page loads.**

```tsx
import { keepPreviousData, useQuery } from "@tanstack/react-query";

useQuery({
  queryKey: ["users", { page }],
  queryFn: () => getUsers({ page }),
  placeholderData: keepPreviousData,
});
```

**Do not copy query data into component state.** Doing so creates two values that can drift apart. Derive display values from query data or use `select` when a component only needs a transformation.

**Retry selectively.** Retrying a temporary network failure can help. Retrying a `400` validation response or a `401` authentication response usually cannot. Use a custom `retry` function when the API client exposes status codes.

**Prefer invalidation before optimistic updates.** Optimistic UI can feel faster, but it requires canceling in-flight queries, taking a snapshot, applying a temporary value, and rolling back failures. Add that complexity only when the interaction benefits from it.

**Use the Devtools.** The TanStack Query Devtools show query keys, observers, freshness, and cached values. They are the quickest way to understand why a query did or did not refetch.

## When Not to Use This

TanStack Query is not necessary for every React application.

Use plain component state when the value belongs only to the interface. A dropdown's open state does not need a query cache.

Use a framework's server data APIs when data is fetched and rendered entirely on the server with no client-side synchronization. TanStack Query can work with server rendering, but adding hydration and another client cache may not improve a static page.

For one small request in an isolated component, a direct fetch may be enough. TanStack Query starts paying for itself when data is shared, revisited, refreshed, paginated, or changed by mutations.

It is also not a replacement for a well-designed API. Cache invalidation cannot fix responses with unclear ownership, inconsistent identifiers, or missing concurrency controls.

## The Takeaway

TanStack Query gives server data a lifecycle inside a React application. Query keys identify cached values, `staleTime` defines freshness, and invalidation reconnects successful writes to the reads they changed.

Start with those three ideas. Use `useQuery` for reads, `useMutation` for intentional writes, and let the server remain the source of truth. Add direct cache updates, prefetching, and optimistic behavior only when the user experience justifies the extra coordination.
