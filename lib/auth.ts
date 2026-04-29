import { NextAuthOptions } from 'next-auth'
import CredentialsProvider from 'next-auth/providers/credentials'
import bcrypt from 'bcryptjs'
import { prisma } from '@/lib/prisma'

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

        return {
          id: usuario.id,
          email: usuario.email,
          name: usuario.nome,
          perfil: usuario.perfil,
          unidadeId: usuario.unidadeId,
          unidadeNome: usuario.unidade?.nome ?? null,
          acessoImob: usuario.acessoImob,
          acessoIncorp: usuario.acessoIncorp,
        }
      },
    }),
  ],
  callbacks: {
    async jwt({ token, user }) {
      if (user) {
        token.id = user.id
        token.perfil = (user as any).perfil
        token.unidadeId = (user as any).unidadeId
        token.unidadeNome = (user as any).unidadeNome
        token.acessoImob = (user as any).acessoImob
        token.acessoIncorp = (user as any).acessoIncorp
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
      }
      return session
    },
  },
}
