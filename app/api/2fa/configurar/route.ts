import { NextRequest, NextResponse } from 'next/server'
import { getServerSession } from 'next-auth'
import { authOptions } from '@/lib/auth'
import { prisma } from '@/lib/prisma'
import { verify as totpVerify, generateSecret as totpGenerateSecret, generateURI as totpGenerateURI } from 'otplib'
import QRCode from 'qrcode'

// GET — gera segredo TOTP e retorna QR code (sem salvar ainda)
export async function GET() {
  const session = await getServerSession(authOptions)
  if (!session) return NextResponse.json({ erro: 'Não autorizado' }, { status: 401 })

  const usuario = session.user as any
  if (usuario.perfil !== 'MASTER') {
    return NextResponse.json({ erro: 'Apenas MASTER pode configurar 2FA' }, { status: 403 })
  }

  const segredo = totpGenerateSecret()
  const otpauth = totpGenerateURI({
    secret: segredo,
    label: usuario.email,
    issuer: 'Portal Biocasa',
    algorithm: 'sha1',
    digits: 6,
    period: 30,
  })
  const qrcode = await QRCode.toDataURL(otpauth)

  // Salva o segredo provisório (não ativado ainda)
  await prisma.usuario.update({
    where: { id: usuario.id },
    data: { totpSecret: segredo, totpAtivado: false },
  })

  return NextResponse.json({ segredo, qrcode })
}

// POST — valida o primeiro código e ativa o 2FA
export async function POST(req: NextRequest) {
  const session = await getServerSession(authOptions)
  if (!session) return NextResponse.json({ erro: 'Não autorizado' }, { status: 401 })

  const usuario = session.user as any
  if (usuario.perfil !== 'MASTER') {
    return NextResponse.json({ erro: 'Apenas MASTER pode configurar 2FA' }, { status: 403 })
  }

  const { codigo } = await req.json()
  if (!codigo) return NextResponse.json({ erro: 'Código obrigatório' }, { status: 400 })

  const usuarioBd = await prisma.usuario.findUnique({ where: { id: usuario.id } })
  if (!usuarioBd?.totpSecret) {
    return NextResponse.json({ erro: 'Gere o QR code primeiro' }, { status: 400 })
  }

  const resultado = await totpVerify({ token: codigo, secret: usuarioBd.totpSecret })
  if (!resultado?.valid) {
    return NextResponse.json({ erro: 'Código inválido. Verifique o horário do dispositivo.' }, { status: 400 })
  }

  await prisma.usuario.update({
    where: { id: usuario.id },
    data: { totpAtivado: true },
  })

  return NextResponse.json({ ok: true })
}

// DELETE — desativa o 2FA (requer código válido)
export async function DELETE(req: NextRequest) {
  const session = await getServerSession(authOptions)
  if (!session) return NextResponse.json({ erro: 'Não autorizado' }, { status: 401 })

  const usuario = session.user as any
  if (usuario.perfil !== 'MASTER') {
    return NextResponse.json({ erro: 'Apenas MASTER pode alterar 2FA' }, { status: 403 })
  }

  const { codigo } = await req.json()
  if (!codigo) return NextResponse.json({ erro: 'Código obrigatório' }, { status: 400 })

  const usuarioBd = await prisma.usuario.findUnique({ where: { id: usuario.id } })
  if (!usuarioBd?.totpSecret || !usuarioBd.totpAtivado) {
    return NextResponse.json({ erro: '2FA não está ativo' }, { status: 400 })
  }

  const resultado = await totpVerify({ token: codigo, secret: usuarioBd.totpSecret })
  if (!resultado?.valid) {
    return NextResponse.json({ erro: 'Código inválido' }, { status: 400 })
  }

  await prisma.usuario.update({
    where: { id: usuario.id },
    data: { totpSecret: null, totpAtivado: false },
  })

  return NextResponse.json({ ok: true })
}
