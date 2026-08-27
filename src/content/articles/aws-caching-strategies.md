---
title: "Choosing the Right Caching Strategy on AWS"
date: 2026-08-26
excerpt: "Caching can make an AWS application faster and cheaper, but the wrong cache can serve stale or private data. Learn where each AWS caching option fits and what it costs you in complexity."
draft: false
tags: ["aws", "serverless", "api-gateway", "lambda", "dynamodb"]
---

Adding a cache can make an application faster. It can also serve stale data, leak one user's response to another user, and add a new system that can fail.

The hard part is not turning on a cache. The hard part is choosing what to cache, where to cache it, and how long the cached value may be wrong.

This guide compares the main caching layers available to an AWS application. The goal is not the highest possible cache hit rate. The goal is to remove meaningful work without breaking the application's rules.

## The API We Are Caching

We will use a small Events API throughout the article:

- API Gateway receives requests.
- Lambda runs the application code.
- DynamoDB stores events.
- `GET /events` returns a public list.
- `GET /users/me/events` returns events for the signed-in user.

A request can pass through several possible caches:

```text
Browser
  -> CloudFront
    -> API Gateway
      -> Lambda execution environment
        -> ElastiCache or DAX
          -> DynamoDB
```

A cache near the browser can skip every layer behind it. That can save more work, but it also has less information about the user and the application's rules.

A cache near DynamoDB has more application context. It is easier to use safely for private data, but requests still pass through the other services.

## Terms That Matter

A **cache key** is the value used to find an entry. It might be a URL, an event ID, or a combination such as `tenantId:eventId`.

A **cache hit** means the key exists and the cache returns its value. A **cache miss** means the application must load the value from the source.

**Time to live (TTL)** is how long an entry may remain in the cache. When the TTL ends, the entry expires.

**Invalidation** means removing or replacing a cached value because the source data changed. Invalidation is where many simple caching plans become complicated.

Before choosing a service, answer these questions:

1. Who is allowed to share one cached response?
2. Which request values change the response?
3. How stale may the response be?
4. What removes the entry after a write?
5. What happens when the cache is unavailable?
6. Is the saved latency or cost worth another production dependency?

## Browser and CloudFront Caching

Browser and CloudFront caching work well for public responses that are the same for many users. They remove the most downstream work because a cache hit never reaches API Gateway or Lambda.

HTTP response headers define the basic policy:

```http
Cache-Control: public, max-age=60, s-maxage=300
ETag: "events-v42"
```

`max-age=60` allows a browser to reuse the response for 60 seconds. `s-maxage=300` allows a shared cache such as CloudFront to reuse it for 300 seconds. An `ETag` is a version label that lets a client ask whether an older response is still current.

CloudFront uses a cache key to decide which requests may share a response. The URL path is part of the key by default. A cache policy can also include selected query strings, headers, and cookies.

Only include values that change the response. If `?team=atlanta` changes the event list, `team` belongs in the key. A tracking parameter such as `utm_source` usually does not.

Be careful with signed-in requests. If a response depends on the `Authorization` header, a session cookie, a tenant, or a user ID, a shared public cache can return private data to the wrong person. Mark the response `private` or `no-store` unless you can prove that every authorization input is represented safely in the cache policy.

For static files with versioned names, use long browser and CloudFront lifetimes. [Build an Asset CDN on AWS with CDK](/articles/asset-cdn-with-s3-cloudfront-route53-acm-and-cdk) covers that pattern in detail.

## API Gateway Response Caching

API Gateway REST APIs can provision a dedicated cache for a stage. API Gateway HTTP APIs do not support this managed response cache.

When caching is enabled for a REST API stage, `GET` methods are cached by default. You can override the policy for each method, set a TTL, encrypt cached data, and include path, query, or header parameters in the cache key.

This works well when an existing REST API needs simple response caching and putting CloudFront in front of it would add more control than you need.

It has limits:

- The cache is a separate hourly cost.
- A cache key must include every request value that changes the response.
- Changing cache capacity replaces the cache and removes its entries.
- Client-driven invalidation must require authorization.
- The feature is not available for HTTP APIs.

Do not switch from an HTTP API to a REST API only because caching sounds useful. First compare the cost and complexity with CloudFront or an application cache.

## Lambda Memory as a Small Local Cache

Lambda can reuse an execution environment across requests. Values created outside the handler may remain available for later requests handled by that same environment.

```typescript
let configuration: AppConfiguration | undefined;

export async function handler() {
  configuration ??= await loadConfiguration();
  return buildResponse(configuration);
}
```

