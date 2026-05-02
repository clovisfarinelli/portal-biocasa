import NextAuth from 'next-auth'
import { NextRequest } from 'next/server'
import { authOptions } from '@/lib/auth'
import { checarRateLimit, ipDaRequisicao, respostaLimiteExcedido } from '@/lib/rateLimit'

const handler = NextAuth(authOptions)

export async function GET(req: NextRequest, ctx: unknown) {
  return handler(req, ctx)
}

export async function POST(req: NextRequest, ctx: unknown) {
  const ip = ipDaRequisicao(req)
  if (!checarRateLimit(`auth:${ip}`, 10, 60_000)) {
    return respostaLimiteExcedido()
  }
  return handler(req, ctx)
}
