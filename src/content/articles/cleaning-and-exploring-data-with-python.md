---
title: Cleaning and Exploring Data with Python
date: 2026-05-14
excerpt: Real data is messy. Here's how to handle missing values, fix types, and explore datasets before doing anything useful with them.
draft: true
tags: ["python", "data-science", "pandas"]
---

[Getting Started with Pandas for Data Science](/articles/getting-started-with-pandas-for-data-science) covers loading, filtering, grouping, and exporting. But that assumes your data is already clean. In practice, data is almost never clean. Columns have missing values. Types are wrong. Rows are duplicated. String fields have inconsistent casing or extra whitespace.

Before you can train a model, build a pipeline, or generate a chart, you need to deal with all of that. Data cleaning is the part of data work that nobody talks about but that takes up most of the time.

This article covers the full cleaning workflow using the Titanic dataset - a real-world dataset with missing values, mixed types, and interesting distributions that make it ideal for this kind of work.

## Why Data Cleaning Matters

Models, aggregations, and charts all depend on the quality of their input. A `mean()` on a column with missing values silently skips the gaps. A `groupby` on a column where `"Male"` and `"male"` are both present splits what should be one group into two. A date column stored as a string can't be sorted, bucketed, or compared with anything.

The rule is simple: garbage in, garbage out. You can't fix bad data downstream. Clean it before you do anything with it.

## Loading a Real Dataset

Seaborn ships with several real datasets for exactly this kind of work. The Titanic dataset has 891 rows and 15 columns, with missing values in several columns and a mix of numeric, categorical, and boolean types:

```python
import pandas as pd
import seaborn as sns

df = sns.load_dataset("titanic")
```

This loads a cleaned-but-not-fully-clean version of the dataset. Perfect for our purposes.

If you're not using seaborn, you can load any CSV the same way:

```python
df = pd.read_csv("titanic.csv")
```

The inspection and cleaning steps below work identically either way.

## Inspecting the Data

Before touching anything, understand what you have.

```python
df.shape      # (891, 15) - rows, columns
df.head()     # first 5 rows
df.dtypes     # column types
```

`df.info()` is the most useful single call for an initial look - it shows column names, non-null counts, and types all at once:

```python
df.info()
```

```
<class 'pandas.core.frame.DataFrame'>
RangeIndex: 891 entries, 0 to 890
Data columns (total 15 columns):
 #   Column      Non-Null Count  Dtype
---  ------      --------------  -----
 0   survived    891 non-null    int64
 1   pclass      891 non-null    int64
 2   sex         891 non-null    object
 3   age         714 non-null    float64
 4   sibsp       891 non-null    int64
 5   parch       891 non-null    int64
 6   fare        891 non-null    float64
 7   embarked    889 non-null    object
 8   class       891 non-null    object
 9   who         891 non-null    object
 10  adult_male  891 non-null    bool
 11  deck        203 non-null    object
 12  embark_town 889 non-null    object
 13  alive       891 non-null    object
 14  alone       891 non-null    bool
```

Immediately visible: `age` is missing for 177 rows, `deck` is missing for 688 of 891, and `embarked`/`embark_town` are each missing 2 rows.

To see null counts sorted:

```python
df.isnull().sum().sort_values(ascending=False)
```

```
deck           688
age            177
embark_town      2
embarked         2
survived         0
...
```

To see null counts as percentages:

```python
(df.isnull().sum() / len(df) * 100).round(1).sort_values(ascending=False)
```

```
deck           77.1
age            19.9
embark_town     0.2
embarked        0.2
...
```

`deck` is missing 77% of values. That's not a cleaning problem - it's a data availability problem. You can't impute your way out of 77% missing.

## Handling Missing Values

There are three choices for a column with missing values: fill them, drop the rows, or drop the column. The right choice depends on how many values are missing and whether the missing values are informative.

### Drop the column

When a column is missing more than ~50% of its values, the signal-to-noise ratio is usually too low to be useful. Drop it:

```python
df = df.drop(columns=["deck"])
```

### Drop rows with missing values

For columns where only a small number of rows are missing, dropping the rows is often the cleanest option:

```python
# drop rows where embarked is null (only 2 rows)
df = df.dropna(subset=["embarked"])
```

`dropna(subset=...)` lets you target specific columns rather than dropping any row with any null.

To drop all rows with any null across all columns:

```python
df = df.dropna()
```

This is aggressive - use it only when you're sure no column has widespread missing values.

### Fill missing values

