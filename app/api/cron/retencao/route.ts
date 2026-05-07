// Rotina de retenção de dados LGPD — executada via Vercel Cron (dia 1 de cada mês, 03:00 UTC)
//
// Teste manual:
// curl -X GET https://portal-biocasa.vercel.app/api/cron/retencao \
//   -H "Authorization: Bearer <CRON_SECRET>"

import { NextRequest, NextResponse } from 'next/server'
import { del } from '@vercel/blob'
import { prisma } from '@/lib/prisma'

export async function GET(request: NextRequest) {
  const auth = request.headers.get('authorization')
  if (auth !== `Bearer ${process.env.CRON_SECRET}`) {
    return NextResponse.json({ erro: 'Não autorizado' }, { status: 401 })
  }

  const agora = new Date()

  const corte5anos = new Date(agora)
  corte5anos.setFullYear(agora.getFullYear() - 5)

  const corte2anos = new Date(agora)
  corte2anos.setFullYear(agora.getFullYear() - 2)

  const corte1ano = new Date(agora)
  corte1ano.setFullYear(agora.getFullYear() - 1)

  const corte6meses = new Date(agora)
  corte6meses.setMonth(agora.getMonth() - 6)

  const resultado: Record<string, number> = {}

  // a) Análises antigas (5 anos) — apaga blobs, arquivos_analise e analises
  try {
    const analisesAntigas = await prisma.analise.findMany({
      where: { criadoEm: { lt: corte5anos } },
      include: { arquivos: true },
    })

    for (const analise of analisesAntigas) {
      if (analise.arquivos.length > 0) {
        const urls = analise.arquivos.map(a => a.arquivoUrl)
        try {
          await del(urls)
        } catch {}
        await prisma.arquivoAnalise.deleteMany({ where: { analiseId: analise.id } })
      }
    }

    const ids = analisesAntigas.map(a => a.id)
    const { count } = await prisma.analise.deleteMany({ where: { id: { in: ids } } })
    resultado['analises'] = count
  } catch (err: any) {
    await prisma.logErro.create({
      data: {
        mensagem: '[cron/retencao] Erro ao limpar analises',
        detalhes: err?.message ?? String(err),
      },
    }).catch(() => {})
  }

  // b) Arquivos órfãos no banco (2 anos)
  try {
    const { count } = await prisma.arquivoAnalise.deleteMany({
      where: { criadoEm: { lt: corte2anos } },
    })
    resultado['arquivos_analise'] = count
  } catch (err: any) {
    await prisma.logErro.create({
      data: {
        mensagem: '[cron/retencao] Erro ao limpar arquivos_analise',
        detalhes: err?.message ?? String(err),
      },
    }).catch(() => {})
  }

  // c) Logs de acesso (1 ano)
  try {
    const { count } = await prisma.logAcesso.deleteMany({
      where: { criadoEm: { lt: corte1ano } },
    })
    resultado['logs_acesso'] = count
  } catch (err: any) {
    await prisma.logErro.create({
      data: {
        mensagem: '[cron/retencao] Erro ao limpar logs_acesso',
        detalhes: err?.message ?? String(err),
      },
    }).catch(() => {})
  }

  // d) Logs de erro (6 meses) — catch silencioso pois não há onde logar a falha
  try {
    const { count } = await prisma.logErro.deleteMany({
      where: { criadoEm: { lt: corte6meses } },
    })
    resultado['logs_erro'] = count
  } catch {}

  // Registrar execução bem-sucedida
  await prisma.logErro.create({
    data: {
      mensagem: '[cron/retencao] Retenção LGPD executada',
      detalhes: JSON.stringify({ rota: '/api/cron/retencao', executadoEm: agora.toISOString(), resultado }),
    },
  }).catch(() => {})

  return NextResponse.json({ ok: true, executadoEm: agora.toISOString(), resultado })
}
