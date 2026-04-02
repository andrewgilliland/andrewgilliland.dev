---
title: "Setting Up SQLAlchemy Data Models with AWS Aurora"
date: 2026-04-01
excerpt: You have an Aurora database running in AWS. Now you need to get your schema into it. Here's how to define your data models with SQLAlchemy, manage migrations with Alembic, and run them against Aurora - step by step.
draft: false
---

## The Problem

You have an Aurora cluster running in AWS. You have a Python backend that needs tables, columns, and relationships in that database. The question is: how do you get your schema into it, and how do you keep it in sync as your models change over time?

The answer is migrations. Versioned scripts that define your schema changes incrementally and apply them in order. You run them once, they record what they did, and running them again is a no-op.

The standard Python toolchain for this is **SQLAlchemy** (data model definitions) and **Alembic** (migration generation and execution).

## The Tools

**SQLAlchemy** is a Python ORM. You define your database tables as Python classes, and SQLAlchemy maps them to the actual schema. It connects to both Aurora PostgreSQL and Aurora MySQL.

**Alembic** is the migration tool built for SQLAlchemy. It diffs your model definitions against the current database state, generates versioned migration scripts, and tracks which ones have been applied in an `alembic_version` table it manages in your database.

One thing worth knowing upfront: the model definitions and the query layer are independent. Using SQLAlchemy to define your models and Alembic to run migrations doesn't lock you into the SQLAlchemy ORM for queries. Once the schema is in your database, you're free to query with raw SQL, `psycopg2`, `asyncpg`, or any other driver.

## Project Structure

```
myapp/
├── alembic/
│   ├── env.py          # Alembic config - connects to your models and DB URL
│   └── versions/       # generated migration scripts live here
├── models/
│   ├── __init__.py     # registers all models so Alembic can find them
│   ├── venue.py        # Venue model
│   └── event.py        # Event model
├── database.py         # engine, session, and shared Base class
├── alembic.ini         # Alembic settings (DB URL is intentionally left blank here)
└── pyproject.toml      # project dependencies managed by uv
```

## Step 1: Install Dependencies

If you don't have a project yet, initialize one with uv first:

```bash
uv init myapp
cd myapp
```

Then add the dependencies:

```bash
uv add sqlalchemy alembic psycopg2-binary
```

For Aurora MySQL, swap `psycopg2-binary` for `pymysql`.

uv creates a virtual environment automatically and pins dependencies in `pyproject.toml`. No manual venv activation needed — prefix commands with `uv run` to run them inside the project environment.

## Step 2: Set Up the Database Connection

Create `database.py` with your engine and a shared `Base` class that all models will inherit from:

```python
# database.py
import os
from sqlalchemy import create_engine
from sqlalchemy.orm import sessionmaker, DeclarativeBase

DATABASE_URL = os.environ["DATABASE_URL"]
# postgresql+psycopg2://user:password@your-cluster.cluster-xxx.us-east-1.rds.amazonaws.com:5432/mydb

engine = create_engine(DATABASE_URL, pool_pre_ping=True)
SessionLocal = sessionmaker(bind=engine)

class Base(DeclarativeBase):
    pass
```

`pool_pre_ping=True` sends a lightweight check before using any connection from the pool. Aurora can drop idle connections, so this prevents stale connection errors on reuse.

Keep the `DATABASE_URL` in an environment variable - never hardcode credentials. On AWS, populate it from Secrets Manager or SSM Parameter Store.

### Configuring for Multiple Environments

Use an `ENV` variable to control which database each environment connects to. The `DATABASE_URL` for each environment is set separately - in a `.env` file locally, and in Secrets Manager or SSM Parameter Store for staging and prod:

```python
# database.py
import os
from sqlalchemy import create_engine
from sqlalchemy.orm import sessionmaker, DeclarativeBase

ENV = os.environ.get("ENV", "dev")

DATABASE_URLS = {
    "dev":     os.environ.get("DEV_DATABASE_URL", "postgresql+psycopg2://postgres:postgres@localhost:5432/myapp_dev"),
    "staging": os.environ["STAGING_DATABASE_URL"],
    "prod":    os.environ["PROD_DATABASE_URL"],
}

DATABASE_URL = DATABASE_URLS[ENV]

engine = create_engine(DATABASE_URL, pool_pre_ping=True)
SessionLocal = sessionmaker(bind=engine)

class Base(DeclarativeBase):
    pass
```

`dev` has a fallback to a local Postgres instance so you don't need the env var set during local development. `staging` and `prod` have no fallback - if the variable isn't set, the app fails loudly at startup rather than silently connecting to the wrong database.

