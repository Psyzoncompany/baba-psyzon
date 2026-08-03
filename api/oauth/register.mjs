import { oauthErrorResponse, registerClient } from '../_oauth-core.mjs';

export async function POST(request) {
  try {
    const contentType = request.headers.get('content-type') || '';
    if (!contentType.toLowerCase().includes('application/json')) {
      return Response.json({ error: 'invalid_client_metadata', error_description: 'Envie application/json.' }, { status: 415 });
    }
    const result = registerClient(await request.json());
    return Response.json(result, {
      status: 201,
      headers: { 'Cache-Control': 'no-store' },
    });
  } catch (error) {
    return oauthErrorResponse(error);
  }
}
