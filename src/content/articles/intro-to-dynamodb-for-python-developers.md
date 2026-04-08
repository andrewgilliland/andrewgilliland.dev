---
title: Intro to DynamoDB for Python Developers
date: 2026-04-07
excerpt: DynamoDB is the serverless database that pairs naturally with Lambda. Here's how to use it from Python.
draft: false
---

## What Is DynamoDB?

DynamoDB is AWS's fully managed, serverless NoSQL database. You create a table, put items in it, and AWS handles everything else - replication across Availability Zones, scaling, backups, patching. There are no servers to manage, no instance types to choose, and no connection limits.

It's a key-value and document database. Each item is identified by a primary key and can contain any attributes you want. The schema is flexible - two items in the same table don't need the same fields.

**Why it pairs well with Lambda**

Lambda and DynamoDB are a natural combination. Both are serverless, both scale to zero, and both bill per use. More importantly, DynamoDB uses an HTTP-based API - every operation is an HTTPS request. Lambda invocations don't hold open persistent database connections, so you never hit the connection limit problem that comes with running hundreds of concurrent Lambda functions against a PostgreSQL instance.

**Three things to know upfront**

- **No joins.** DynamoDB doesn't support relational queries. Related data is either stored together in the same item (denormalized) or fetched in separate calls.
- **You can only query by primary key or index.** There's no `WHERE name = 'x'` on arbitrary fields. If you need to look up items by a field other than the primary key, you need a secondary index.
- **`scan` reads the entire table.** It works, and it's fine for small tables. At scale it's slow and expensive. Design your access patterns first so you can avoid it in hot paths.

## DynamoDB vs SQL Databases

DynamoDB is not a PostgreSQL replacement. They solve different problems.

|                  | DynamoDB                                     | PostgreSQL / Aurora                                  |
| ---------------- | -------------------------------------------- | ---------------------------------------------------- |
| **Schema**       | Flexible, per-item                           | Fixed, enforced                                      |
| **Queries**      | By primary key or index only                 | Any column with SQL                                  |
| **Joins**        | No                                           | Yes                                                  |
| **Scaling**      | Automatic                                    | Manual (read replicas, instance size)                |
| **Connections**  | HTTP-based, no connection limit              | Persistent connections, pooling required             |
| **Transactions** | Limited (up to 100 items)                    | Full ACID                                            |
| **When to use**  | High throughput, flexible schema, serverless | Complex queries, relational data, strict consistency |

If your data is relational and your queries are complex, use a relational database. If you need high throughput, a flexible schema, and seamless Lambda integration, DynamoDB is worth reaching for.

## Core Concepts

| Term              | What It Is                                                                                                                                                                                                       |
| ----------------- | ---------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| **Table**         | The top-level container. All items for a given entity type go in one table.                                                                                                                                      |
| **Item**          | A single record - like a row in SQL. Can have any attributes, as long as it includes the primary key.                                                                                                            |
| **Attribute**     | A field on an item. DynamoDB is schema-flexible - different items in the same table can have different attributes.                                                                                               |
| **Partition key** | The required part of every primary key. DynamoDB uses it to distribute items across partitions. Choose something with high cardinality (`id`, `userId`) - not something low-cardinality like `status` or `type`. |
| **Sort key**      | An optional second part of the primary key. When present, items with the same partition key are sorted and stored together, enabling range queries within a partition.                                           |
| **Primary key**   | Either just a partition key ("simple primary key"), or partition key + sort key combined ("composite primary key"). Must be unique per item.                                                                     |

**A note on single-table design**

DynamoDB power users advocate for single-table design - storing multiple entity types in one table using a generic `PK`/`SK` pattern. It's powerful and worth learning eventually. For most developers starting out, one table per entity type is simpler, easier to reason about, and fine in practice. That's the approach this article uses.

## Setting Up a Table with CDK

The CDK construct for DynamoDB is `dynamodb.Table`. Secure defaults: no public access, encryption at rest enabled automatically.

```typescript
// lib/api-stack.ts
import * as cdk from "aws-cdk-lib";
import * as dynamodb from "aws-cdk-lib/aws-dynamodb";
import { Construct } from "constructs";

export class ApiStack extends cdk.Stack {
  constructor(scope: Construct, id: string, props?: cdk.StackProps) {
    super(scope, id, props);

    const table = new dynamodb.Table(this, "EventsTable", {
      partitionKey: { name: "id", type: dynamodb.AttributeType.STRING },
      billingMode: dynamodb.BillingMode.PAY_PER_REQUEST,
      removalPolicy: cdk.RemovalPolicy.DESTROY, // use RETAIN in production
    });
  }
}
```

