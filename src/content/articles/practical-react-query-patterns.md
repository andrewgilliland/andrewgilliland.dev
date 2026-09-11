---
title: Practical React Query Patterns for Real Applications
date: 2026-09-10
excerpt: How to use prefetching, dependent queries, parallel requests, and targeted invalidation to solve common data-fetching problems.
draft: false
tags: ["react", "typescript", "tanstack"]
---

Fetching and caching one API response is only the starting point. Real applications need to coordinate requests, prepare data before navigation, and keep related screens synchronized after changes.

These patterns solve those problems without turning every component into its own data manager.

## Keep Query Definitions Consistent

Start by defining reusable query options:

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

  detail: (eventId: string) =>
    queryOptions({
      queryKey: ["events", "detail", eventId] as const,
      queryFn: () => getEvent(eventId),
    }),
};
```

Components, prefetching, and cache updates now use the same keys and request functions.

## Wait for Data Before Starting Another Query

An event query may depend on a season returned by another request:

```tsx
const seasonQuery = useQuery(currentSeasonQuery());

const eventsQuery = useQuery({
  ...eventQueries.bySeason(seasonQuery.data?.id ?? ""),
  enabled: Boolean(seasonQuery.data?.id),
});
```

The event request stays disabled until the season ID exists. This is useful for organization, season, and event workflows where each selection controls the next request.

## Run Independent Requests in Parallel

Sometimes one request returns several IDs and each item needs more data:

```tsx
const eventsQuery = useQuery(eventQueries.bySeason(seasonId));

const detailQueries = useQueries({
  queries: (eventsQuery.data ?? []).map((event) =>
    eventQueries.detail(event.id),
  ),
});
```

The season query runs first. Once its events arrive, the detail requests run in parallel.

Before doing this, check whether the API can return the required details in one request. Multiple parallel queries are useful when each resource is independently cached or loaded elsewhere in the application.

## Prefetch the Next Screen

If the next user action is predictable, fetch its data early:

```tsx
function SeasonLink({ seasonId }: { seasonId: string }) {
  const queryClient = useQueryClient();

  return (
    <a
      href={`/seasons/${seasonId}`}
      onMouseEnter={() =>
        queryClient.prefetchQuery(eventQueries.bySeason(seasonId))
      }
    >
      View season
    </a>
  );
}
```

When the user opens the season, its events may already be cached. Prefetching works well for links, wizard steps, and likely follow-up actions.

## Invalidate Only What Changed

After creating an event, refresh the affected season instead of every query:

```tsx
const createEventMutation = useMutation({
  mutationFn: createEvent,
  onSuccess: (event) => {
    queryClient.invalidateQueries({
      queryKey: eventQueries.bySeason(event.seasonId).queryKey,
    });
  },
});
```

Targeted invalidation reduces unnecessary requests while still treating the server as the source of truth.

## When Not to Use These Patterns

Do not split one response into many parallel queries when the API can return the data efficiently in one request. Avoid prefetching large datasets users may never open. Use direct cache updates and optimistic behavior only when their extra coordination meaningfully improves the experience.

## The Takeaway

The most useful React Query patterns coordinate when data loads and which cached values change. Use dependent queries for sequential work, parallel queries for independent requests, prefetching for predictable navigation, and targeted invalidation after mutations.

Start with the simplest request flow. Add these patterns when they solve an observable application problem.
