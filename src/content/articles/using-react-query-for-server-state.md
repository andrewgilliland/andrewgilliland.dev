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
export type Event = {
  id: string;
  name: string;
  seasonId: string;
  startsAt: string;
};

export async function getEvents(seasonId: string): Promise<Event[]> {
  const response = await fetch(`/api/seasons/${seasonId}/events`);

  if (!response.ok) {
    throw new Error(`Failed to load events: ${response.status}`);
  }

  return response.json() as Promise<Event[]>;
}
```

Pass that function to `useQuery` with a query key:

```tsx
import { useQuery } from "@tanstack/react-query";
import { getEvents } from "./api/events";

type EventSelectProps = {
  seasonId: string;
  value: string;
  onChange: (eventId: string) => void;
};

export function EventSelect({ seasonId, value, onChange }: EventSelectProps) {
  const eventsQuery = useQuery({
    queryKey: ["events", { seasonId }],
    queryFn: () => getEvents(seasonId),
    enabled: Boolean(seasonId),
  });

  if (eventsQuery.isPending) {
    return <p>Loading events...</p>;
  }

  if (eventsQuery.isError) {
    return <p>{eventsQuery.error.message}</p>;
  }

  return (
    <select value={value} onChange={(event) => onChange(event.target.value)}>
      <option value="">Select an event</option>
      {eventsQuery.data.map((event) => (
        <option key={event.id} value={event.id}>
          {event.name}
        </option>
      ))}
    </select>
  );
}
```

The query key is the address of the cached data. Every event select using the same season ID reads from the same cache entry. If two components request `["events", { seasonId }]` at the same time, TanStack Query can share the in-flight request instead of sending two identical requests.

Parameters that change the response belong in the key:

```tsx
const eventsQuery = useQuery({
  queryKey: ["events", { seasonId, status }],
  queryFn: () => getEventsByStatus({ seasonId, status }),
});
```

Leaving `seasonId` or `status` out would make different requests compete for the same cache entry. Changing the season ID does not reset the cache. It creates a separate entry for that season, so returning to a previous season can reuse its events.

## Fresh and Cached Are Different

Two options control different parts of a query's lifetime:

- `staleTime` controls how long cached data is considered fresh.
- `gcTime` controls how long an unused query stays in memory before garbage collection.

```tsx
const eventsQuery = useQuery({
  queryKey: ["events", { seasonId }],
  queryFn: () => getEvents(seasonId),
  staleTime: 60_000,
  gcTime: 10 * 60_000,
});
```

For one minute, this season's events are fresh. After that, the cached value can still render immediately, but TanStack Query may refresh it when the component mounts, the window regains focus, or the browser reconnects. Once no component uses the query, it can remain cached for ten minutes before collection.

The default `staleTime` is `0`. That is a safe default because server data is immediately eligible for a background refresh, but it can surprise developers who expect caching to mean "never request this again." Set freshness based on the data, not an arbitrary global value. A list of countries can stay fresh much longer than a live order status.

The cache lives in the `QueryClient`'s memory. A page refresh clears it unless the application adds a persistence adapter.

## Writing Data with `useMutation`

Queries describe data that can be read repeatedly. Mutations represent an intentional operation such as creating, updating, or deleting a record.

First, define the request:

```tsx
export type CreateEventInput = {
  name: string;
  seasonId: string;
  startsAt: string;
};

export async function createEvent(input: CreateEventInput): Promise<Event> {
  const response = await fetch("/api/events", {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
    },
    body: JSON.stringify(input),
  });

  if (!response.ok) {
    throw new Error(`Failed to create event: ${response.status}`);
  }

  return response.json() as Promise<Event>;
}
```

Then connect it to the UI with `useMutation`:

```tsx
import { useMutation, useQueryClient } from "@tanstack/react-query";
import { createEvent } from "./api/events";

