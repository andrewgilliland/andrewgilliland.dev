---
title: "IAM"
date: "2025-2-24"
draft: false
---

## What is IAM (Identity and Access Management)

- Core AWS Service that helps you control access to **Resources**
- **Resources** are the entities you create in AWS i.e. S3 Bucket or Object
- Users attempt to perform **Actions** on resources, i.e. S3::CreateBucket
- Authorization to perform **Action** depends on a **Policy**

## Policy

Policies are JSON documents that define permissions for actions on AWS resources. They specify what actions are allowed or denied for which resources and under what conditions. Policies can be attached to users, groups, or roles to grant or restrict access to AWS services and resources. There are different types of policies, including managed policies, inline policies, and service control policies (SCPs).

## Users

Users are individual identities with specific permissions to access AWS resources. Each user has a unique set of credentials, such as a username and password or access keys, which they use to authenticate and interact with AWS services. Users can be assigned to groups and have policies attached to them to control their level of access.

## Groups

Groups are collections of IAM users. You can use groups to specify permissions for multiple users, which can make it easier to manage permissions for those users. For example, you could have a group called "Developers" and give that group the permissions to access certain AWS resources. Any user added to the "Developers" group automatically inherits the permissions assigned to the group.

## Roles

Roles are IAM identities that you can assume to gain temporary access to AWS resources. Roles are used to delegate access to users, applications, or services that don't normally have access to your AWS resources. Roles have policies attached to them that define what actions are allowed or denied. They are often used for cross-account access, federated user access, and granting permissions to AWS services.

## Pro Tips

- Protect your **Root Account** at ALL COSTS.
- Explicit **Effect:'Deny'** wins over **Effect:'Allow'**.
- Use the **Least Privilege Model**.
- Use the **IAM Policy Simulator**.
