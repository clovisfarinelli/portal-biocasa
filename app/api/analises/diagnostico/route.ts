import { NextResponse } from 'next/server'
import { getServerSession } from 'next-auth'
import { authOptions } from '@/lib/auth'
import { prisma } from '@/lib/prisma'

// Endpoint de diagnóstico — apenas MASTER. Pode ser removido após estabilização.
export async function GET() {
  const session = await getServerSession(authOptions)
  if (!session) return NextResponse.json({ erro: 'Não autorizado' }, { status: 401 })
  if ((session.user as any).perfil !== 'MASTER') {
    return NextResponse.json({ erro: 'Acesso negado' }, { status: 403 })
  }

  const chave = process.env.GEMINI_API_KEY ?? ''
  const resultado: Record<string, any> = {
    gemini_key_presente: !!chave,
    gemini_key_prefixo: chave ? chave.slice(0, 10) + '...' : 'AUSENTE',
    node_env: process.env.NODE_ENV,
  }

  // Testa chamada real ao Gemini com modelo mais simples
  try {
    const { GoogleGenerativeAI } = await import('@google/generative-ai')
    if (!chave) throw new Error('GEMINI_API_KEY ausente')
    const genAI = new GoogleGenerativeAI(chave)
    const model = genAI.getGenerativeModel({ model: 'gemini-1.5-flash' })
    const res = await model.generateContent('Responda apenas: OK')
    resultado.gemini_teste = 'sucesso'
    resultado.gemini_resposta = res.response.text().slice(0, 50)
  } catch (e: any) {
    resultado.gemini_teste = 'falha'
    resultado.gemini_erro_nome = e?.constructor?.name
    resultado.gemini_erro_msg = e?.message?.slice(0, 300)
  }

  // Testa conexão com banco
  try {
    await prisma.$queryRaw`SELECT 1`
    resultado.db_conexao = 'ok'
  } catch (e: any) {
    resultado.db_conexao = 'falha'
    resultado.db_erro = e?.message?.slice(0, 200)
  }

  // Últimos 3 logs de erro
  try {
    const logs = await prisma.logErro.findMany({
      orderBy: { criadoEm: 'desc' },
      take: 3,
      select: { mensagem: true, detalhes: true, criadoEm: true },
    })
    resultado.ultimos_logs = logs
  } catch {}

  return NextResponse.json(resultado)
}
