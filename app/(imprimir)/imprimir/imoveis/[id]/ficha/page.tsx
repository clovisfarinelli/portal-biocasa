import { getServerSession } from 'next-auth'
import { authOptions } from '@/lib/auth'
import { redirect, notFound } from 'next/navigation'
import { prisma } from '@/lib/prisma'
import FichaImovelClient from './FichaImovelClient'
import type { DadosImovelFicha } from '@/components/imoveis/FichaCaptacao'

export default async function FichaImovelPage({ params }: { params: { id: string } }) {
  const session = await getServerSession(authOptions)
  const usuario = session?.user as any
  const perfil = usuario?.perfil as string

  if (!['MASTER', 'PROPRIETARIO', 'ASSISTENTE'].includes(perfil)) {
    redirect('/imoveis')
  }

  const imovel = await prisma.imovel.findUnique({
    where: { id: params.id },
    include: { unidade: { select: { nome: true } } },
  })

  if (!imovel) notFound()

  if (perfil !== 'MASTER' && imovel.unidadeId !== usuario.unidadeId) {
    redirect('/imoveis')
  }

  const dados: DadosImovelFicha = {
    codigoRef: imovel.codigoRef,
    nome: imovel.nome,
    finalidade: imovel.finalidade,
    tipo: imovel.tipo,
    subtipo: imovel.subtipo,
    cep: imovel.cep,
    logradouro: imovel.logradouro,
    numero: imovel.numero,
    complemento: imovel.complemento,
    bairro: imovel.bairro,
    cidade: imovel.cidade,
    estado: imovel.estado,
    edificio: imovel.edificio,
    proprietario: imovel.proprietario,
    telProprietario: imovel.telProprietario,
    captador: imovel.captador,
    parceria: imovel.parceria,
    modalidade: imovel.modalidade,
    valorVenda: imovel.valorVenda,
    valorLocacao: imovel.valorLocacao,
    valorCondominio: imovel.valorCondominio,
    valorIptu: imovel.valorIptu,
    areaUtil: imovel.areaUtil,
    areaTotal: imovel.areaTotal,
    aceitaPermuta: imovel.aceitaPermuta,
    documentacaoOk: imovel.documentacaoOk,
    aceitaFinanc: imovel.aceitaFinanc,
    dormitorios: imovel.dormitorios,
    suites: imovel.suites,
    totalBanheiros: imovel.totalBanheiros,
    situacaoImovel: imovel.situacaoImovel,
    vagasGaragem: imovel.vagasGaragem,
    tipoGaragem: imovel.tipoGaragem,
    dependencia: imovel.dependencia,
    vistaMar: imovel.vistaMar,
    tipoVistaMar: imovel.tipoVistaMar,
    facilidadesImovel: imovel.facilidadesImovel,
    facilidadesImovelOutros: imovel.facilidadesImovelOutros,
    facilidadesCond: imovel.facilidadesCond,
    facilidadesCondOutros: imovel.facilidadesCondOutros,
    descricao: imovel.descricao,
    acesso: imovel.acesso,
    andar: imovel.andar,
    unidadeNome: imovel.unidade?.nome,
  }

  return <FichaImovelClient dados={dados} />
}