For numeric columns, filling with the median is more robust than the mean (the mean is pulled by outliers):

```python
median_age = df["age"].median()
df["age"] = df["age"].fillna(median_age)
```

For categorical columns, fill with the mode (the most frequent value):

```python
mode_embark = df["embarked"].mode()[0]
df["embarked"] = df["embarked"].fillna(mode_embark)
```

`.mode()` returns a Series (there can be multiple modes), so `[0]` takes the first.

After filling, verify:

```python
df[["age", "embarked"]].isnull().sum()
# age         0
# embarked    0
```

### When missing values are informative

Sometimes the absence of a value is itself information. A `deck` column being null might mean the passenger was in third class. In that case, create a binary indicator column before dropping or filling:

```python
df["deck_known"] = df["deck"].notnull().astype(int)
df = df.drop(columns=["deck"])
```

Now your model can use `deck_known` as a feature even though you can't use the deck value itself.

## Fixing Data Types

`df.dtypes` shows what pandas inferred when it loaded the data. The inferred types are often wrong or suboptimal.

### String columns that should be categories

`sex`, `class`, `embarked`, and `who` are all string (`object`) columns with a small number of distinct values. Converting them to `category` dtype reduces memory usage and makes groupby operations faster:

```python
for col in ["sex", "class", "embarked", "who"]:
    df[col] = df[col].astype("category")
```

### Integer columns that are really booleans

`survived` is stored as `int64` (0 or 1). Converting to bool makes the intent explicit:

```python
df["survived"] = df["survived"].astype(bool)
```

### Parsing dates

If a column contains dates as strings, `pd.to_datetime()` converts them:

```python
df["date"] = pd.to_datetime(df["date"])
```

Once parsed, you can extract components:

```python
df["year"] = df["date"].dt.year
df["month"] = df["date"].dt.month
df["day_of_week"] = df["date"].dt.day_name()
```

The Titanic dataset doesn't have a date column, but this pattern comes up in almost every real dataset.

### Verifying types after the fact

```python
df.dtypes
```

```
survived          bool
pclass           int64
sex           category
age           float64
...
```

## Removing Duplicates

Duplicates happen: data was merged from two sources, an import ran twice, a join created fan-out rows.

Check for duplicates first:

```python
df.duplicated().sum()    # count of fully duplicate rows
```

To see the actual duplicate rows:

```python
df[df.duplicated(keep=False)]
```

`keep=False` marks all copies of a duplicate, not just the second one.

To drop duplicates:

```python
df = df.drop_duplicates()
```

If you only care about specific columns being unique (e.g., each passenger ID should appear once):

```python
df = df.drop_duplicates(subset=["passenger_id"])
```

The Titanic dataset from seaborn has no duplicates, but verifying takes one line and costs nothing.

## Exploratory Data Analysis

Once the data is clean, explore it. The goal is to understand distributions, relationships, and anything surprising before building on top of it.

### `describe()`

`df.describe()` gives you the standard five-number summary for all numeric columns:

```python
df.describe()
```

```
         survived    pclass        age       sibsp       parch        fare
count  889.000000  889.00000  889.000000  889.000000  889.000000  889.0000
mean     0.382452    2.30934   29.644410    0.523060    0.381956   32.2042
std      0.486260    0.83608   13.012571    1.102743    0.806761   49.6931
min      0.000000    1.00000    0.420000    0.000000    0.000000    0.0000
25%      0.000000    2.00000   20.125000    0.000000    0.000000    7.9104
50%      0.000000    3.00000   28.000000    0.000000    0.000000   14.4542
75%      1.000000    3.00000   38.000000    1.000000    0.000000   31.3875
max      1.000000    3.00000   80.000000    8.000000    6.000000  512.3292
```

Things to look for: large gaps between `mean` and `median` (outliers), `min` of 0 for something that shouldn't be 0, `max` values that look suspicious.

`fare` here has a mean of 32 and a max of 512 - a heavily skewed distribution. That's worth knowing before feeding it into a model.

Pass `include="all"` to include categorical columns too:

```python
df.describe(include="all")
```

### `value_counts()`

For categorical columns, `value_counts()` shows the distribution:

```python
df["sex"].value_counts()
```

```
male      577
female    312
Name: sex, dtype: int64
```

```python
df["class"].value_counts()
```

```
Third     491
First     216
Second    184
Name: class, dtype: int64
```

Normalize to get proportions instead of counts:

```python
df["survived"].value_counts(normalize=True).round(2)
```

