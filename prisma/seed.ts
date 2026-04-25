import { PrismaClient, Perfil } from '@prisma/client'
import bcrypt from 'bcryptjs'

const prisma = new PrismaClient()

async function main() {
  // Configurações padrão
  await prisma.configuracao.upsert({
    where: { chave: 'cambio_dolar_real' },
    update: {},
    create: { chave: 'cambio_dolar_real', valor: '5.50' },
  })

  // Unidade padrão MASTER
  const unidadeMaster = await prisma.unidade.upsert({
    where: { id: 'unidade-master' },
    update: {},
    create: {
      id: 'unidade-master',
      nome: 'Biocasa HQ',
      estado: 'SP',
      limiteAnalises: 9999,
    },
  })

  // Usuário MASTER padrão
  const senhaHash = await bcrypt.hash('Biocasa@2026!', 12)
  await prisma.usuario.upsert({
    where: { email: 'master@biocasa.com.br' },
    update: {},
    create: {
      nome: 'Administrador Master',
      email: 'master@biocasa.com.br',
      senhaHash,
      perfil: Perfil.MASTER,
      unidadeId: unidadeMaster.id,
    },
  })

  console.log('Seed concluído. Usuário master@biocasa.com.br / Biocasa@2026!')
}

main()
  .catch(console.error)
  .finally(() => prisma.$disconnect())
