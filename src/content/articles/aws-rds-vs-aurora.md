---
title: "AWS RDS vs Aurora: Choosing the Right Managed Database"
date: 2026-03-27
excerpt: Both RDS and Aurora are managed relational databases, but they're built differently. Here's how to choose between them for a new project.
---

## What Is Amazon RDS?

Amazon RDS (Relational Database Service) is a managed service that runs a relational database engine of your choice — PostgreSQL, MySQL, MariaDB, Oracle, SQL Server, or IBM Db2 — on an EC2 instance that AWS manages for you. You pick the instance size, storage type, and engine version. AWS handles OS patching, automatic backups, multi-AZ standby provisioning, and minor version upgrades if you ask it to.

The storage model is straightforward: each RDS instance is backed by an Amazon EBS volume. That volume is gp3 by default, or io2 Block Express if you need higher IOPS. When you provision a Multi-AZ deployment, AWS maintains a standby instance in a separate Availability Zone and synchronously replicates every write from the primary volume to the standby. If the primary fails, AWS flips the DNS endpoint to point at the standby — usually in 60–120 seconds.

RDS is the right baseline to understand first because Aurora is built on top of the same surface area — same APIs, same Parameter Groups, same RDS console — but with a fundamentally different storage architecture underneath.

## RDS Deployment Options

How you deploy RDS determines your availability, read scaling, and recovery characteristics.

**Single-AZ** is a single EC2-backed instance with no standby. This is appropriate for dev and staging environments. If the hardware fails or you initiate a manual failover, you're waiting for a new instance to come up from a snapshot.

**Multi-AZ with standby** provisions a second instance in a different AZ and keeps it synchronized via synchronous block-level replication. The standby is not readable — it exists purely for failover. Automatic failover takes 60–120 seconds and is triggered by AWS when it detects an outage, a storage failure, or an OS-level problem.

**Multi-AZ Cluster** (PostgreSQL and MySQL only) gives you two readable standby instances using semi-synchronous replication. Failover is faster than traditional Multi-AZ, and the standbys can serve read traffic, reducing load on the primary.

**Read Replicas** use asynchronous replication and can be in the same region, a different region, or a different AWS account. You can have up to 5 read replicas per primary instance. Replica lag ranges from subsecond to several seconds depending on write volume. If your primary fails, you can manually promote a replica to primary — but that's a manual step, not an automatic failover.

## What Is Amazon Aurora?

Aurora is AWS's cloud-native relational database engine, compatible with MySQL and PostgreSQL. The compatibility is real — you can point most existing applications at an Aurora endpoint without changing any code. But under the hood, Aurora is a complete reimplementation.

The core difference is the storage architecture. Rather than attaching an EBS volume to a compute instance, Aurora uses a distributed cluster volume that is shared across all compute nodes in the cluster. That volume automatically grows in 10 GiB chunks up to 128 TiB, replicates every write six ways across three Availability Zones, and is managed entirely by the Aurora storage subsystem — not by the instance.

This changes everything about how replication, failover, and read scaling work. Adding a read replica doesn't mean copying data — the replica just connects to the same shared volume. Failover doesn't mean promoting a second copy of the data — it means pointing a new writer at the existing volume. The compute and the storage are decoupled by design.

## Aurora Configurations

**Aurora PostgreSQL** and **Aurora MySQL** are the two engine options. Both are API-compatible with their open-source counterparts, though Aurora ships slightly behind the latest upstream version. If being on PostgreSQL 17 the week it releases matters to your application, check the current Aurora version support before committing.

**Aurora Serverless v2** replaces the previous Serverless v1 offering. Instead of provisioned instances with fixed vCPUs and RAM, Serverless v2 instances are measured in Aurora Capacity Units (ACUs). Each ACU is approximately 2 GiB of memory plus corresponding CPU. You set a minimum and a maximum — say, 0.5 ACU minimum and 32 ACU maximum — and Aurora scales continuously within that range in 0.5 ACU increments. Scaling is near-instant, not the minutes-long cold-start of the original serverless offering.

**Aurora Global Database** spans up to five AWS regions. A single primary region handles writes. Up to five secondary regions replicate data with sub-second RPO using Aurora's own storage-layer replication (not logical replication). Secondary regions are readable and can be promoted to primary in a disaster recovery scenario in under a minute.

