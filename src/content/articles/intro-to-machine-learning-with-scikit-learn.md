---
title: Intro to Machine Learning with scikit-learn
date: 2026-05-22
excerpt: Machine learning sounds intimidating, but scikit-learn makes it approachable. Here's how to train your first model in Python.
draft: false
tags: ["python", "data-science", "scikit-learn"]
---

[Cleaning and Exploring Data with Python](/articles/cleaning-and-exploring-data-with-python) left off with a clean Titanic dataset and a clear picture of its distributions. Now it's time to do something with it. Machine learning means training a model on that data so it can make predictions on data it hasn't seen.

This article uses scikit-learn to train a logistic regression classifier on the Titanic dataset and evaluate how well it performs. No math prerequisites required - the goal is to understand the workflow, not derive the algorithm.

All the code from this article is available in the companion repo: [andrewgilliland/titanic-cleaning](https://github.com/andrewgilliland/titanic-cleaning).

## What Is Machine Learning?

Machine learning is the practice of training a program to make predictions or decisions by showing it examples, rather than writing explicit rules. Instead of coding "if female and first class, predict survived," you give the program a dataset of passengers with known outcomes and let it figure out the rules itself.

The result is a **model** - a mathematical function that takes inputs (passenger details) and returns a prediction (survived or not). Once trained, you can use that model on new passengers it has never seen.

## Supervised vs Unsupervised Learning

There are two broad categories:

**Supervised learning** is when your training data includes labels - the correct answers. You show the model inputs and outputs, and it learns the mapping. Classification (predicting a category) and regression (predicting a number) are both supervised. The Titanic problem is supervised: each passenger has a known `survived` value.

**Unsupervised learning** is when there are no labels. You give the model inputs only and ask it to find structure - clusters, patterns, anomalies. K-means clustering is an example.

Most practical ML problems start with supervised learning, because you usually have historical data with known outcomes. That's what this article covers.

## Setting Up with uv

The examples below assume you're using [uv](https://docs.astral.sh/uv/) as your Python package manager. If you're not, `pip install scikit-learn pandas seaborn` works fine too.

To follow along with the companion repo:

```bash
git clone https://github.com/andrewgilliland/titanic-cleaning
cd titanic-cleaning
uv sync
uv run main.py
```

Or start fresh:

```bash
uv init titanic-cleaning
cd titanic-cleaning
uv add scikit-learn pandas seaborn
```

## Features and Labels

The Titanic dataset is the same one from the cleaning article. Load it and apply the same cleaning steps:

```python
import pandas as pd
import seaborn as sns

df = sns.load_dataset("titanic")

# cleaning from the previous article
df = df.drop(columns=["deck"])
df = df.dropna(subset=["embarked"])
df["age"] = df["age"].fillna(df["age"].median())
```

In machine learning, **features** are the inputs the model uses to make predictions. **Labels** are the outputs you want to predict. The convention is `X` for features and `y` for the label.

The label here is `survived`. The features are the passenger attributes that might predict it:

```python
features = ["pclass", "sex", "age", "fare", "sibsp", "parch", "embarked"]

df_model = df[features + ["survived"]].copy()
```

scikit-learn requires all input to be numeric. `sex` and `embarked` are still string columns. `pd.get_dummies()` converts them to binary indicator columns:

```python
df_model = pd.get_dummies(df_model, columns=["sex", "embarked"], drop_first=True)
```

`drop_first=True` drops one level from each column to avoid the dummy variable trap (encoding `sex` as `sex_male` is enough - `sex_female` would be redundant).

Now separate `X` and `y`:

```python
X = df_model.drop(columns=["survived"])
y = df_model["survived"]
```

`X` has shape `(889, 8)` - 889 passengers, 8 features. `y` is a Series of 0s and 1s.

## Splitting Data into Train and Test Sets

You can't evaluate a model on the same data you trained it on. If you did, the model could just memorize the answers and report 100% accuracy without learning anything generalizable.

The standard approach is to hold out a portion of the data before training and use it only for evaluation. scikit-learn's `train_test_split` handles this:

```python
from sklearn.model_selection import train_test_split

X_train, X_test, y_train, y_test = train_test_split(
    X, y, test_size=0.2, random_state=42
)
```

`test_size=0.2` reserves 20% of rows for testing - 178 passengers. The remaining 711 are used for training.

`random_state=42` seeds the random shuffle so the split is reproducible. The specific number doesn't matter; using any fixed value means you get the same split every time you run it.

```python
print(X_train.shape)  # (711, 8)
print(X_test.shape)   # (178, 8)
```

## Training a Model

Logistic regression is the right starting point for binary classification. Despite the name, it's a classifier, not a regression model. It learns a decision boundary and outputs a probability that an input belongs to a given class.

```python
from sklearn.linear_model import LogisticRegression

model = LogisticRegression(max_iter=200)
model.fit(X_train, y_train)
```

`fit()` is where training happens. You pass in the training features and labels, and the model adjusts its internal parameters to minimize prediction error on that data.

`max_iter=200` raises the iteration limit from the default 100. Logistic regression is solved iteratively, and 100 iterations sometimes isn't enough to converge on this dataset.

That's it. The model is trained.

## Evaluating the Model

Generate predictions on the test set, then compare them to the known labels:

```python
y_pred = model.predict(X_test)
```

### Accuracy

```python
from sklearn.metrics import accuracy_score

print(accuracy_score(y_test, y_pred))
```

```
0.8146067415730337
```

81% accuracy. The model correctly predicts survival for about 4 out of 5 passengers it hasn't seen.

### Confusion Matrix

Accuracy alone is misleading, especially for imbalanced datasets. The cleaning article established that 62% of passengers didn't survive - a model that always predicted "not survived" would be 62% accurate without learning anything. The confusion matrix shows what kinds of mistakes the model is making:

```python
from sklearn.metrics import confusion_matrix

print(confusion_matrix(y_test, y_pred))
```

```
[[95 15]
 [19 49]]
```

Reading this: 95 passengers who didn't survive were correctly predicted as not surviving (true negatives). 49 survivors were correctly predicted as surviving (true positives). 15 non-survivors were wrongly predicted as surviving (false positives). 19 survivors were wrongly predicted as not surviving (false negatives).

### Classification Report

The classification report rolls this into precision, recall, and F1 for each class:

```python
from sklearn.metrics import classification_report

print(classification_report(y_test, y_pred))
```

```
              precision    recall  f1-score   support

           0       0.83      0.86      0.85       110
           1       0.77      0.72      0.74        68

    accuracy                           0.81       178
   macro avg       0.80      0.79      0.79       178
weighted avg       0.81      0.81      0.81       178
```

**Precision** is "of the passengers predicted to survive, how many actually did?" 77% for survivors. **Recall** is "of the passengers who actually survived, how many did we catch?" 72%. The model is better at identifying non-survivors than survivors, which is expected given the class imbalance.

F1 is the harmonic mean of precision and recall - a single number that balances both.

## Making Predictions

Once trained, the model can predict on any new input that matches the feature columns. Build a DataFrame with the same structure as `X`:

```python
passenger = pd.DataFrame([{
    "pclass": 3,
    "age": 22.0,
    "fare": 7.25,
    "sibsp": 1,
    "parch": 0,
    "sex_male": True,
    "embarked_Q": False,
    "embarked_S": True,
}])

print(model.predict(passenger))
```

```
[0]
```

The model predicts this passenger did not survive.

`predict_proba()` gives the underlying probabilities rather than a hard 0/1 decision:

```python
print(model.predict_proba(passenger).round(2))
```

```
[[0.84 0.16]]
```

84% probability of not surviving, 16% of surviving. The 0.5 threshold is what converts that into a hard prediction of 0.

You can lower the threshold if recall matters more than precision - for example, in medical screening you'd rather have false positives than missed cases.

## The Takeaway

- **The ML workflow is always the same:** clean data → define features and label → split into train/test → fit a model → evaluate on the held-out test set.
- **scikit-learn requires numeric input.** Use `pd.get_dummies()` to encode categorical columns before training.
- **Never evaluate on training data.** Use `train_test_split` and evaluate only on `X_test`.
- **Accuracy is not enough.** For imbalanced datasets, check the confusion matrix and classification report to understand what kinds of errors the model makes.
- **`predict_proba()` gives you more than `predict()`.** The raw probabilities let you tune the decision threshold for your specific tradeoff between precision and recall.
- **Logistic regression is a strong baseline.** It's fast, interpretable, and performs well on many real problems. Start here before reaching for more complex models.
