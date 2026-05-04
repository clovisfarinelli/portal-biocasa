import { NextRequest, NextResponse } from 'next/server'
import { getServerSession } from 'next-auth'
import { authOptions } from '@/lib/auth'
import { registrarLog } from '@/lib/logs'
import { ipDaRequisicao } from '@/lib/rateLimit'
import { verificarExportacaoAbusiva } from '@/lib/alertas'

export async function POST(req: NextRequest) {
  const session = await getServerSession(authOptions)
  if (!session) return NextResponse.json({ erro: 'Não autorizado' }, { status: 401 })

  const usuario = session.user as any
  const { analiseId } = await req.json().catch(() => ({}))
  const ip = ipDaRequisicao(req)

  await registrarLog({
    acao:      'exportacao',
    recurso:   'analise',
    usuarioId: usuario.id,
    detalhes:  analiseId ? `analiseId: ${analiseId}` : undefined,
    ip,
  })

  verificarExportacaoAbusiva(usuario.id, usuario.name ?? usuario.nome ?? '').catch(console.error)

  return NextResponse.json({ ok: true })
}