**I/O-Optimized pricing** is a cluster configuration, not a deployment type. In the default pricing model, you pay per I/O operation. I/O-Optimized eliminates per-I/O charges and raises the cluster cost by about 25% — it becomes cost-effective when I/O charges exceed 25% of your total Aurora bill, which happens quickly on write-heavy workloads.

## Aurora Serverless v2

Aurora Serverless v2 is worth its own section because it changes the cost and operations model significantly.

In a standard provisioned Aurora cluster, you choose an instance class — `db.r8g.large`, `db.r8g.xlarge`, and so on — and you pay for that compute 24 hours a day even when your database is idle at 3am. Serverless v2 fixes this for variable workloads by billing per ACU-hour at the current capacity level.

The minimum viable configuration is a writer configured as Serverless v2 with a `minCapacity` of 0.5 ACU. For dev environments, this brings your overnight cost close to zero. For production, you set a higher minimum — 2–4 ACU is common — to avoid the brief latency spike of scaling from near-zero to operating capacity on the first request of the day.

One important difference from the original Serverless v1: Serverless v2 instances do not scale to zero. The minimum is 0 ACU on paper, but the instance is never fully paused — you don't get the cold-start problem of v1, and you don't get zero cost when idle either. For genuine "zero when idle" behavior, you'd need to stop the cluster manually or accept that v2 has a floor.

You can mix Serverless v2 instances and provisioned instances in the same cluster. A common pattern is a provisioned writer (for predictable write latency) with Serverless v2 readers (for burst-scalable read capacity).

## Under the Hood: How the Storage Differs

This architectural difference explains every number in the comparison table.

In a standard RDS Multi-AZ deployment, the primary instance writes to its EBS volume. That write is synchronously mirrored to the standby's EBS volume before the database acknowledges it to the client. If the primary fails, AWS promotes the standby — which means switching the DNS CNAME and waiting for the OS and database process to come up on what was previously the standby instance. That process takes 60–120 seconds.

In Aurora, the primary instance sends writes to the distributed storage layer — six storage nodes across three AZs — and the write is acknowledged once four of six storage nodes confirm it. The Aurora read replicas don't receive those writes over the network; they just read from the same storage layer the writer uses. Replica lag is almost always under 100ms because replicas are reading a shared volume, not applying a replication stream.

When an Aurora writer fails, the failover is a pointer swap, not a data copy. A replica is promoted to writer by pointing it at the same distributed volume — no data needs to move. Aurora targets under 30 seconds for this failover, and in practice it's often faster.

## Head to Head

| Feature | RDS (PostgreSQL / MySQL) | Aurora (PostgreSQL / MySQL) |
|---|---|---|
| Max read replicas | 5 | 15 |
| Typical replica lag | Subsecond to several seconds | < 100ms (usually) |
| Multi-AZ failover time | 60–120 seconds | < 30 seconds |
| Max storage | 64 TiB | 128 TiB (auto-grows) |
| Serverless compute | ❌ | ✅ Aurora Serverless v2 |
| Cross-region replication | Read replicas (async) | Global Database (sub-second RPO) |
| Oracle / SQL Server support | ✅ | ❌ |
| IBM Db2 support | ✅ | ❌ |
| I/O billing model choice | No | ✅ I/O-Optimized option |
| Cost baseline (same instance class) | Lower | Higher (~20–30% on compute) |
| Storage auto-scaling | Manual (allocate + autoscale) | Fully automatic |
| Performance Insights | ✅ | ✅ |
| RDS Proxy support | ✅ | ✅ |

## Aurora Global Database

Global Database is Aurora's answer to multi-region HA. One primary region accepts writes. Up to five secondary regions replicate reads from the primary using dedicated replication infrastructure built into the Aurora storage layer — not application-level logical replication.

The replication lag is typically under one second. RPO (Recovery Point Objective) is sub-second on modern Global Database configurations. RTO (Recovery Time Objective) for a managed failover — where you promote a secondary to primary — is under a minute.

Secondary regions expose read endpoints. Applications in those regions can query locally instead of routing across the globe to the primary. For a product with users in the US and Europe, this can cut read latency from 150ms to under 10ms for EU users.

When you need to failover to a secondary region — either due to a regional outage or as a planned DR drill — you initiate a "managed planned failover" or a "fast failover" from the console or CLI. The secondary is promoted to primary, and the old primary (if it comes back) becomes a secondary.

## When to Choose RDS

**You need Oracle, SQL Server, or IBM Db2.** Aurora supports only PostgreSQL and MySQL. If your application is licensed for Oracle or SQL Server, RDS is your only managed option on AWS.

