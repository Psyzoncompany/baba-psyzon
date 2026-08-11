export const dynamic = 'force-dynamic';

export function GET() {
  return Response.json(
    { ok: true, service: 'sitey-caixa' },
    { headers: { 'Cache-Control': 'no-store' } },
  );
}
