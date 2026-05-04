import { Resend } from 'resend'

const [resendApiKey, resendFrom] = (process.env.RESEND_CONFIG ?? '|').split('|')
const resend = new Resend(resendApiKey || undefined)
const FROM   = resendFrom || 'onboarding@resend.dev'

function htmlConvite(nome: string, url: string): string {
  return `<!DOCTYPE html>
<html lang="pt-BR">
<head><meta charset="utf-8"><meta name="viewport" content="width=device-width,initial-scale=1"></head>
<body style="margin:0;padding:0;background-color:#1A1A2E;font-family:Arial,sans-serif;">
  <table width="100%" cellpadding="0" cellspacing="0">
    <tr><td align="center" style="padding:40px 20px;">
      <table width="560" cellpadding="0" cellspacing="0" style="background-color:#242438;border-radius:12px;overflow:hidden;max-width:560px;width:100%;">
        <tr>
          <td align="center" style="padding:32px 40px 24px;border-bottom:1px solid #3A3A5C;">
            <h1 style="margin:0;font-size:28px;font-weight:bold;color:#C9A84C;letter-spacing:4px;">BIOCASA</h1>
          </td>
        </tr>
        <tr>
          <td style="padding:36px 40px;">
            <h2 style="margin:0 0 16px;font-size:22px;color:#FFFFFF;">Bem-vindo ao Portal Biocasa!</h2>
            <p style="margin:0 0 12px;font-size:15px;color:#A0A0C0;line-height:1.6;">
              Olá, <strong style="color:#FFFFFF;">${nome}</strong>!
            </p>
            <p style="margin:0 0 28px;font-size:15px;color:#A0A0C0;line-height:1.6;">
              Você foi convidado para acessar o Portal Biocasa. Clique no botão abaixo para definir sua senha e ativar sua conta.
            </p>
            <table cellpadding="0" cellspacing="0" style="margin:0 auto 28px;">
              <tr>
                <td align="center" style="background-color:#C9A84C;border-radius:8px;">
                  <a href="${url}" style="display:block;padding:14px 32px;font-size:16px;font-weight:bold;color:#1A1A2E;text-decoration:none;white-space:nowrap;">
                    Ativar minha conta
                  </a>
                </td>
              </tr>
            </table>
            <p style="margin:0 0 6px;font-size:13px;color:#6B6B8A;">Se o botão não funcionar, copie este link:</p>
            <p style="margin:0 0 28px;font-size:12px;color:#C9A84C;word-break:break-all;">${url}</p>
            <div style="background-color:#2A2A40;border:1px solid #3A3A5C;border-radius:8px;padding:16px;">
              <p style="margin:0;font-size:13px;color:#A0A0C0;">
                ⚠️ Este link expira em <strong style="color:#FFFFFF;">24 horas</strong>.
                Após esse prazo, solicite um novo convite ao administrador.
              </p>
            </div>
          </td>
        </tr>
        <tr>
          <td style="padding:20px 40px;border-top:1px solid #3A3A5C;text-align:center;">
            <p style="margin:0;font-size:12px;color:#4A4A6A;">Portal Biocasa — Análise de Viabilidade Imobiliária</p>
          </td>
        </tr>
      </table>
    </td></tr>
  </table>
</body>
</html>`
}

// ─── alerta de segurança ─────────────────────────────────────────────────────

type TipoAlerta = 'login_falhou' | 'login_fora_horario' | 'exportacao_abusiva'

const TITULO_ALERTA: Record<TipoAlerta, string> = {
  login_falhou:       '⚠️ Tentativas de login suspeitas detectadas',
  login_fora_horario: '🌙 Login fora do horário comercial',
  exportacao_abusiva: '📤 Volume anormal de exportações',
}

function htmlAlerta(tipo: TipoAlerta, linhas: { label: string; valor: string }[]): string {
  const titulo = TITULO_ALERTA[tipo]
  const linhasHtml = linhas.map(l => `
    <tr>
      <td style="padding:6px 0;font-size:13px;color:#A0A0C0;white-space:nowrap;padding-right:24px;">${l.label}</td>
      <td style="padding:6px 0;font-size:13px;color:#FFFFFF;font-weight:500;">${l.valor}</td>
    </tr>`).join('')

  return `<!DOCTYPE html>
<html lang="pt-BR">
<head><meta charset="utf-8"><meta name="viewport" content="width=device-width,initial-scale=1"></head>
<body style="margin:0;padding:0;background-color:#1A1A2E;font-family:Arial,sans-serif;">
  <table width="100%" cellpadding="0" cellspacing="0">
    <tr><td align="center" style="padding:40px 20px;">
      <table width="560" cellpadding="0" cellspacing="0" style="background-color:#242438;border-radius:12px;overflow:hidden;max-width:560px;width:100%;">
        <tr>
          <td align="center" style="padding:24px 40px;border-bottom:1px solid #3A3A5C;">
            <h1 style="margin:0;font-size:22px;font-weight:bold;color:#C9A84C;letter-spacing:3px;">BIOCASA</h1>
            <p style="margin:8px 0 0;font-size:11px;color:#6B6B8A;letter-spacing:1px;text-transform:uppercase;">Alerta de Segurança</p>
          </td>
        </tr>
        <tr>
          <td style="padding:28px 40px;">
            <h2 style="margin:0 0 20px;font-size:18px;color:#FFFFFF;">${titulo}</h2>
            <div style="background-color:#2A2A40;border:1px solid #3A3A5C;border-radius:8px;padding:20px 24px;">
              <table cellpadding="0" cellspacing="0" width="100%">
                <tbody>${linhasHtml}</tbody>
              </table>
            </div>
            <p style="margin:20px 0 0;font-size:13px;color:#A0A0C0;line-height:1.6;">
              Se esta atividade não foi autorizada, acesse o painel de auditoria imediatamente.
            </p>
          </td>
        </tr>
        <tr>
          <td style="padding:16px 40px;border-top:1px solid #3A3A5C;text-align:center;">
            <p style="margin:0;font-size:11px;color:#4A4A6A;">Portal Biocasa — Alerta automático de segurança</p>
          </td>
        </tr>
      </table>
    </td></tr>
  </table>
</body>
</html>`
}

export async function enviarAlertaSeguranca(
  emails: string[],
  tipo: TipoAlerta,
  linhas: { label: string; valor: string }[],
): Promise<void> {
  if (!resendApiKey || !emails.length) return
  try {
    await resend.emails.send({
      from: FROM,
      to: emails,
      subject: TITULO_ALERTA[tipo] + ' — Portal Biocasa',
      html: htmlAlerta(tipo, linhas),
    })
  } catch (err) {
    console.error('[email] Falha ao enviar alerta de segurança:', err)
  }
}

// ─── convite ──────────────────────────────────────────────────────────────────

export async function enviarConvite(nome: string, email: string, url: string): Promise<boolean> {
  if (!resendApiKey) {
    console.warn('[email] RESEND_CONFIG não configurado — email não enviado')
    return false
  }
  try {
    const { error } = await resend.emails.send({
      from: FROM,
      to: email,
      subject: 'Seu convite para o Portal Biocasa',
      html: htmlConvite(nome, url),
    })
    if (error) { console.error('[email] Resend erro:', error); return false }
    return true
  } catch (err) {
    console.error('[email] Falha ao enviar convite:', err)
    return false
  }
}
