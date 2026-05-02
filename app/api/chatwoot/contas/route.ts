import { NextResponse } from 'next/server'
import { getServerSession } from 'next-auth'
import { authOptions } from '@/lib/auth'
import { prisma } from '@/lib/prisma'

const CHATWOOT_URL = 'https://atendimento.cf8.com.br'

export async function GET() {
  const session = await getServerSession(authOptions)
  if (!session) return NextResponse.json({ erro: 'Não autorizado' }, { status: 401 })

  const perfil = (session.user as any).perfil
  if (perfil !== 'MASTER') {
    return NextResponse.json({ erro: 'Apenas MASTER pode listar contas' }, { status: 403 })
  }

  const usuarioId = (session.user as any).id as string

  const usuario = await prisma.usuario.findUnique({
    where: { id: usuarioId },
    select: { chatwootToken: true },
  })

  if (!usuario?.chatwootToken) {
    return NextResponse.json({ erro: 'Chatwoot não configurado para este usuário' }, { status: 404 })
  }

  const resp = await fetch(`${CHATWOOT_URL}/api/v1/profile`, {
    headers: { api_access_token: usuario.chatwootToken },
  })

  if (!resp.ok) {
    return NextResponse.json({ erro: 'Erro ao buscar contas no Chatwoot' }, { status: 502 })
  }

  const data = await resp.json()
  const contas = (data.accounts ?? []).map((a: { id: number; name: string }) => ({
    id: a.id,
    nome: a.name,
  }))

  return NextResponse.json({ contas })
}