This is useful for small values that rarely change, such as parsed configuration or reference data.

It is not a shared cache. Lambda may remove the execution environment at any time. Concurrent requests can run in different environments, each with a different copy. There is no reliable way to invalidate every copy at once.

Treat Lambda memory as a best-effort optimization. Never depend on it for correctness.

## ElastiCache for Shared Application Data

Amazon ElastiCache provides a shared in-memory data store. ElastiCache Serverless handles capacity and the underlying cache infrastructure. It supports Valkey, Memcached, and Redis OSS engines.

Use ElastiCache when many Lambda environments or application servers need the same cached data. Common examples include expensive computed results, hot records, rate-limit counters, and short-lived session data.

For a new key-value cache, Valkey is a practical default. It supports the Redis protocol and common Redis client libraries. Your Lambda functions need network access to the cache, usually through the same virtual private cloud (VPC).

The most common application pattern is **cache-aside**:

1. Read from the cache.
2. On a hit, return the cached value.
3. On a miss, read from DynamoDB.
4. Store the result in the cache with a TTL.
5. Return the result.

The database remains the source of truth.

### A Cache-Aside Lambda Handler

This TypeScript example uses a module-level Valkey client so warm Lambda requests can reuse the connection. It treats cache failures as misses because DynamoDB is still available.

```typescript
import { DynamoDBClient } from "@aws-sdk/client-dynamodb";
import { DynamoDBDocumentClient, GetCommand } from "@aws-sdk/lib-dynamodb";
import { createClient } from "redis";

type EventRecord = {
  eventId: string;
  title: string;
  startsAt: string;
};

const dynamodb = DynamoDBDocumentClient.from(new DynamoDBClient({}));
const cache = createClient({ url: process.env.CACHE_URL });

cache.on("error", (error) => {
  console.error("Cache connection error", { message: error.message });
});

let cacheConnection: Promise<unknown> | undefined;

function connectToCache() {
  cacheConnection ??= cache.connect().catch((error) => {
    cacheConnection = undefined;
    throw error;
  });

  return cacheConnection;
}

function ttlWithJitter(baseSeconds: number) {
  return baseSeconds + Math.floor(Math.random() * 30);
}

async function readCachedEvent(key: string) {
  try {
    await connectToCache();
    const value = await cache.get(key);
    if (!value) return undefined;

    return JSON.parse(value) as EventRecord;
  } catch (error) {
    console.warn("Cache read failed", { key, error });
    return undefined;
  }
}

async function writeCachedEvent(key: string, event: EventRecord) {
  try {
    await connectToCache();
    await cache.set(key, JSON.stringify(event), {
      EX: ttlWithJitter(300),
    });
  } catch (error) {
    console.warn("Cache write failed", { key, error });
  }
}

export async function getEvent(eventId: string) {
  const key = `event:v1:${eventId}`;
  const cachedEvent = await readCachedEvent(key);
  if (cachedEvent) return cachedEvent;

  const result = await dynamodb.send(
    new GetCommand({
      TableName: process.env.EVENTS_TABLE,
      Key: { eventId },
    }),
  );

  const event = result.Item as EventRecord | undefined;
  if (!event) return undefined;

  await writeCachedEvent(key, event);
  return event;
}
```

The random extra TTL is **jitter**. It keeps many related keys from expiring at the same second and sending a sudden wave of requests to DynamoDB.

The example logs cache errors but continues to DynamoDB. This is called failing open. It is a good fit when the database can handle the temporary load and current data is more important than cache availability.

Do not fail open without limits. A cache outage can move all traffic to DynamoDB at once. Use DynamoDB capacity controls, API throttling, and alarms to keep that failure from spreading.

## DAX for DynamoDB Reads

Amazon DynamoDB Accelerator (DAX) is a DynamoDB-compatible cache. It is designed for applications that repeatedly read the same DynamoDB data and can accept eventual consistency.

DAX performs read-through caching. On a miss, it reads from DynamoDB and stores the result. Writes sent through the DAX client go to DynamoDB first and then update the DAX item cache.

DAX does not cache strongly consistent reads. It passes them to DynamoDB. Its query cache is also separate from its item cache, so an item write does not invalidate a cached `Query` result.

Use DAX when the real need is faster, repeated DynamoDB reads with small application changes. Do not use it as a general replacement for Valkey or Redis. If direct DynamoDB reads are already fast and affordable enough, DAX only adds another network service.

