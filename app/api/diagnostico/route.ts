import { NextRequest, NextResponse } from 'next/server'
import { getServerSession } from 'next-auth'
import { authOptions } from '@/lib/auth'
import { prisma } from '@/lib/prisma'

// Diagnóstico de integração — apenas MASTER ou ?debug=biocasa2026. Remover após estabilização.
export async function GET(req: NextRequest) {
  const debug = req.nextUrl.searchParams.get('debug')
  if (debug !== 'biocasa2026') {
    const session = await getServerSession(authOptions)
    if (!session) return NextResponse.json({ erro: 'Não autorizado' }, { status: 401 })
    if ((session.user as any).perfil !== 'MASTER') {
      return NextResponse.json({ erro: 'Acesso negado' }, { status: 403 })
    }
  }

  const chave = process.env.GEMINI_API_KEY ?? ''
  const resultado: Record<string, any> = {
    gemini_key_presente: !!chave,
    gemini_key_prefixo: chave ? chave.slice(0, 10) + '...' : 'AUSENTE',
    node_env: process.env.NODE_ENV,
    timestamp: new Date().toISOString(),
  }

  // Testa chamada real ao Gemini com modelo mais leve (flash)
  try {
    const { GoogleGenerativeAI } = await import('@google/generative-ai')
    if (!chave) throw new Error('GEMINI_API_KEY ausente')
    const genAI = new GoogleGenerativeAI(chave)
    const model = genAI.getGenerativeModel({ model: 'gemini-2.0-flash' })
    const res = await model.generateContent('Responda apenas: OK')
    resultado.gemini_flash_teste = 'sucesso'
    resultado.gemini_flash_resposta = res.response.text().slice(0, 80)
  } catch (e: any) {
    resultado.gemini_flash_teste = 'falha'
    resultado.gemini_flash_erro_nome = e?.constructor?.name
    resultado.gemini_flash_erro_msg = e?.message?.slice(0, 400)
  }

  // Testa modelo pro (o que o chat usa)
  try {
    const { GoogleGenerativeAI } = await import('@google/generative-ai')
    const genAI = new GoogleGenerativeAI(chave)
    const model = genAI.getGenerativeModel({ model: 'gemini-2.0-flash' })
    const res = await model.generateContent('Responda apenas: OK')
    resultado.gemini_pro_teste = 'sucesso'
    resultado.gemini_pro_resposta = res.response.text().slice(0, 80)
  } catch (e: any) {
    resultado.gemini_pro_teste = 'falha'
    resultado.gemini_pro_erro_nome = e?.constructor?.name
    resultado.gemini_pro_erro_msg = e?.message?.slice(0, 400)
  }

  // Testa conexão com banco
  try {
    await prisma.$queryRaw`SELECT 1`
    resultado.db_conexao = 'ok'
  } catch (e: any) {
    resultado.db_conexao = 'falha'
    resultado.db_erro = e?.message?.slice(0, 200)
  }

  // Últimos 5 logs de erro
  try {
    const logs = await prisma.logErro.findMany({
      orderBy: { criadoEm: 'desc' },
      take: 5,
      select: { mensagem: true, detalhes: true, criadoEm: true },
    })
    resultado.ultimos_logs_erro = logs
  } catch (e: any) {
    resultado.ultimos_logs_erro = `falha ao buscar: ${e?.message}`
  }

  return NextResponse.json(resultado, { status: 200 })
}
