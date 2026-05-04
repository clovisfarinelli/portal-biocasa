import { NextRequest, NextResponse } from 'next/server'
import { getServerSession } from 'next-auth'
import { authOptions } from '@/lib/auth'
import { prisma } from '@/lib/prisma'
import { enviarConvite } from '@/lib/email'

export async function POST(req: NextRequest, { params }: { params: { id: string } }) {
  const session = await getServerSession(authOptions)
  if (!session) return NextResponse.json({ erro: 'Não autorizado' }, { status: 401 })

  const operador = session.user as any
  if (['ESPECIALISTA', 'ASSISTENTE', 'CORRETOR'].includes(operador.perfil)) {
    return NextResponse.json({ erro: 'Acesso negado' }, { status: 403 })
  }

  const usuario = await prisma.usuario.findUnique({
    where: { id: params.id },
    select: { id: true, nome: true, email: true, ativo: true, conviteToken: true, unidadeId: true },
  })

  if (!usuario) return NextResponse.json({ erro: 'Usuário não encontrado' }, { status: 404 })

  if (usuario.ativo || !usuario.conviteToken) {
    return NextResponse.json({ erro: 'Usuário não possui convite pendente' }, { status: 400 })
  }

  if (operador.perfil === 'PROPRIETARIO' && usuario.unidadeId !== operador.unidadeId) {
    return NextResponse.json({ erro: 'Acesso negado' }, { status: 403 })
  }

  const novoToken    = crypto.randomUUID()
  const novaExpiracao = new Date(Date.now() + 24 * 60 * 60 * 1000)

  await prisma.usuario.update({
    where: { id: params.id },
    data: { conviteToken: novoToken, conviteExpiraEm: novaExpiracao },
  })

  const base      = process.env.NEXTAUTH_URL ?? 'https://portal.cf8.com.br'
  const conviteUrl = `${base}/convite?token=${novoToken}`
  await enviarConvite(usuario.nome, usuario.email, conviteUrl)

  return NextResponse.json({ ok: true, conviteUrl })
}
