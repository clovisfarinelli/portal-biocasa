import { NextRequest, NextResponse } from 'next/server'
import { getServerSession } from 'next-auth'
import { authOptions } from '@/lib/auth'
import { prisma } from '@/lib/prisma'

export async function PATCH(req: NextRequest, { params }: { params: { id: string } }) {
  const session = await getServerSession(authOptions)
  if (!session) return NextResponse.json({ erro: 'Não autorizado' }, { status: 401 })

  const usuario = session.user as any
  if (usuario.perfil !== 'MASTER') {
    return NextResponse.json({ erro: 'Acesso negado' }, { status: 403 })
  }

  const body = await req.json()
  const documento = await prisma.documentoIa.update({
    where: { id: params.id },
    data: body,
  })

  return NextResponse.json(documento)
}

export async function DELETE(req: NextRequest, { params }: { params: { id: string } }) {
  const session = await getServerSession(authOptions)
  if (!session) return NextResponse.json({ erro: 'Não autorizado' }, { status: 401 })

  const usuario = session.user as any
  if (usuario.perfil !== 'MASTER') {
    return NextResponse.json({ erro: 'Acesso negado' }, { status: 403 })
  }

  await prisma.documentoIa.delete({ where: { id: params.id } })
  return NextResponse.json({ ok: true })
}
