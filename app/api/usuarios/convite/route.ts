import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'

export async function GET(req: NextRequest) {
  const token = req.nextUrl.searchParams.get('token')
  if (!token) return NextResponse.json({ erro: 'Token obrigatório' }, { status: 400 })

  const usuario = await prisma.usuario.findUnique({
    where: { conviteToken: token },
    select: { nome: true, email: true, conviteExpiraEm: true },
  })

  if (!usuario) {
    return NextResponse.json({ erro: 'Convite inválido ou já utilizado' }, { status: 404 })
  }

  if (usuario.conviteExpiraEm && usuario.conviteExpiraEm < new Date()) {
    return NextResponse.json({ erro: 'Este convite expirou. Solicite um novo ao administrador.' }, { status: 410 })
  }

  return NextResponse.json({ nome: usuario.nome, email: usuario.email })
}
