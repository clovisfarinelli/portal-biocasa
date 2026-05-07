import { NextRequest, NextResponse } from 'next/server'
import { getServerSession } from 'next-auth'
import { authOptions } from '@/lib/auth'
import { prisma } from '@/lib/prisma'

export async function POST(req: NextRequest) {
  const session = await getServerSession(authOptions)
  if (!session) return NextResponse.json({ erro: 'Não autorizado' }, { status: 401 })

  const usuario = session.user as any

  const ip =
    req.headers.get('x-forwarded-for')?.split(',')[0]?.trim() ??
    req.headers.get('x-real-ip') ??
    'desconhecido'

  try {
    const agora = new Date()
    await prisma.usuario.update({
      where: { id: usuario.id },
      data: {
        consentimentoEm: agora,
        consentimentoIp: ip,
      },
    })
    return NextResponse.json({ ok: true, consentimentoEm: agora.toISOString() })
  } catch (error: any) {
    const msg = error?.message ?? String(error)
    try {
      await prisma.logErro.create({
        data: {
          usuarioId: usuario.id ?? null,
          mensagem: '[/api/lgpd/consentimento] Erro ao registrar consentimento',
          detalhes: msg,
        },
      })
    } catch {}
    return NextResponse.json({ erro: 'Erro ao registrar consentimento' }, { status: 500 })
  }
}
