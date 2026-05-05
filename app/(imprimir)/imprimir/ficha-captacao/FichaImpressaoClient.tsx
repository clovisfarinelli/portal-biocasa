'use client'

import { useEffect } from 'react'
import FichaCaptacao from '@/components/imoveis/FichaCaptacao'

export default function FichaImpressaoClient() {
  useEffect(() => {
    window.print()
  }, [])

  return <FichaCaptacao />
}
