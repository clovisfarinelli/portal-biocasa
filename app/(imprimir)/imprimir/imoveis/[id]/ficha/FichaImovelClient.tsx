'use client'

import { useEffect } from 'react'
import FichaCaptacao from '@/components/imoveis/FichaCaptacao'
import type { DadosImovelFicha } from '@/components/imoveis/FichaCaptacao'

export default function FichaImovelClient({ dados }: { dados: DadosImovelFicha }) {
  useEffect(() => {
    window.print()
  }, [])

  return <FichaCaptacao dados={dados} />
}
