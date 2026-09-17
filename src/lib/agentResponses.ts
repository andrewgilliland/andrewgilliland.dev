const MARKDOWN_NOT_FOUND_BODY = `# Page not found

The requested page does not exist.

- [Browse the sitemap](https://andrewgilliland.dev/sitemap-index.xml)
`;

export function acceptsMarkdown(acceptHeader: string | null): boolean {
  if (!acceptHeader) {
    return false;
  }

  return acceptHeader.split(",").some((entry) => {
    const [mediaType, ...parameters] = entry.split(";");

    if (mediaType.trim().toLowerCase() !== "text/markdown") {
      return false;
    }

    const quality = parameters
      .map((parameter) => parameter.trim().toLowerCase())
      .find((parameter) => parameter.startsWith("q="));

    return quality === undefined || Number(quality.slice(2)) > 0;
  });
}

export function createAgentFriendly404(
  request: Request,
  response: Response,
): Response {
  if (
    response.status !== 404 ||
    !acceptsMarkdown(request.headers.get("Accept"))
  ) {
    return response;
  }

  return new Response(MARKDOWN_NOT_FOUND_BODY, {
    status: 404,
    headers: {
      "Cache-Control": "no-store",
      "Content-Type": "text/markdown; charset=utf-8",
      Vary: "Accept",
    },
  });
}
