import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'
import bcrypt from 'bcryptjs'

// Verifica se o usuário existe, se a senha está certa e se precisa de TOTP.
// Não cria sessão — apenas informa o frontend para mostrar o campo TOTP.
export async function POST(req: NextRequest) {
  try {
    const { email, password } = await req.json()

    if (!email || !password) {
      return NextResponse.json({ ok: false, totpRequired: false })
    }

    const usuario = await prisma.usuario.findUnique({ where: { email } })

    // Hash dummy para evitar timing attack quando o usuário não existe
    const hashDummy = '$2b$12$KIXLrMVmqiA2s0xBaxkPBuaJN2EITqpqV.eWfMdMBL.F3GqMlbJ9i'
    const hashReal = usuario?.senhaHash ?? hashDummy

    const senhaOk = await bcrypt.compare(password, hashReal)

    if (!usuario || !usuario.ativo || !senhaOk) {
      return NextResponse.json({ ok: false, totpRequired: false })
    }

    return NextResponse.json({
      ok: true,
      totpRequired: usuario.perfil === 'MASTER' && usuario.totpAtivado,
    })
  } catch (err) {
    console.error('[preflight] erro:', err)
    return NextResponse.json({ ok: false, totpRequired: false, _erro: String(err) }, { status: 500 })
  }
}