```
False    0.62
True     0.38
Name: survived, dtype: float64
```

62% of passengers did not survive. That's a class imbalance worth knowing if you're training a classifier.

### `groupby()` for relationships

`groupby` reveals how a metric varies across categories:

```python
df.groupby("sex")["survived"].mean().round(2)
```

```
sex
female    0.74
male      0.19
Name: survived, dtype: float64
```

74% survival rate for women, 19% for men. One line, immediately meaningful.

```python
df.groupby("class")["survived"].mean().round(2)
```

```
class
First     0.63
Second    0.47
Third     0.24
Name: survived, dtype: float64
```

Cross both dimensions with `unstack()`:

```python
df.groupby(["class", "sex"])["survived"].mean().round(2).unstack()
```

```
sex       female  male
class
First       0.97  0.37
Second      0.92  0.16
Third       0.50  0.14
```

`unstack()` pivots the inner group level into columns, which is easier to read than a nested index.

### `corr()` for numeric relationships

```python
df[["age", "fare", "pclass", "sibsp", "parch"]].corr().round(2)
```

```
        age  fare  pclass  sibsp  parch
age    1.00 -0.18   -0.41  -0.23  -0.15
fare  -0.18  1.00   -0.55   0.16   0.22
pclass -0.41 -0.55   1.00   0.08   0.02
sibsp  -0.23  0.16    0.08  1.00   0.41
parch  -0.15  0.22    0.02  0.41   1.00
```

`pclass` and `fare` have a correlation of -0.55 - first class passengers paid more, which makes sense and confirms the data is internally consistent.

## Visualizing with Matplotlib

Numbers tell you what's happening. Plots show you the shape of it.

### Distribution of a numeric column

```python
import matplotlib.pyplot as plt

df["age"].hist(bins=20, edgecolor="black")
plt.title("Age Distribution")
plt.xlabel("Age")
plt.ylabel("Count")
plt.tight_layout()
plt.savefig("age_distribution.png")
plt.show()
```

### Bar chart from value_counts

```python
df["class"].value_counts().plot(kind="bar", edgecolor="black")
plt.title("Passengers by Class")
plt.xlabel("Class")
plt.ylabel("Count")
plt.xticks(rotation=0)
plt.tight_layout()
plt.savefig("class_distribution.png")
plt.show()
```

### Survival rate by class

```python
survival_by_class = df.groupby("class")["survived"].mean()

survival_by_class.plot(kind="bar", edgecolor="black")
plt.title("Survival Rate by Class")
plt.xlabel("Class")
plt.ylabel("Survival Rate")
plt.xticks(rotation=0)
plt.ylim(0, 1)
plt.tight_layout()
plt.savefig("survival_by_class.png")
plt.show()
```

### Scatter plot for two numeric variables

```python
plt.scatter(df["age"], df["fare"], alpha=0.4)
plt.title("Age vs Fare")
plt.xlabel("Age")
plt.ylabel("Fare")
plt.tight_layout()
plt.savefig("age_vs_fare.png")
plt.show()
```

`alpha=0.4` makes overlapping points visible instead of blending into a solid blob.

### Multiple subplots

```python
fig, axes = plt.subplots(1, 2, figsize=(12, 4))

df["age"].hist(bins=20, ax=axes[0], edgecolor="black")
axes[0].set_title("Age Distribution")

df["fare"].hist(bins=30, ax=axes[1], edgecolor="black")
axes[1].set_title("Fare Distribution")

plt.tight_layout()
plt.savefig("distributions.png")
plt.show()
```

## The Takeaway

- **Inspect before touching anything.** `df.info()` and `df.isnull().sum()` tell you what you're working with before you make any decisions.
- **Match your missing value strategy to the severity.** High missing rate (>50%) - drop the column. Low missing rate - drop rows or fill. Missing values that are informative - add an indicator column first.
- **Filling with median beats mean for numeric columns.** The median is robust to outliers; the mean is not.
- **`category` dtype is almost always the right choice** for string columns with a small, fixed set of values. It saves memory and makes groupby faster.
- **`value_counts(normalize=True)` is your fastest EDA tool** for understanding class distributions and spotting imbalances before modeling.
- **`groupby + mean` on a binary target** is the fastest way to find which features correlate with your outcome. One line, immediately interpretable.

Clean data is a prerequisite for everything else. [Intro to Machine Learning with scikit-learn](/articles/intro-to-machine-learning-with-scikit-learn) picks up from here - training and evaluating a model on the cleaned Titanic dataset.
