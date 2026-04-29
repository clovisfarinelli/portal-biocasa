import NextAuth from 'next-auth'

export type Perfil = 'MASTER' | 'PROPRIETARIO' | 'ESPECIALISTA' | 'ASSISTENTE' | 'CORRETOR'

declare module 'next-auth' {
  interface User {
    id: string
    perfil: Perfil
    unidadeId: string | null
    unidadeNome: string | null
  }

  interface Session {
    user: User & {
      email: string
      name: string
    }
  }
}

declare module 'next-auth/jwt' {
  interface JWT {
    id: string
    perfil: Perfil
    unidadeId: string | null
    unidadeNome: string | null
  }
}
