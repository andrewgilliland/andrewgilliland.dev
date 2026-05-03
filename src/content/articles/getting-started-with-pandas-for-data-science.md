---
title: Getting Started with Pandas for Data Science
date: 2026-05-03
excerpt: Pandas is Python's answer to working with tabular data. Here's a practical intro for developers who've never touched a DataFrame.
draft: false
tags: ["python", "data-science", "pandas"]
---

If you've worked with tables in SQL or spreadsheets in Excel, you already understand the shape of what pandas does. Pandas is Python's library for working with tabular data - loading it, cleaning it, transforming it, and summarizing it. It's the foundation of almost every data science workflow in Python.

This article is a practical intro. You'll load real data, filter rows, transform columns, group by categories, and export results. No prior data science experience required.

All the code from this article is available in the companion repo: [andrewgilliland/intro-to-pandas](https://github.com/andrewgilliland/intro-to-pandas).

## What Is Pandas?

Pandas is an open source Python library built on top of NumPy. It gives you two primary data structures: **DataFrame** (a table with rows and columns) and **Series** (a single column). Almost everything you do in pandas involves one or both of these.

The name comes from "panel data," a term from econometrics. You don't need to know what that means. What matters is that a DataFrame works like a spreadsheet or a SQL result set that you can manipulate entirely in Python.

Pandas is not a database and it's not built for real-time processing. It loads data into memory and operates on it there. For datasets that fit in RAM (anything up to a few hundred MB, comfortably), it's the fastest tool for exploratory work and data prep.

## Setting Up with uv

The examples below assume you're using [uv](https://docs.astral.sh/uv/) as your Python package manager. If you're not, `pip install pandas` works fine too.

To follow along with the companion repo:

```bash
git clone https://github.com/andrewgilliland/intro-to-pandas
cd intro-to-pandas
uv sync
uv run main.py
```

Or start a fresh project from scratch:

```bash
uv init data-project
cd data-project
uv add pandas
```

Start an interactive Python session or create an `explore.py` file. All the examples below run in either context.

```python
import pandas as pd
```

The `pd` alias is universal convention - every pandas tutorial and Stack Overflow answer uses it.

## DataFrames and Series

You can create a DataFrame from a Python dict:

```python
data = {
    "name": ["Alice", "Bob", "Carol", "Dave"],
    "department": ["Engineering", "Marketing", "Engineering", "Sales"],
    "salary": [95000, 72000, 105000, 68000],
    "years": [3, 5, 7, 2],
}

df = pd.DataFrame(data)
print(df)
```

```
    name   department  salary  years
0  Alice  Engineering   95000      3
1    Bob    Marketing   72000      5
2  Carol  Engineering  105000      7
3   Dave        Sales   68000      2
```

Each column is a **Series** - a one-dimensional array with an index. You access a column like a dict key:

```python
print(df["salary"])
# 0     95000
# 1     72000
# 2    105000
# 3     68000
# Name: salary, dtype: int64
```

A few properties you'll use constantly:

```python
df.shape       # (4, 4) - rows, columns
df.dtypes      # column types
df.head(2)     # first 2 rows
df.tail(2)     # last 2 rows
df.info()      # summary: types, null counts, memory usage
df.describe()  # statistics: mean, std, min, max for numeric columns
```

## Reading Data from CSV and JSON

In practice you rarely create DataFrames by hand. You load them from files.

```python
# CSV
df = pd.read_csv("employees.csv")

# JSON (array of objects)
df = pd.read_json("employees.json")

# From a URL
df = pd.read_csv("https://example.com/data.csv")
```

Pandas infers column types automatically. After loading, always check what you got:

```python
df.head()
df.dtypes
df.shape
```

Common options for `read_csv`:

```python
df = pd.read_csv(
    "employees.csv",
    usecols=["name", "salary", "department"],  # load only these columns
    dtype={"salary": float},                   # force a column type
    na_values=["N/A", "none", ""],             # treat these as NaN
)
```

Missing values in pandas are represented as `NaN`. Check for them with:

```python
df.isnull().sum()  # count of nulls per column
df.dropna()        # drop rows with any null
df.fillna(0)       # replace nulls with 0
```

## Selecting and Filtering Rows

Selecting a single column returns a Series. Selecting multiple columns (pass a list) returns a DataFrame:

```python
df["salary"]                    # Series
df[["name", "salary"]]          # DataFrame
```

To filter rows, use a boolean condition:

```python
# employees earning over 80k
df[df["salary"] > 80000]

# engineering department only
df[df["department"] == "Engineering"]

# combine conditions with & (and) or | (or)
df[(df["salary"] > 80000) & (df["department"] == "Engineering")]
```

For label-based selection, use `.loc[rows, columns]`:

```python
df.loc[0]                              # row at index label 0
df.loc[0:2, ["name", "salary"]]        # rows 0-2, specific columns
df.loc[df["years"] >= 5, "salary"]     # filtered rows, one column
```

For position-based selection, use `.iloc[rows, columns]` - this works like Python list slicing:

```python
df.iloc[0]        # first row
df.iloc[0:3]      # first three rows
df.iloc[:, 1:3]   # all rows, columns at positions 1 and 2
```

## Adding and Transforming Columns

Adding a new column is as simple as assignment:

```python
df["bonus"] = df["salary"] * 0.10
df["total_comp"] = df["salary"] + df["bonus"]
```

For more complex transformations, use `.apply()` with a function:

```python
def seniority(years):
    if years < 2:
        return "Junior"
    elif years < 5:
        return "Mid"
    else:
        return "Senior"

df["level"] = df["years"].apply(seniority)
```

Or use a lambda for one-liners:

```python
df["salary_k"] = df["salary"].apply(lambda x: f"${x // 1000}k")
```

For vectorized string operations, pandas provides `.str` accessor methods:

```python
df["name_upper"] = df["name"].str.upper()
df["dept_short"] = df["department"].str[:3]     # first 3 characters
df["is_eng"] = df["department"].str.contains("Engineering")
```

To drop a column:

```python
df = df.drop(columns=["bonus"])
```

To rename columns:

```python
df = df.rename(columns={"salary_k": "salary_display"})
```

## Grouping and Aggregating

`groupby()` works like SQL `GROUP BY`. Split the data into groups, apply a function, combine the results.

```python
# average salary by department
df.groupby("department")["salary"].mean()

# multiple aggregations at once
df.groupby("department").agg(
    avg_salary=("salary", "mean"),
    max_salary=("salary", "max"),
    headcount=("name", "count"),
)
```

```
              avg_salary  max_salary  headcount
department
Engineering      100000      105000          2
Marketing         72000       72000          1
Sales             68000       68000          1
```

Common aggregation functions: `mean`, `sum`, `count`, `min`, `max`, `std`, `median`, `nunique` (count of unique values).

Sort the result with `sort_values()`:

```python
summary = df.groupby("department")["salary"].mean().reset_index()
summary = summary.sort_values("salary", ascending=False)
```

`reset_index()` converts the group keys back into regular columns, which is usually what you want when saving or displaying results.

## Exporting Your Results

```python
# CSV (most common)
df.to_csv("output.csv", index=False)

# JSON
df.to_json("output.json", orient="records", indent=2)
```

The `index=False` option for CSV stops pandas from writing the row index (0, 1, 2, ...) as the first column. Leave it out if you explicitly want that index in your output file.

The `orient="records"` option for JSON produces an array of objects, which is what most APIs and JavaScript applications expect:

```json
[
  { "name": "Alice", "department": "Engineering", "salary": 95000, "years": 3 },
  { "name": "Carol", "department": "Engineering", "salary": 105000, "years": 7 }
]
```

## The Takeaway

Pandas covers most of what you'd write SQL for, entirely in Python: loading data, filtering rows, computing new columns, grouping and summarizing. The `read_csv` / `groupby` / `to_csv` pattern alone handles a huge class of real data prep tasks.

From here, [Cleaning and Exploring Data with Python](/articles/cleaning-and-exploring-data-with-python) goes deeper on handling messy real-world data - nulls, type coercions, outliers, and exploratory analysis. When you're ready to build models on top of prepared data, [Intro to Machine Learning with scikit-learn](/articles/intro-to-machine-learning-with-scikit-learn) picks up from there. And if you want to visualize what you're finding, [Data Visualization with D3](/articles/data-visualization-with-d3) covers the JavaScript side.