`PAY_PER_REQUEST` billing (also called on-demand mode) charges per read/write operation with no minimum. The alternative is `PROVISIONED`, where you set a fixed read/write capacity - useful when you have predictable, high-volume traffic and want cost predictability.

Grant Lambda functions access to the table using CDK's grant methods instead of attaching broad managed policies:

```typescript
table.grantReadWriteData(myLambdaFunction); // read + write
table.grantReadData(myLambdaFunction); // read only
table.grantWriteData(myLambdaFunction); // write only
```

Pass the table name to the Lambda via environment variable:

```typescript
const fn = new lambda.Function(this, "MyFunction", {
  // ...
  environment: {
    TABLE_NAME: table.tableName,
  },
});
```

## Writing Items with boto3

`put_item` writes a single item to the table. If an item with the same primary key already exists, it is **overwritten** - `put_item` is an upsert, not an insert.

```python
import boto3
import os
import uuid

table = boto3.resource("dynamodb").Table(os.environ["TABLE_NAME"])

# Write a new event
event_id = str(uuid.uuid4())
table.put_item(Item={
    "id": event_id,
    "name": "CDK Workshop",
    "date": "2026-06-15",
    "capacity": 50,
})
```

If you want insert-only behavior - fail if the item already exists - use a `ConditionExpression`:

```python
from boto3.dynamodb.conditions import Attr

table.put_item(
    Item={"id": event_id, "name": "CDK Workshop", "date": "2026-06-15"},
    ConditionExpression=Attr("id").not_exists(),  # fail if id already exists
)
```

This raises a `ConditionalCheckFailedException` if the item exists, which you can catch and handle as a 409 Conflict.

## Reading Items: get_item vs query vs scan

This is where most DynamoDB confusion starts. There are three ways to read data, and they have very different cost and performance characteristics.

### `get_item` - fetch one item by primary key

The fastest and cheapest read operation. If you have the key, use this.

```python
result = table.get_item(Key={"id": "550e8400-e29b-41d4-a716-446655440000"})
event = result.get("Item")  # None if not found

if not event:
    print("Event not found")
else:
    print(event["name"])
```

`result.get("Item")` returns `None` if the key doesn't exist - the key `"Item"` is simply absent from the response dict.

### `query` - fetch multiple items by partition key

`query` is efficient but requires you to specify the partition key exactly. When you add a sort key or secondary index, `query` can also filter by range conditions on the sort key.

```python
from boto3.dynamodb.conditions import Key

# With a composite key table (partition: userId, sort: id)
result = table.query(
    KeyConditionExpression=Key("userId").eq("user-123")
)
events = result["Items"]
```

You can add a `FilterExpression` to `query`, but it filters _after_ DynamoDB reads the matching items - it doesn't reduce read capacity consumption.

### `scan` - read the entire table

`scan` reads every item in the table and optionally applies a filter. Use it for small tables, admin scripts, or data exports. Avoid it in hot API paths.

```python
result = table.scan()
all_events = result["Items"]

# With a filter (filters after reading, does not reduce RCU cost)
from boto3.dynamodb.conditions import Attr

result = table.scan(
    FilterExpression=Attr("date").gte("2026-01-01")
)
filtered_events = result["Items"]
```

**`KeyConditionExpression` vs `FilterExpression`**

`KeyConditionExpression` is evaluated by DynamoDB before reading - it determines which items are read. `FilterExpression` is evaluated after reading - it removes items from the result but you're still billed for reading them. Always prefer `KeyConditionExpression` when possible.

## Updating and Deleting Items

### `update_item`

`update_item` modifies specific attributes on an existing item without overwriting the whole thing. The `UpdateExpression` syntax is awkward but necessary - learn it once.

```python
from boto3.dynamodb.conditions import Attr

table.update_item(
    Key={"id": "550e8400-e29b-41d4-a716-446655440000"},
    UpdateExpression="SET #n = :name, capacity = :cap",
    ExpressionAttributeNames={"#n": "name"},  # "name" is a reserved word
    ExpressionAttributeValues={
        ":name": "CDK Workshop (Updated)",
        ":cap": 75,
    },
)
```

`ExpressionAttributeNames` is needed when your attribute name clashes with a DynamoDB reserved word (like `name`, `status`, `date`). Prefix the placeholder with `#` and map it here.

