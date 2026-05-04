import { NextAuthOptions } from 'next-auth'
import CredentialsProvider from 'next-auth/providers/credentials'
import bcrypt from 'bcryptjs'
import { prisma } from '@/lib/prisma'
import { registrarLog } from '@/lib/logs'
import { verify as totpVerify, generateSecret as totpGenerateSecret } from 'otplib'
import { verificarLoginForaHorario } from '@/lib/alertas'

const GRACE_PERIOD_MS = 24 * 60 * 60 * 1000 // 24 horas

export const authOptions: NextAuthOptions = {
  session: { strategy: 'jwt' },
  pages: {
    signIn: '/login',
    error: '/login',
  },
  providers: [
    CredentialsProvider({
      name: 'credentials',
      credentials: {
        email: { label: 'Email', type: 'email' },
        password: { label: 'Senha', type: 'password' },
        totpCode: { label: 'Código 2FA', type: 'text' },
      },
      async authorize(credentials) {
        if (!credentials?.email || !credentials?.password) return null

        const usuario = await prisma.usuario.findUnique({
          where: { email: credentials.email },
          include: { unidade: true },
        })

        if (!usuario || !usuario.ativo) return null

        const senhaValida = await bcrypt.compare(credentials.password, usuario.senhaHash)
        if (!senhaValida) return null

        // Verificação 2FA para MASTER
        if (usuario.perfil === 'MASTER' && usuario.totpAtivado) {
          const codigo = credentials.totpCode as string | undefined
          if (!codigo) return null
          const resultado = await totpVerify({ token: codigo, secret: usuario.totpSecret! })
          if (!resultado?.valid) return null
        }

        // Inicia período de carência para MASTER sem 2FA ainda configurado
        let graceExpiraEm = usuario.totpGraceExpiraEm
        if (usuario.perfil === 'MASTER' && !usuario.totpAtivado && !graceExpiraEm) {
          graceExpiraEm = new Date(Date.now() + GRACE_PERIOD_MS)
          await prisma.usuario.update({
            where: { id: usuario.id },
            data: { totpGraceExpiraEm: graceExpiraEm },
          })
        }

        return {
          id: usuario.id,
          email: usuario.email,
          name: usuario.nome,
          perfil: usuario.perfil,
          unidadeId: usuario.unidadeId,
          unidadeNome: usuario.unidade?.nome ?? null,
          acessoImob: usuario.acessoImob,
          acessoIncorp: usuario.acessoIncorp,
          totpAtivado: usuario.totpAtivado,
          totpGraceExpiraEm: graceExpiraEm?.toISOString() ?? null,
        }
      },
    }),
  ],
  events: {
    async signIn({ user }) {
      await registrarLog({ acao: 'login', recurso: 'sessao', usuarioId: user.id })
      verificarLoginForaHorario({
        nome:   user.name  ?? '',
        email:  user.email ?? '',
        perfil: (user as any).perfil ?? '',
      }).catch(console.error)
    },
  },
  callbacks: {
    async jwt({ token, user }) {
      if (user) {
        token.id = user.id
        token.perfil = (user as any).perfil
        token.unidadeId = (user as any).unidadeId
        token.unidadeNome = (user as any).unidadeNome
        token.acessoImob = (user as any).acessoImob
        token.acessoIncorp = (user as any).acessoIncorp
        token.totpAtivado = (user as any).totpAtivado
        token.totpGraceExpiraEm = (user as any).totpGraceExpiraEm
      }
      return token
    },
    async session({ session, token }) {
      if (session.user) {
        (session.user as any).id = token.id
        ;(session.user as any).perfil = token.perfil
        ;(session.user as any).unidadeId = token.unidadeId
        ;(session.user as any).unidadeNome = token.unidadeNome
        ;(session.user as any).acessoImob = token.acessoImob
        ;(session.user as any).acessoIncorp = token.acessoIncorp
        ;(session.user as any).totpAtivado = token.totpAtivado
        ;(session.user as any).totpGraceExpiraEm = token.totpGraceExpiraEm
      }
      return session
    },
  },
}