**Budget is the primary constraint and workloads are predictable.** For a dev/staging PostgreSQL instance running 8 hours a day with modest write volume, RDS is cheaper. The Aurora storage layer has overhead that doesn't pay for itself on small, steady workloads.

**You need io2 Block Express for extreme IOPS.** RDS supports io2 Block Express storage with up to 256,000 IOPS per instance. Aurora's per-I/O model can get expensive at that scale — I/O-Optimized Aurora is a better fit in most cases, but io2 on RDS is an option if you have very specific IOPS requirements with an existing RDS workload.

**You're on MariaDB.** Aurora does not have a MariaDB-compatible engine. If your application uses MariaDB-specific extensions or syntax, RDS is your path.

**You're cautious about Aurora's version lag.** Aurora PostgreSQL and Aurora MySQL ship behind the upstream releases by a few months to over a year depending on the major version. If you need the latest PostgreSQL features quickly, RDS moves faster.

## When to Choose Aurora

**You're building a production HA system on PostgreSQL or MySQL.** Aurora's 30-second failover, 15-read-replica limit, and shared-volume architecture make it the better HA story for applications where downtime is expensive.

**Your read traffic is significant.** Fifteen read replicas connected to the same storage volume, with consistent sub-100ms replica lag, is a fundamentally different scaling story from five async replicas with unpredictable lag.

**Traffic is spiky or unpredictable.** Aurora Serverless v2 scales compute continuously without the cold-start penalty of the original serverless offering. If you have a B2C application where traffic doubles during a campaign or drops to near-zero on weekends, Serverless v2 bridges the gap between "always-on provisioned" and "pay only for what you use."

**You need cross-region DR or global read performance.** Global Database is Aurora-only. RDS cross-region read replicas work, but their recovery story requires manual promotion and their replication is async with potentially larger lag.

**You're write-heavy enough that I/O costs on Aurora's default pricing are a concern.** Switch to I/O-Optimized Aurora and eliminate per-I/O charges entirely.

## Deploying with CDK

Both RDS and Aurora use constructs from `aws-cdk-lib/aws-rds`.

### RDS PostgreSQL (Multi-AZ)

```typescript
import * as ec2 from "aws-cdk-lib/aws-ec2";
import * as rds from "aws-cdk-lib/aws-rds";
import * as cdk from "aws-cdk-lib";

const instance = new rds.DatabaseInstance(this, "AppDb", {
  engine: rds.DatabaseInstanceEngine.postgres({
    version: rds.PostgresEngineVersion.VER_16,
  }),
  instanceType: ec2.InstanceType.of(
    ec2.InstanceClass.R8G,
    ec2.InstanceSize.LARGE,
  ),
  vpc,
  vpcSubnets: { subnetType: ec2.SubnetType.PRIVATE_ISOLATED },
  multiAz: true,
  storageType: rds.StorageType.GP3,
  allocatedStorage: 100,
  storageEncrypted: true,
  deletionProtection: true,
  backupRetention: cdk.Duration.days(7),
  enablePerformanceInsights: true,
});
```

The `multiAz: true` flag provisions the synchronous standby in a separate AZ. `PRIVATE_ISOLATED` ensures the instance has no direct internet route — connections come through your application tier or RDS Proxy.

### Aurora PostgreSQL Cluster (Serverless v2)

```typescript
const cluster = new rds.DatabaseCluster(this, "AppCluster", {
  engine: rds.DatabaseClusterEngine.auroraPostgres({
    version: rds.AuroraPostgresEngineVersion.VER_16_2,
  }),
  writer: rds.ClusterInstance.serverlessV2("writer"),
  readers: [
    rds.ClusterInstance.serverlessV2("reader1", {
      scaleWithWriter: true,
    }),
  ],
  serverlessV2MinCapacity: 0.5,
  serverlessV2MaxCapacity: 32,
  vpc,
  vpcSubnets: { subnetType: ec2.SubnetType.PRIVATE_ISOLATED },
  storageEncrypted: true,
  deletionProtection: true,
  backup: {
    retention: cdk.Duration.days(7),
  },
});
```

`scaleWithWriter: true` tells Aurora to scale the reader in proportion to the writer's utilization — useful for read replicas that mirror primary load. The `serverlessV2MinCapacity` and `serverlessV2MaxCapacity` values apply to all Serverless v2 instances in the cluster, not per-reader.

### Provisioned Aurora PostgreSQL Cluster

