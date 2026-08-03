import { authorizationServerMetadata } from '../_oauth-core.mjs';

export function GET() {
  return Response.json(authorizationServerMetadata(), {
    headers: { 'Cache-Control': 'public, max-age=300' },
  });
}