The `alembic/env.py` resolves the same way:

```python
# alembic/env.py
import os
import sys

sys.path.insert(0, os.path.dirname(os.path.dirname(__file__)))

from database import DATABASE_URL  # already resolved for the current ENV
from alembic import context

config = context.config
config.set_main_option("sqlalchemy.url", DATABASE_URL)
# ... rest of env.py unchanged
```

Running migrations against a specific environment is then just:

```bash
ENV=dev     uv run alembic upgrade head   # local dev DB
ENV=staging uv run alembic upgrade head   # staging Aurora cluster
ENV=prod    uv run alembic upgrade head   # production Aurora cluster
```

In CI/CD, `ENV` is set as a pipeline variable or injected via the deployment environment - the migration command itself stays the same across all three.

## Step 3: Define Your Models

Each model is a Python class that inherits from `Base`. Create one file per model or group related models together:

```python
# models/venue.py
from sqlalchemy import String, Integer, DateTime, func
from sqlalchemy.orm import Mapped, mapped_column
from database import Base

class Venue(Base):
    __tablename__ = "venues"

    id: Mapped[int] = mapped_column(Integer, primary_key=True, autoincrement=True)
    name: Mapped[str] = mapped_column(String(255), nullable=False)
    address: Mapped[str] = mapped_column(String(500), nullable=False)
    city: Mapped[str] = mapped_column(String(100), nullable=False)
    capacity: Mapped[int] = mapped_column(Integer, nullable=False)
    created_at: Mapped[DateTime] = mapped_column(DateTime, server_default=func.now())
```

```python
# models/event.py
from sqlalchemy import String, Integer, Text, ForeignKey, DateTime, func
from sqlalchemy.orm import Mapped, mapped_column
from database import Base

class Event(Base):
    __tablename__ = "events"

    id: Mapped[int] = mapped_column(Integer, primary_key=True, autoincrement=True)
    name: Mapped[str] = mapped_column(String(255), nullable=False)
    description: Mapped[str | None] = mapped_column(Text, nullable=True)
    start_at: Mapped[DateTime] = mapped_column(DateTime, nullable=False)
    venue_id: Mapped[int] = mapped_column(Integer, ForeignKey("venues.id"), nullable=False)
    created_at: Mapped[DateTime] = mapped_column(DateTime, server_default=func.now())
```

Register all models in `models/__init__.py`. This ensures Alembic sees every model when it scans `Base.metadata`:

```python
# models/__init__.py
from .venue import Venue
from .event import Event
```

If you add a new model file later, import it here and Alembic will pick it up automatically on the next autogenerate run.

## Step 4: Initialize Alembic

Run this once in your project root:

```bash
uv run alembic init alembic
```

This generates `alembic.ini` and `alembic/env.py`.

## Step 5: Configure `alembic.ini`

Find the `sqlalchemy.url` line and clear it. You'll set the URL dynamically from the environment in `env.py` instead of hardcoding it here:

```ini
sqlalchemy.url =
```

## Step 6: Configure `alembic/env.py`

This is where Alembic is told about your models and where to find the database URL. Replace the generated file with this:

```python
# alembic/env.py
import os
import sys
from logging.config import fileConfig

from sqlalchemy import engine_from_config, pool
from alembic import context

# Put the project root on the path so imports work
sys.path.insert(0, os.path.dirname(os.path.dirname(__file__)))

from database import Base
import models  # registers all models on Base.metadata

config = context.config

# Read the DB URL from the environment at migration time
config.set_main_option("sqlalchemy.url", os.environ["DATABASE_URL"])

if config.config_file_name is not None:
    fileConfig(config.config_file_name)

target_metadata = Base.metadata


def run_migrations_offline() -> None:
    url = config.get_main_option("sqlalchemy.url")
    context.configure(url=url, target_metadata=target_metadata, literal_binds=True)
    with context.begin_transaction():
        context.run_migrations()


def run_migrations_online() -> None:
    connectable = engine_from_config(
        config.get_section(config.config_ini_section),
        prefix="sqlalchemy.",
        poolclass=pool.NullPool,
    )
    with connectable.connect() as connection:
        context.configure(connection=connection, target_metadata=target_metadata)
        with context.begin_transaction():
            context.run_migrations()


if context.is_offline_mode():
    run_migrations_offline()
else:
    run_migrations_online()
```

The two key lines: `import models` forces all model classes to register themselves on `Base.metadata`, and `config.set_main_option("sqlalchemy.url", ...)` pulls the connection string from the environment at runtime instead of the config file.

## Step 7: Generate the First Migration

