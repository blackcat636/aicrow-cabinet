import { OPTIONS as baseOPTIONS, POST as basePOST } from '@/app/auth/sso/exchange/route';

export const runtime = 'edge';

export function OPTIONS(request: Parameters<typeof baseOPTIONS>[0]) {
  return baseOPTIONS(request);
}

export function POST(request: Parameters<typeof basePOST>[0]) {
  return basePOST(request);
}
