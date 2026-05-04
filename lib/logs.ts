import { prisma } from '@/lib/prisma'

export type AcaoLog =
  | 'login'
  | 'logout'
  | 'analise_criada'
  | 'arquivo_enviado'
  | 'usuario_criado'
  | 'convite_enviado'
  | 'configuracao_alterada'
  | 'usuario_desativado'

export async function registrarLog(params: {
  acao: AcaoLog
  usuarioId?: string
  detalhes?: string
  ip?: string
}) {
  try {
    await prisma.logAcesso.create({
      data: {
        acao: params.acao,
        usuarioId: params.usuarioId ?? null,
        detalhes: params.detalhes ?? null,
        ip: params.ip ?? null,
      },
    })
  } catch {
    // Falha no log nunca deve interromper o fluxo principal
  }
}
