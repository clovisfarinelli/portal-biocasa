import { prisma } from '@/lib/prisma'

export type AcaoLog =
  | 'login'
  | 'logout'
  | 'analise_criada'
  | 'arquivo_enviado'
  | 'usuario_criado'
  | 'convite_enviado'
  | 'usuario_desativado'
  | 'usuario_reativado'
  | 'configuracao_alterada'
  | 'imovel_criado'
  | 'imovel_editado'
  | 'imovel_excluido'
  | 'exportacao'

export type RecursoLog =
  | 'sessao'
  | 'analise'
  | 'arquivo'
  | 'usuario'
  | 'imovel'
  | 'configuracao'

export async function registrarLog(params: {
  acao: AcaoLog
  recurso?: RecursoLog
  usuarioId?: string
  detalhes?: string
  ip?: string
}) {
  try {
    await prisma.logAcesso.create({
      data: {
        acao:      params.acao,
        recurso:   params.recurso ?? null,
        usuarioId: params.usuarioId ?? null,
        detalhes:  params.detalhes ?? null,
        ip:        params.ip ?? null,
      },
    })
  } catch {
    // Falha no log nunca deve interromper o fluxo principal
  }
}

export async function limparLogsAntigos(): Promise<number> {
  const limite = new Date()
  limite.setMonth(limite.getMonth() - 12)
  const { count } = await prisma.logAcesso.deleteMany({
    where: { criadoEm: { lt: limite } },
  })
  return count
}
