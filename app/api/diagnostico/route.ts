import { NextRequest, NextResponse } from 'next/server'
import { getServerSession } from 'next-auth'
import { authOptions } from '@/lib/auth'
import { prisma } from '@/lib/prisma'
import { GoogleGenerativeAI } from '@google/generative-ai'

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

  // Testa todos os candidatos de modelo em sequência
  const candidatos = [
    'gemini-2.5-flash',
    'gemini-2.5-pro',
    'gemini-2.5-flash-preview-04-17',
    'gemini-2.5-pro-preview-03-25',
    'gemini-2.0-flash-lite',
    'gemini-2.0-flash-001',
    'gemini-1.5-flash-latest',
    'gemini-1.5-pro-latest',
  ]

  const testeModelos: Record<string, any> = {}

  if (!chave) {
    resultado.modelos_testados = 'GEMINI_API_KEY ausente'
  } else {
    const genAI = new GoogleGenerativeAI(chave)
    for (const nome of candidatos) {
      try {
        const model = genAI.getGenerativeModel({ model: nome })
        const res = await model.generateContent('Responda apenas: OK')
        testeModelos[nome] = { status: 'ok', resposta: res.response.text().slice(0, 40) }
        // Para no primeiro que funcionar
        break
      } catch (e: any) {
        const msg: string = e?.message ?? ''
        // 404 = modelo não existe; 429 = quota; outros = outro problema
        if (msg.includes('429') || msg.includes('quota')) {
          testeModelos[nome] = { status: 'quota_excedida' }
          break
        }
        testeModelos[nome] = {
          status: 'falha',
          erro: msg.slice(0, 150),
        }
      }
    }
  }

  resultado.modelos_testados = testeModelos

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
