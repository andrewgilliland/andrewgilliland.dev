import { createAgentFriendly404 } from "../src/lib/agentResponses";

interface PagesContext {
  request: Request;
  next(): Promise<Response>;
}

export async function onRequest(context: PagesContext): Promise<Response> {
  const response = await context.next();

  return createAgentFriendly404(context.request, response);
}