With your Aurora cluster reachable and `DATABASE_URL` set, run:

```bash
export DATABASE_URL="postgresql+psycopg2://user:password@your-cluster.cluster-xxx.us-east-1.rds.amazonaws.com:5432/mydb"

uv run alembic revision --autogenerate -m "create venues and events tables"
```

Alembic connects to your database, compares your models against the current schema (empty on first run), and writes a migration file in `alembic/versions/`:

```python
# alembic/versions/abc123_create_venues_and_events_tables.py
import sqlalchemy as sa
from alembic import op

def upgrade() -> None:
    op.create_table(
        "venues",
        sa.Column("id", sa.Integer(), autoincrement=True, nullable=False),
        sa.Column("name", sa.String(length=255), nullable=False),
        sa.Column("address", sa.String(length=500), nullable=False),
        sa.Column("city", sa.String(length=100), nullable=False),
        sa.Column("capacity", sa.Integer(), nullable=False),
        sa.Column("created_at", sa.DateTime(), server_default=sa.text("now()"), nullable=True),
        sa.PrimaryKeyConstraint("id"),
    )
    op.create_table(
        "events",
        sa.Column("id", sa.Integer(), autoincrement=True, nullable=False),
        sa.Column("name", sa.String(length=255), nullable=False),
        sa.Column("description", sa.Text(), nullable=True),
        sa.Column("start_at", sa.DateTime(), nullable=False),
        sa.Column("venue_id", sa.Integer(), nullable=False),
        sa.Column("created_at", sa.DateTime(), server_default=sa.text("now()"), nullable=True),
        sa.ForeignKeyConstraint(["venue_id"], ["venues.id"]),
        sa.PrimaryKeyConstraint("id"),
    )

def downgrade() -> None:
    op.drop_table("events")
    op.drop_table("venues")
```

Always review the generated migration before applying it. Autogenerate is accurate for table creates and drops but can miss some column type changes - treat it as a starting point you verify, not a finished artifact.

## Step 8: Apply the Migration to Aurora

```bash
uv run alembic upgrade head
```

Alembic creates the `alembic_version` table in Aurora on first run, applies your migration, and records the version. Running it again is a no-op - it only applies versions that haven't been applied yet.

## Step 9: Ongoing Workflow - Adding a Column

This is the pattern you'll repeat every time your models change.

Add the new field to your model:

```python
# models/event.py
class Event(Base):
    __tablename__ = "events"
    ...
    ticket_price: Mapped[int | None] = mapped_column(Integer, nullable=True)
```

Generate a new migration:

```bash
uv run alembic revision --autogenerate -m "add ticket_price to events"
```

Review the generated file, then apply:

```bash
uv run alembic upgrade head
```

That's the full loop. Change the model, generate, review, apply.

## Useful Commands

```bash
uv run alembic current        # which migration version is currently applied to the DB
uv run alembic history        # full list of all migrations in chronological order
uv run alembic downgrade -1   # roll back one migration
uv run alembic downgrade base # roll all the way back to an empty schema
```

## Running Migrations in CI/CD

Migrations should run before your new application code goes live - not after. The pattern in GitHub Actions:

```yaml
- name: Run database migrations
  env:
    DATABASE_URL: ${{ secrets.DATABASE_URL }}
  run: uv run alembic upgrade head

- name: Deploy application
  run: # your deploy step here
```

Migrate first, then deploy. The database schema needs to be at least as new as the code querying it before traffic switches over.

For Lambda-based backends: don't run migrations inside a Lambda function. Schema changes can take longer than expected, and Lambda's 15-minute ceiling is the wrong place for that. Run migrations from a CodeBuild job, an ECS task, or a GitHub Actions step that has network access to your Aurora cluster.

## The Takeaway

- **SQLAlchemy defines the models, Alembic manages the migrations.** They're separate tools with separate jobs - you can swap out either one independently.
- **`pool_pre_ping=True` is not optional for Aurora.** Aurora drops idle connections. The ping check keeps your connection pool healthy.
- **Never hardcode your `DATABASE_URL`.** Pull it from an environment variable, populated from Secrets Manager or SSM Parameter Store on AWS.
- **Always review autogenerated migrations before applying them.** Alembic is accurate for most changes but not infallible - column type changes in particular can get missed.
- **Migrate before deploying, not after.** Schema changes need to be in place before the code that depends on them goes live.
- **The query layer is separate from the model layer.** Defining models with SQLAlchemy and running migrations with Alembic doesn't commit you to the SQLAlchemy ORM for queries. Raw SQL and other drivers work fine against the same database.
