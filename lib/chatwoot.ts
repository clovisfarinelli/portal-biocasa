const CHATWOOT_URL        = 'https://atendimento.cf8.com.br'
const CHATWOOT_ACCOUNT_ID = parseInt(process.env.CHATWOOT_ACCOUNT_ID ?? '2', 10)

interface ChatwootUsuario {
  chatwootUserId:    number
  chatwootToken:     string
  chatwootAccountId: number
}

function roleChatwoot(perfil: string): 'administrator' | 'agent' {
  return ['MASTER', 'PROPRIETARIO'].includes(perfil) ? 'administrator' : 'agent'
}

function customRoleChatwoot(perfil: string): number | undefined {
  if (perfil === 'ASSISTENTE') return 1
  if (perfil === 'CORRETOR')   return 2
  return undefined
}

export async function criarUsuarioChatwoot(
  nome: string,
  email: string,
  perfil: string,
): Promise<ChatwootUsuario | null> {
  const platformToken = process.env.CHATWOOT_PLATFORM_TOKEN
  if (!platformToken) return null

  const role       = roleChatwoot(perfil)
  const customRole = customRoleChatwoot(perfil)
  const senha      = `Cw${crypto.randomUUID().replace(/-/g, '')}!`

  const createResp = await fetch(`${CHATWOOT_URL}/platform/api/v1/users`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json', api_access_token: platformToken },
    body: JSON.stringify({ name: nome, email, password: senha, role }),
  })

  if (!createResp.ok) {
    console.error('[chatwoot] criar usuário falhou:', createResp.status, await createResp.text())
    return null
  }

  const cwUser = await createResp.json()

  // Associar à conta e aplicar custom_role via API de conta
  const accountToken = process.env.CHATWOOT_ACCOUNT_TOKEN
  if (accountToken) {
    const assocResp = await fetch(
      `${CHATWOOT_URL}/api/v1/accounts/${CHATWOOT_ACCOUNT_ID}/agents`,
      {
        method: 'POST',
        headers: { 'Content-Type': 'application/json', api_access_token: accountToken },
        body: JSON.stringify({ email, name: nome, role }),
      },
    ).catch((err) => { console.error('[chatwoot] associar conta falhou:', err); return null })

    if (assocResp && !assocResp.ok) {
      console.error('[chatwoot] associar conta falhou:', assocResp.status, await assocResp.text())
    }

    // Aplicar custom_role_id para ASSISTENTE e CORRETOR
    if (customRole !== undefined) {
      await fetch(
        `${CHATWOOT_URL}/api/v1/accounts/${CHATWOOT_ACCOUNT_ID}/agents/${cwUser.id}`,
        {
          method: 'PUT',
          headers: { 'Content-Type': 'application/json', api_access_token: accountToken },
          body: JSON.stringify({ custom_role_id: customRole }),
        },
      ).catch((err) => console.error('[chatwoot] custom_role falhou:', err))
    }
  } else {
    console.warn('[chatwoot] CHATWOOT_ACCOUNT_TOKEN não configurado — usuário criado sem associação de conta')
  }

  return {
    chatwootUserId:    cwUser.id,
    chatwootToken:     cwUser.access_token,
    chatwootAccountId: CHATWOOT_ACCOUNT_ID,
  }
}

export async function atualizarSenhaChatwoot(chatwootUserId: number, senha: string): Promise<void> {
  const platformToken = process.env.CHATWOOT_PLATFORM_TOKEN
  if (!platformToken) return

  const resp = await fetch(`${CHATWOOT_URL}/platform/api/v1/users/${chatwootUserId}`, {
    method: 'PUT',
    headers: { 'Content-Type': 'application/json', api_access_token: platformToken },
    body: JSON.stringify({ password: senha, password_confirmation: senha }),
  })

  if (!resp.ok) {
    console.error('[chatwoot] atualizar senha falhou:', resp.status, await resp.text())
  }
}

export async function desassociarUsuarioChatwoot(
  chatwootUserId: number,
  accountId: number = CHATWOOT_ACCOUNT_ID,
): Promise<void> {
  const platformToken = process.env.CHATWOOT_PLATFORM_TOKEN
  if (!platformToken) return

  const resp = await fetch(
    `${CHATWOOT_URL}/platform/api/v1/accounts/${accountId}/account_users`,
    {
      method: 'DELETE',
      headers: { 'Content-Type': 'application/json', api_access_token: platformToken },
      body: JSON.stringify({ user_id: chatwootUserId }),
    },
  )

  if (!resp.ok && resp.status !== 404) {
    console.error('[chatwoot] desassociar falhou:', resp.status, await resp.text())
  }
}
