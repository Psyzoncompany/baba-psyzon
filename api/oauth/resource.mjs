import { protectedResourceMetadata } from '../_oauth-core.mjs';

export function GET() {
  return Response.json(protectedResourceMetadata(), {
    headers: { 'Cache-Control': 'public, max-age=300' },
  });
}