export function AddEventButton({ seasonId }: { seasonId: string }) {
  const queryClient = useQueryClient();

  const createEventMutation = useMutation({
    mutationFn: createEvent,
    onSuccess: () => {
      queryClient.invalidateQueries({
        queryKey: ["events", { seasonId }],
      });
    },
  });

  return (
    <button
      disabled={createEventMutation.isPending}
      onClick={() =>
        createEventMutation.mutate({
          name: "Opening Night",
          seasonId,
          startsAt: "2026-09-18T19:00:00.000Z",
        })
      }
    >
      {createEventMutation.isPending ? "Adding..." : "Add event"}
    </button>
  );
}
```

Calling `mutate` passes the input to `createEvent`. The mutation tracks whether the request is pending, successful, or failed. It also exposes the returned data or thrown error.

The mutation does not know that creating an event changes the event list for that season. The `onSuccess` callback makes that relationship explicit.

## Invalidation Connects Writes to Reads

This line is the bridge between the mutation and the cached query:

```tsx
queryClient.invalidateQueries({
  queryKey: ["events", { seasonId }],
});
```

Invalidation marks matching queries as stale. Queries currently rendered by the application are refetched in the background, so the server remains the source of truth.

Query matching is prefix-based by default. Invalidating `["events"]` matches every season-specific event query, such as:

```tsx
["events", { seasonId: "spring-2026" }];
["events", { seasonId: "fall-2026" }];
```

That is useful when a change may affect events across several seasons. After creating one event, invalidating its season-specific key is more precise. Use `exact: true` when only that exact cache entry should be invalidated:

```tsx
queryClient.invalidateQueries({
  queryKey: ["events", { seasonId }],
  exact: true,
});
```

Invalidation is usually the safest update strategy. It asks the server for the canonical result instead of duplicating sorting, filtering, or authorization rules in the client.

## Update the Cache When You Already Have the Answer

Refetching is not always necessary. If the API returns the complete created event, `setQueryData` can update the season's cache entry immediately:

```tsx
const createEventMutation = useMutation({
  mutationFn: createEvent,
  onSuccess: (createdEvent) => {
    queryClient.setQueryData<Event[]>(
      ["events", { seasonId: createdEvent.seasonId }],
      (currentEvents = []) => [...currentEvents, createdEvent],
    );
  },
});
```

This avoids another network request and makes the new event appear immediately. It is only correct when the client can reproduce the server's list behavior. If the server applies sorting, pagination, permissions, or transformations, invalidation is less fragile.

Always return a new value from the updater. Mutating `currentEvents` in place can prevent subscribers from seeing a reliable state change.

## Keep Query Definitions Together

Repeated string keys are easy to mistype. Query option factories keep the key and request function paired:

```tsx
import { queryOptions } from "@tanstack/react-query";

export const eventQueries = {
  all: () => ["events"] as const,
  bySeason: (seasonId: string) =>
    queryOptions({
      queryKey: ["events", { seasonId }] as const,
      queryFn: () => getEvents(seasonId),
      staleTime: 60_000,
    }),
};
```

The same definition can power a component and prefetch data before navigation:

```tsx
useQuery(eventQueries.bySeason(seasonId));

queryClient.prefetchQuery(eventQueries.bySeason(seasonId));
```

This pattern becomes more valuable as keys gain filters and pagination parameters.

## Practical Tips

**Use `isPending` for the initial empty state.** Use `isFetching` when the UI needs to indicate any request, including a background refresh. During a refresh, cached data can remain visible while `isFetching` is `true`.

**Disable dependent queries until their input exists.**

```tsx
useQuery({
  queryKey: ["events", { seasonId }],
  queryFn: () => getEvents(seasonId!),
  enabled: Boolean(seasonId),
});
```

**Keep previous pages visible while the next page loads.**

```tsx
import { keepPreviousData, useQuery } from "@tanstack/react-query";

useQuery({
  queryKey: ["events", { seasonId, page }],
  queryFn: () => getEventsPage({ seasonId, page }),
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
