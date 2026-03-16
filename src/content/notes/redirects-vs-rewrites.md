---
title: "Redirects vs. Rewrites"
date: "2024-08-13"
excerpt: ""
draft: false
---

In web development, redirects and rewrites are techiques use to manage URLs and control how requests are handled by the server. Here's a detailed explanation of the differences between the two:

### Redirects

URL redirects are a technique used to have more than one URL address to point users to the same website page or destination. URL redirects may also be known as URL forwarding. Redirect responses have status codes that start with **3**.

There are different types of redirects, that can be sorted into three categories:

1. Permanent redirects
2. Temporary redirects
3. Special redirects

#### Permanent Redirects

Permanent redirects can be used to preserve existing links to perserve existing URLs. These redirects are meant to last forever. There are two status codes for permanent redirects:

1. **301** - Moved Permanently
2. **308** - Permanent Redirect

#### Temporary Redirects

Temporary redirects can be used to redirect users to an alternative page while there maintenance or downtime on a web site or app. There are three status codes for temporary redirects:

1. **302** - Found
2. **303** - See Other
3. **307** - Temporary Redirect

#### Special Redirects

There are two status codes for special redirects:

1. **300** - Multiple Choices - Manual redirects
2. **304** - Not Modified - Used for caching purposes, not a redirect

### Rewrites

Rewrites are handled entirely on the server and are transparent to the user. The URL in the browser's address bar remains unchanged.

#### Why Use Rewrites

Rewrites are useful to make URLs more user and SEO friendly. For example, you could rewrite the URL _website.com/index.php?page=about_ to _website.com/about_.

### Key Differences

1. Visibility to the User:

- Redirects: The URL in the browser's address bar changes to the new URL. The user is aware of the change.
- Rewrites: The URL in the browser's address bar remains unchanged. The user is unaware of the change.

2. HTTP Status Codes:

- Redirects: Use specific HTTP status codes (e.g., **301**, **302**, **307**) to indicate the type of redirect.
- Rewrites: Do not use HTTP status codes. They are handled internally by the server.

3. Purpose:

- Redirects: Used to send users and search engines to a different URL. Commonly used for URL changes, site maintenance, or cotent moved to a new location.
- Rewrites: Improve SEO by making URLs cleaner and more descriptive, but do not directly affect link equity.

4. Impact on SEO:

- Redirects: Can affect SEO by transferring link equity from the old URL to the new URL (especially with **301** redirects).
- Rewrites: Improve SEO by making URLs cleaner and more descriptive, but do not directly affect link equity.

5. Implementation:

- Redirects: Implemented using HTTP headers or server configuration files (e.g., _.htaccess_ for Apache)
- Rewrites: Implemented using server configuration files or server-side scripts.

### Summary

Redirects and rewrites serve different purposes and are used in different scenarios. Redirects change the URL visible to the user and are used to guide users and search engines to a new location. Rewrites keep the URL the same but map it to a different server-side resource, improving URL readability and SEO.

### Resources

[Redirections in HTTP - HTTP | MDN](https://developer.mozilla.org/en-US/docs/Web/HTTP/Redirections)  
[Introduction To URL Rewriting - Smashing Magazine](https://www.smashingmagazine.com/2011/11/introduction-to-url-rewriting/)
