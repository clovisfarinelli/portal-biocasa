import { prisma } from '@/lib/prisma'
import { enviarAlertaSeguranca } from '@/lib/email'

async function emailsMaster(): Promise<string[]> {
  try {
    const masters = await prisma.usuario.findMany({
      where: { perfil: 'MASTER', ativo: true },
      select: { email: true },
    })
    return masters.map(m => m.email)
  } catch {
    return []
  }
}

function horaSaoPaulo(): number {
  // São Paulo = UTC-3 (Brasil aboliu horário de verão em 2019)
  return (new Date().getUTCHours() + 21) % 24
}

// ─── 3+ logins falhos do mesmo IP em 10 minutos ──────────────────────────────

export async function verificarLoginFalhou(email: string, ip: string): Promise<void> {
  if (!ip || ip === 'unknown') return

  const limite = new Date(Date.now() - 10 * 60 * 1000)
  const count = await prisma.logAcesso.count({
    where: { acao: 'login_falhou', ip, criadoEm: { gte: limite } },
  })

  // Alerta a cada 3 tentativas (3, 6, 9…)
  if (count < 3 || count % 3 !== 0) return

  const emails = await emailsMaster()
  if (!emails.length) return

  const horario = new Date().toLocaleString('pt-BR', { timeZone: 'America/Sao_Paulo' })
  await enviarAlertaSeguranca(emails, 'login_falhou', [
    { label: 'Email tentado',    valor: email },
    { label: 'IP de origem',     valor: ip },
    { label: 'Tentativas (10m)', valor: String(count) },
    { label: 'Horário',          valor: horario },
  ])
}

// ─── login fora do horário comercial (07h–22h hora de SP) ───────────────────

export async function verificarLoginForaHorario(usuario: {
  nome:   string
  email:  string
  perfil: string
}): Promise<void> {
  const hora = horaSaoPaulo()
  if (hora >= 7 && hora < 22) return

  const emails = await emailsMaster()
  if (!emails.length) return

  const horario = new Date().toLocaleString('pt-BR', { timeZone: 'America/Sao_Paulo' })
  await enviarAlertaSeguranca(emails, 'login_fora_horario', [
    { label: 'Usuário', valor: `${usuario.nome} (${usuario.email})` },
    { label: 'Perfil',  valor: usuario.perfil },
    { label: 'Horário', valor: horario },
  ])
}

// ─── 5+ exportações do mesmo usuário em 1 hora ───────────────────────────────

export async function verificarExportacaoAbusiva(usuarioId: string, nome: string): Promise<void> {
  const limite = new Date(Date.now() - 60 * 60 * 1000)
  const count = await prisma.logAcesso.count({
    where: { acao: 'exportacao', usuarioId, criadoEm: { gte: limite } },
  })

  if (count !== 5) return // alerta apenas no primeiro cruzamento do limiar

  const emails = await emailsMaster()
  if (!emails.length) return

  const horario = new Date().toLocaleString('pt-BR', { timeZone: 'America/Sao_Paulo' })
  await enviarAlertaSeguranca(emails, 'exportacao_abusiva', [
    { label: 'Usuário',            valor: nome },
    { label: 'Exportações (1h)',   valor: String(count) },
    { label: 'Horário',            valor: horario },
  ])
}
