'use client'

import { useRouter } from 'next/navigation'

export default function TermosDeUso() {
  const router = useRouter()

  return (
    <div className="min-h-screen bg-white text-gray-800 py-12 px-4">
      <div className="max-w-[800px] mx-auto">
        <button
          onClick={() => router.back()}
          className="text-sm text-gray-500 hover:text-gray-700 mb-8 inline-flex items-center gap-1 transition-colors"
        >
          ← Voltar
        </button>

        <h1 className="text-2xl font-bold mb-2">Termos de Uso — Portal Biocasa</h1>
        <p className="text-sm text-gray-500 mb-8">Última atualização: Maio de 2026</p>

        <section className="mb-6">
          <h2 className="text-lg font-semibold mb-2">1. Aceitação</h2>
          <p className="text-sm leading-relaxed">
            Ao utilizar o Portal Biocasa, você concorda com estes Termos de Uso. O acesso é
            restrito a usuários autorizados pela CF8 Negócios Imobiliários Ltda.
          </p>
        </section>

        <section className="mb-6">
          <h2 className="text-lg font-semibold mb-2">2. O que é o Portal Biocasa</h2>
          <p className="text-sm leading-relaxed">
            Ferramenta de análise de viabilidade imobiliária com inteligência artificial, destinada
            a corretores, analistas e gestores da rede Biocasa. As análises são geradas com base
            nos dados fornecidos pelo usuário e em documentos de referência cadastrados pela equipe
            Biocasa.
          </p>
        </section>

        <section className="mb-6">
          <h2 className="text-lg font-semibold mb-2">3. Responsabilidades do usuário</h2>
          <ul className="text-sm leading-relaxed list-disc pl-5 space-y-1">
            <li>Fornecer informações verdadeiras e precisas nas análises</li>
            <li>Não compartilhar suas credenciais de acesso</li>
            <li>Usar o portal exclusivamente para fins profissionais relacionados à Biocasa</li>
            <li>Manter a confidencialidade das análises geradas</li>
          </ul>
        </section>

        <section className="mb-6">
          <h2 className="text-lg font-semibold mb-2">4. Limitação de responsabilidade</h2>
          <p className="text-sm leading-relaxed mb-2">
            As análises geradas pelo portal são ferramentas de apoio à decisão. A CF8 Negócios
            Imobiliários Ltda não se responsabiliza por:
          </p>
          <ul className="text-sm leading-relaxed list-disc pl-5 space-y-1">
            <li>Decisões de investimento tomadas com base exclusivamente nas análises</li>
            <li>Imprecisões decorrentes de dados incorretos fornecidos pelo usuário</li>
            <li>Indisponibilidade temporária do serviço por manutenção ou falhas técnicas</li>
          </ul>
        </section>

        <section className="mb-6">
          <h2 className="text-lg font-semibold mb-2">5. Propriedade intelectual</h2>
          <p className="text-sm leading-relaxed">
            O portal, seus componentes e metodologias são de propriedade da CF8 Negócios
            Imobiliários Ltda. É vedada a reprodução ou distribuição sem autorização expressa.
          </p>
        </section>

        <section className="mb-6">
          <h2 className="text-lg font-semibold mb-2">6. Acesso e suspensão</h2>
          <p className="text-sm leading-relaxed">
            A CF8 reserva-se o direito de suspender ou encerrar o acesso de qualquer usuário que
            viole estes termos ou use o portal de forma inadequada.
          </p>
        </section>

        <section className="mb-6">
          <h2 className="text-lg font-semibold mb-2">7. Legislação aplicável</h2>
          <p className="text-sm leading-relaxed">
            Estes termos são regidos pela legislação brasileira. Foro: Comarca de Santos/SP.
          </p>
        </section>

        <section className="mb-6">
          <h2 className="text-lg font-semibold mb-2">8. Contato</h2>
          <p className="text-sm leading-relaxed">
            <a
              href="mailto:santos@biocasaimob.com.br"
              className="text-blue-600 hover:underline"
            >
              santos@biocasaimob.com.br
            </a>
            <br />
            CF8 Negócios Imobiliários Ltda — Av. Conselheiro Nébias, 671 — Santos/SP
          </p>
        </section>
      </div>
    </div>
  )
}
