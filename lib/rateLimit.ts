type Bucket = { count: number; resetAt: number }
const buckets = new Map<string, Bucket>()

// Limpeza periódica para evitar crescimento ilimitado do Map
setInterval(() => {
  const agora = Date.now()
  Array.from(buckets.entries()).forEach(([chave, bucket]) => {
    if (agora > bucket.resetAt) buckets.delete(chave)
  })
}, 60_000)

export function checarRateLimit(chave: string, limite: number, janelaMs: number): boolean {
  const agora = Date.now()
  const bucket = buckets.get(chave)

  if (!bucket || agora > bucket.resetAt) {
    buckets.set(chave, { count: 1, resetAt: agora + janelaMs })
    return true
  }

  if (bucket.count >= limite) return false

  bucket.count++
  return true
}

export function ipDaRequisicao(req: Request): string {
  return (
    req.headers.get('x-forwarded-for')?.split(',')[0]?.trim() ??
    req.headers.get('x-real-ip') ??
    'unknown'
  )
}

export function respostaLimiteExcedido() {
  return Response.json(
    { erro: 'Muitas requisições. Aguarde um momento antes de tentar novamente.' },
    { status: 429 }
  )
}