Setting a single attribute without overwriting others is one of the main reasons `update_item` exists - doing this with `put_item` would require fetching the item first, merging the changes, then writing it back.

### `delete_item`

`delete_item` removes an item by primary key. It's a no-op if the item doesn't exist - no error is raised.

```python
table.delete_item(Key={"id": "550e8400-e29b-41d4-a716-446655440000"})
```

To raise an error if the item doesn't exist, add a `ConditionExpression`:

```python
table.delete_item(
    Key={"id": "550e8400-e29b-41d4-a716-446655440000"},
    ConditionExpression=Attr("id").exists(),
)
```

## Secondary Indexes

By default, you can only query an `EventsTable` by `id`. If you want to look up events by `date`, you're stuck scanning the entire table. That's where secondary indexes come in.

**GSI (Global Secondary Index)** - a completely different primary key on the same table. The most common type.

**LSI (Local Secondary Index)** - same partition key as the table, different sort key. Must be defined at table creation time. Less common.

Add a GSI in CDK:

```typescript
const table = new dynamodb.Table(this, "EventsTable", {
  partitionKey: { name: "id", type: dynamodb.AttributeType.STRING },
  billingMode: dynamodb.BillingMode.PAY_PER_REQUEST,
  removalPolicy: cdk.RemovalPolicy.DESTROY,
});

table.addGlobalSecondaryIndex({
  indexName: "DateIndex",
  partitionKey: { name: "date", type: dynamodb.AttributeType.STRING },
  projectionType: dynamodb.ProjectionType.ALL, // project all attributes
});
```

Query the GSI in Python:

```python
from boto3.dynamodb.conditions import Key

result = table.query(
    IndexName="DateIndex",
    KeyConditionExpression=Key("date").eq("2026-06-15"),
)
events = result["Items"]
```

`ProjectionType.ALL` copies all item attributes into the index. `KEYS_ONLY` copies only the primary key and index key - cheaper storage, but you'd need a second `get_item` call to fetch full item data.

## Using DynamoDB from Lambda

The pattern used in the [REST API article](/articles/building-a-rest-api-with-api-gateway-and-lambda) - initialize boto3 outside the handler, read the table name from an environment variable - is the right approach for Lambda.

```python
import json
import os
import boto3

# Initialized once per execution environment, reused across warm invocations
table = boto3.resource("dynamodb").Table(os.environ["TABLE_NAME"])

def handler(event, context):
    # list
    result = table.scan()
    all_events = result["Items"]

    # create
    record = {"id": str(uuid.uuid4()), "name": "CDK Workshop"}
    table.put_item(Item=record)

    # get one
    result = table.get_item(Key={"id": "some-id"})
    single = result.get("Item")  # None if not found

    # delete
    table.delete_item(Key={"id": "some-id"})
```

**Why initialize outside the handler?**

Lambda reuses execution environments across warm invocations. Code outside the handler runs once when the environment initializes, not on every request. Initializing the boto3 resource once and reusing it saves the connection overhead on every invocation.

**No connection pooling needed**

Unlike PostgreSQL, DynamoDB is HTTP-based. Each operation is a signed HTTPS request - there's no persistent connection to manage or pool. Running 500 concurrent Lambda invocations against DynamoDB doesn't create 500 open connections. This is one of the main architectural reasons DynamoDB pairs so well with Lambda at scale.

## The Takeaway

- **Access patterns first, schema second.** Know how you'll query your data before you design your table and primary key. Changing the primary key later requires recreating the table.
- **Use `get_item` when you have the key.** It's O(1) and the cheapest read operation. Reserve `scan` for small tables, admin scripts, and one-off data exports - not hot API paths.
- **`put_item` is an upsert.** If you need insert-only behavior, add `ConditionExpression=Attr("id").not_exists()` to prevent overwriting existing items.
- **`UpdateExpression` is awkward but important.** Use `update_item` to modify individual attributes without overwriting the whole item. Watch for reserved word conflicts - wrap them in `ExpressionAttributeNames`.
- **Add a GSI for any field you need to query by.** You can't query on arbitrary attributes without one. `ProjectionType.ALL` is the safe default - use `KEYS_ONLY` only when storage cost matters.
- **Initialize boto3 outside the handler.** It's reused across warm invocations and avoids redundant initialization on every request. DynamoDB is HTTP-based, so no connection pooling is needed - one less thing to manage compared to Lambda + RDS.
