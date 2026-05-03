const CHATWOOT_URL    = 'https://atendimento.cf8.com.br'
const CHATWOOT_ACCOUNT_ID = parseInt(process.env.CHATWOOT_ACCOUNT_ID ?? '2', 10)

interface ChatwootUsuario {
  chatwootUserId:    number
  chatwootToken:     string
  chatwootAccountId: number
}

function roleChatwoot(perfil: string): 'administrator' | 'agent' {
  return ['MASTER', 'PROPRIETARIO'].includes(perfil) ? 'administrator' : 'agent'
}

export async function criarUsuarioChatwoot(
  nome: string,
  email: string,
  perfil: string,
): Promise<ChatwootUsuario | null> {
  const platformToken = process.env.CHATWOOT_PLATFORM_TOKEN
  if (!platformToken) return null

  const role  = roleChatwoot(perfil)
  const senha = `Cw${crypto.randomUUID().replace(/-/g, '')}!`

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

  // Associar à conta (ignora falha — usuário já existe no Chatwoot)
  await fetch(`${CHATWOOT_URL}/platform/api/v1/accounts/${CHATWOOT_ACCOUNT_ID}/account_users`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json', api_access_token: platformToken },
    body: JSON.stringify({ user_id: cwUser.id, role }),
  }).catch((err) => console.error('[chatwoot] associar conta falhou:', err))

  return {
    chatwootUserId:    cwUser.id,
    chatwootToken:     cwUser.access_token,
    chatwootAccountId: CHATWOOT_ACCOUNT_ID,
  }
}
