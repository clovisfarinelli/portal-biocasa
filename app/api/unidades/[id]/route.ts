import { NextRequest, NextResponse } from 'next/server'
import { getServerSession } from 'next-auth'
import { authOptions } from '@/lib/auth'
import { prisma } from '@/lib/prisma'
import { z } from 'zod'

const schemaAtualizar = z.object({
  nome: z.string().min(2).optional(),
  limiteAnalises: z.number().int().positive().optional(),
  ativo: z.boolean().optional(),
})

export async function PATCH(req: NextRequest, { params }: { params: { id: string } }) {
  const session = await getServerSession(authOptions)
  if (!session) return NextResponse.json({ erro: 'Não autorizado' }, { status: 401 })

  if ((session.user as any).perfil !== 'MASTER') {
    return NextResponse.json({ erro: 'Apenas MASTER pode editar unidades' }, { status: 403 })
  }

  let dados: z.infer<typeof schemaAtualizar>
  try {
    dados = schemaAtualizar.parse(await req.json())
  } catch (e: any) {
    return NextResponse.json({ erro: e?.message?.slice(0, 200) }, { status: 400 })
  }

  const unidade = await prisma.unidade.update({
    where: { id: params.id },
    data: dados,
  })

  return NextResponse.json(unidade)
}