If you want provisioned instances instead of Serverless v2 — for more predictable compute costs at sustained load:

```typescript
const cluster = new rds.DatabaseCluster(this, "AppCluster", {
  engine: rds.DatabaseClusterEngine.auroraPostgres({
    version: rds.AuroraPostgresEngineVersion.VER_16_2,
  }),
  writer: rds.ClusterInstance.provisioned("writer", {
    instanceType: ec2.InstanceType.of(
      ec2.InstanceClass.R8G,
      ec2.InstanceSize.LARGE,
    ),
  }),
  readers: [
    rds.ClusterInstance.provisioned("reader1", {
      instanceType: ec2.InstanceType.of(
        ec2.InstanceClass.R8G,
        ec2.InstanceSize.LARGE,
      ),
    }),
  ],
  vpc,
  vpcSubnets: { subnetType: ec2.SubnetType.PRIVATE_ISOLATED },
  storageEncrypted: true,
  deletionProtection: true,
});
```

Both writer and reader share the same distributed storage volume — the instance type only determines compute capacity, not storage behavior.

## Production Considerations

**RDS Proxy for connection pooling.** Lambda functions and auto-scaled EC2 instances can open hundreds of short-lived database connections. RDS Proxy sits in front of the database, pools connections, and presents a stable endpoint to your application. It works with both RDS and Aurora and is worth enabling for any workload with fluctuating connection counts.

**Performance Insights.** Enable it on every instance. The 7-day retention window is free, and the query-level visualization is invaluable when diagnosing slow queries. Aurora's native Performance Insights integrates with the cluster's wait event data for deeper analysis than RDS.

**Automated backups and PITR.** Both RDS and Aurora take automated daily snapshots and maintain transaction logs for Point-in-Time Recovery (PITR). Set `backupRetention` to at least 7 days in production. Aurora's PITR can restore to any second within the retention window, not just the last snapshot.

**Aurora I/O-Optimized.** If your Aurora I/O charges regularly exceed 25% of your total Aurora bill, switching to I/O-Optimized pricing eliminates per-I/O charges at the cost of ~25% higher cluster pricing. Run a week of CloudWatch billing data before deciding — the crossover point is higher than most people expect.

**Encryption at rest.** Set `storageEncrypted: true` in CDK. Encryption uses AWS KMS and has no meaningful performance impact. You cannot enable encryption on an existing unencrypted instance — you'd have to snapshot, restore to an encrypted cluster, and cut over.

**Parameter Groups.** Both engines use Parameter Groups to configure engine-level settings. Aurora has Cluster Parameter Groups (cluster-wide) and DB Parameter Groups (instance-level). Custom parameter groups let you tune settings like `work_mem`, `max_connections`, `shared_buffers`, and log levels without replacing the cluster.

**Storage autoscaling on RDS.** Unlike Aurora's fully automatic storage, RDS requires you to set `maxAllocatedStorage` to enable autoscaling. Without it, your instance will run out of storage and go into read-only mode. Set it.

## The Takeaway

- **Aurora and RDS share the same interface, not the same architecture.** Aurora's distributed shared-volume storage is why it has faster failover, lower replica lag, and higher read replica limits — not better EC2 hardware.

- **The 30-second Aurora failover isn't magic — it's a pointer swap.** Because all nodes read from the same storage layer, promoting a replica means re-pointing the writer endpoint, not copying data. That's why it's fast once the cluster is healthy.

- **Serverless v2 is a different cost model, not a different database.** If your traffic is variable — B2C apps, dev environments, scheduled batch pipelines — Serverless v2's per-ACU-hour billing and continuous scaling can cut idle costs significantly without sacrificing availability.

- **RDS is not a second-class option.** If you need Oracle or SQL Server, need MariaDB, have a tight budget and a steady workload, or want io2 Block Express IOPS, RDS is the right choice. Aurora's higher compute cost doesn't pay for itself on every workload.

- **Global Database is the gap-closer for multi-region.** Read replicas across regions work, but they're async with no guaranteed lag. Global Database gives you sub-second RPO cross-region with readable secondaries, which is a different tier of disaster recovery entirely.

Choose Aurora if you're on PostgreSQL or MySQL and availability, read scalability, or variable load matters. Choose RDS if you're on a non-Aurora engine, working under budget pressure, or need storage types that Aurora doesn't expose. Either way, enable Performance Insights, set deletion protection, and use a private isolated subnet — those decisions apply to both.
