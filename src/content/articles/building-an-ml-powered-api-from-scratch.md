---
title: Building an ML-Powered API from Scratch
date: 2026-09-05
excerpt: The capstone - train a model, package it, and deploy it as a serverless API with Lambda, API Gateway, and CDK.
draft: true
tags: ["machine-learning", "api", "aws", "lambda", "serverless", "cdk"]
---

Training a model is only part of putting machine learning into production. The model also needs a stable request contract, reproducible packaging, infrastructure, and a way to test predictions after deployment.

This article follows one small classification model from a Python training script to a serverless HTTP endpoint on AWS.

## What We're Building

- Train a small scikit-learn classification model.
- Save the fitted model as a versioned artifact.
- Package the model and its Python dependencies with a Lambda function.
- Expose a `POST /predict` endpoint through API Gateway.
- Define the AWS resources with CDK.
- Send a real request to the deployed endpoint and inspect its prediction.
- Keep the example small enough to run within Lambda's resource limits.

## Training the Model

- Choose a built-in dataset so the example does not depend on an external download.
- Split the data into training and test sets.
- Keep preprocessing and prediction steps in one scikit-learn pipeline.
- Train a simple classifier that starts quickly and produces predictable output.
- Evaluate the model before treating it as deployable.
- Record the expected feature names and order for the API contract.

## Saving the Model

- Serialize the fitted pipeline with `joblib`.
- Store the artifact outside the handler source code.
- Give the artifact an explicit version or content hash.
- Save metadata such as feature names and model version alongside it.
- Load artifacts only from trusted builds because pickle-based formats can execute code.
- Keep the training and runtime library versions compatible.

## Writing the Lambda Handler

- Load the model once during Lambda initialization instead of on every request.
- Parse the API Gateway request body as JSON.
- Validate required fields, types, and accepted value ranges.
- Convert the request into the exact feature shape expected by the model.
- Return the prediction, confidence when available, and model version.
- Use clear `400` responses for invalid input and `500` responses for unexpected failures.
- Avoid logging sensitive request data.

## Packaging Dependencies for Lambda

- Include scikit-learn, NumPy, joblib, and the model artifact in the deployment package.
- Build native dependencies for Lambda's Linux runtime rather than the local operating system.
- Use a Lambda-compatible container build to make packaging reproducible.
- Keep development and test dependencies out of the production artifact.
- Check the uncompressed package size against Lambda limits.
- Consider a Lambda container image if the ZIP package becomes too large.

## Defining the Infrastructure with CDK

- Create the Lambda function with an explicit Python runtime, memory size, and timeout.
- Point the function at the packaged handler and model artifact.
- Create an HTTP API with a `POST /predict` route.
- Grant only the permissions the function needs.
- Add structured logs and a retention policy.
- Output the deployed API URL.
- Keep infrastructure and application configuration in the same deployment workflow.

## Deploying the API

- Build the model artifact before synthesizing the CDK stack.
- Build dependencies in a Lambda-compatible environment.
- Run unit tests before deployment.
- Deploy with `cdk deploy` and capture the API URL from stack outputs.
- Use GitHub Actions and OIDC for repeatable deployments instead of local credentials.
- Tag the deployment with the source commit and model version.

## Testing End to End

- Send a valid prediction request to the deployed endpoint.
- Confirm the response shape, status code, prediction, and model version.
- Test missing fields, invalid types, and out-of-range values.
- Compare one deployed prediction with the same input run locally.
- Check CloudWatch logs without relying on them as the only assertion.
- Add a smoke test to the deployment workflow.

## Performance Considerations

- Load the model outside the handler to reuse it across warm invocations.
- Measure cold-start time, warm latency, memory use, and package size.
- Increase Lambda memory when additional CPU reduces initialization time.
- Avoid returning more precision or metadata than clients need.
- Use provisioned concurrency only when latency requirements justify its cost.
- Move beyond Lambda when the model is large, requires a GPU, or has sustained high traffic.

## When Not to Use This

- Use a regular application service when predictions are already part of an existing API.
- Use SageMaker or another model-serving platform for large models, GPUs, model registries, or autoscaling designed around inference.
- Use batch inference when predictions do not need an immediate response.
- Do not add machine learning when deterministic business rules solve the problem more clearly.

## The Takeaway

- A production prediction endpoint is more than a serialized model.
- The request schema, preprocessing, dependency versions, and model artifact form one deployable contract.
- Lambda and API Gateway fit small models with intermittent traffic and short inference times.
- CDK and automated tests make the deployment repeatable.
- The next step is to turn each section into a runnable implementation without hiding the operational trade-offs.