## What Is Not a Cache

Several AWS features are useful but solve different problems.

**DynamoDB TTL deletes old items.** Deletion is asynchronous. TTL is a data lifecycle feature, not an API response cache.

**Lambda provisioned concurrency prepares execution environments.** It can reduce cold starts, but it does not provide a shared application cache.

**CloudFront Origin Shield adds another cache layer in front of an origin.** It can reduce duplicate origin requests. It does not fix an unsafe cache key or an incorrect freshness policy.

## Cache Invalidation Is the Architecture

Reading from a cache is simple. Keeping it correct after a write is the real design work.

For the Events API, update DynamoDB first. After the database write succeeds, delete the old cache entry:

```typescript
await updateEventInDynamoDB(event);

try {
  await connectToCache();
  await cache.del(`event:v1:${event.eventId}`);
} catch (error) {
  console.warn("Cache invalidation failed", {
    eventId: event.eventId,
    error,
  });
}
```

There is a failure window here. DynamoDB can succeed and cache deletion can fail. Readers may see the old event until its TTL ends.

Choose an invalidation strategy based on how much stale data the application can accept:

- **TTL only:** simplest, but old data remains until expiry.
- **Explicit deletion:** remove known keys after a successful write.
- **Versioned keys:** put a version in the key so new writes use a new entry.
- **Event-driven invalidation:** publish changes and let consumers clear several caches.
- **Write-through:** update the database and cache through one caching layer, as DAX does for items.

Start with a bounded TTL and explicit deletion when that meets the freshness requirement. Add event-driven invalidation only when one write affects many keys or services.

A popular key can also cause a **cache stampede**. This happens when the key expires and many requests rebuild it at once. TTL jitter helps across related keys. For one very hot key, use request coalescing or a short lock so only one request rebuilds the value.

## Choosing the Layer

| Layer                  | Best fit                                       | Shared by                            | Main limitation                                   |
| ---------------------- | ---------------------------------------------- | ------------------------------------ | ------------------------------------------------- |
| Browser                | One user's reusable HTTP response              | One browser                          | The server cannot remove every stored copy        |
| CloudFront             | Public or safely partitioned responses         | Users at edge locations              | Cache keys are easy to get wrong for private data |
| API Gateway REST cache | Simple method response caching                 | Requests to one API stage            | REST APIs only and a dedicated hourly cost        |
| Lambda memory          | Small, stable reference values                 | One execution environment            | Temporary and not shared                          |
| ElastiCache            | Shared hot data and computed results           | Application instances in the network | Networking, failure handling, and invalidation    |
| DAX                    | Repeated, eventually consistent DynamoDB reads | Applications using the DAX cluster   | DynamoDB-specific and not for strong reads        |

Use the closest safe cache:

- Use CloudFront for public event listings that can be a few minutes old.
- Use private browser caching for a user's own response when the browser may store it.
- Use API Gateway caching when you already use a REST API and method caching is enough.
- Use Lambda memory for small values that are safe to reload at any time.
- Use ElastiCache when many compute instances need shared hot data.
- Use DAX when repeated DynamoDB reads are the measured bottleneck.
- Use no cache when direct reads already meet the goal.

## Measure Before and After

Do not add a cache because an architecture diagram looks incomplete. Measure the current path first.

Track the signals that show whether caching helps:

- end-to-end request latency
- origin or integration latency
- cache hits and misses
- evictions
- Lambda duration and errors
- DynamoDB consumed capacity and throttling
- cache connection failures

A high hit rate is not the goal by itself. A cache that has a high hit rate but returns old or incorrectly shared data is a broken cache.

Compare latency, error rate, and cost before and after the change. Test cache misses and cache outages, not only the fast path.

## When Not to Add a Cache

Do not add a cache when:

- the data must always use a strongly consistent read
- the data changes too quickly for the allowed TTL
- request volume is low
- direct database reads already meet the latency and cost goals
- you have not measured the bottleneck
- the authorization inputs cannot be represented safely in the cache key
- the team cannot monitor and operate another dependency

The simplest cache to keep correct is the one you do not need.

## The Takeaway

Choose a cache only after you define who can share an entry, how stale it may be, and what happens after a write.

Cache the narrowest stable value that removes meaningful work. Use CloudFront for safe shared HTTP responses, Lambda memory for small local values, ElastiCache for shared application data, and DAX for repeated eventually consistent DynamoDB reads.

Keep the database as the source of truth. When practical, design the application to keep working when the cache is empty or unavailable.
