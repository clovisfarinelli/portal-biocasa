'use client'

import { useRouter } from 'next/navigation'

export default function PoliticaPrivacidade() {
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

        <h1 className="text-2xl font-bold mb-2">Política de Privacidade — Portal Biocasa</h1>
        <p className="text-sm text-gray-500 mb-8">Última atualização: Maio de 2026</p>

        <section className="mb-6">
          <h2 className="text-lg font-semibold mb-2">1. Quem somos</h2>
          <p className="text-sm leading-relaxed">
            CF8 Negócios Imobiliários Ltda, CNPJ 31.399.238/0001-65, com sede em Av. Conselheiro
            Nébias, 671, Santos/SP, responsável pelo Portal Biocasa (portal-biocasa.vercel.app).
          </p>
        </section>

        <section className="mb-6">
          <h2 className="text-lg font-semibold mb-2">2. Dados que coletamos</h2>
          <ul className="text-sm leading-relaxed list-disc pl-5 space-y-1">
            <li>Dados de cadastro: nome completo, endereço de e-mail, perfil de acesso</li>
            <li>
              Dados de uso: histórico de análises de viabilidade imobiliária realizadas, arquivos
              enviados (IPTU, documentos de imóveis), tokens consumidos
            </li>
            <li>
              Dados técnicos: endereço IP no momento do aceite dos termos, logs de acesso e erros
              do sistema
            </li>
          </ul>
        </section>

        <section className="mb-6">
          <h2 className="text-lg font-semibold mb-2">3. Finalidade do tratamento</h2>
          <ul className="text-sm leading-relaxed list-disc pl-5 space-y-1">
            <li>Prestação do serviço de análise de viabilidade imobiliária com IA</li>
            <li>Gestão de acesso e autenticação de usuários</li>
            <li>Melhoria contínua do sistema por meio de aprendizados validados</li>
            <li>Cumprimento de obrigações legais</li>
          </ul>
        </section>

        <section className="mb-6">
          <h2 className="text-lg font-semibold mb-2">4. Base legal (LGPD — Lei 13.709/2018)</h2>
          <ul className="text-sm leading-relaxed list-disc pl-5 space-y-1">
            <li>Consentimento do titular (Art. 7º, I) — para uso do portal</li>
            <li>Execução de contrato (Art. 7º, V) — para prestação do serviço</li>
            <li>Legítimo interesse (Art. 7º, IX) — para segurança e melhoria do sistema</li>
          </ul>
        </section>

        <section className="mb-6">
          <h2 className="text-lg font-semibold mb-2">5. Compartilhamento de dados</h2>
          <p className="text-sm leading-relaxed mb-2">
            Seus dados podem ser processados pelos seguintes operadores:
          </p>
          <ul className="text-sm leading-relaxed list-disc pl-5 space-y-1">
            <li>Vercel Inc. — hospedagem do portal e armazenamento de arquivos</li>
            <li>Google LLC — processamento de análises via API Gemini</li>
            <li>Hetzner Online GmbH — infraestrutura de banco de dados</li>
          </ul>
          <p className="text-sm leading-relaxed mt-2">
            Nenhum dado é vendido ou compartilhado com terceiros para fins comerciais.
          </p>
        </section>

        <section className="mb-6">
          <h2 className="text-lg font-semibold mb-2">6. Retenção de dados</h2>
          <ul className="text-sm leading-relaxed list-disc pl-5 space-y-1">
            <li>Análises de viabilidade: 5 anos</li>
            <li>Arquivos enviados: 2 anos</li>
            <li>Logs de acesso: 1 ano</li>
            <li>Logs de erro: 6 meses</li>
          </ul>
          <p className="text-sm leading-relaxed mt-2">
            Após os prazos acima, os dados são excluídos automaticamente.
          </p>
        </section>

        <section className="mb-6">
          <h2 className="text-lg font-semibold mb-2">7. Seus direitos</h2>
          <p className="text-sm leading-relaxed mb-2">Conforme a LGPD, você tem direito a:</p>
          <ul className="text-sm leading-relaxed list-disc pl-5 space-y-1">
            <li>Confirmar a existência de tratamento dos seus dados</li>
            <li>Acessar seus dados</li>
            <li>Corrigir dados incompletos ou desatualizados</li>
            <li>Solicitar a exclusão dos seus dados</li>
            <li>Revogar o consentimento</li>
          </ul>
          <p className="text-sm leading-relaxed mt-2">
            Para exercer seus direitos, entre em contato:{' '}
            <a
              href="mailto:santos@biocasaimob.com.br"
              className="text-blue-600 hover:underline"
            >
              santos@biocasaimob.com.br
            </a>
          </p>
        </section>

        <section className="mb-6">
          <h2 className="text-lg font-semibold mb-2">8. Segurança</h2>
          <p className="text-sm leading-relaxed">
            Adotamos medidas técnicas e organizacionais para proteger seus dados, incluindo
            autenticação segura, criptografia em trânsito (HTTPS) e controle de acesso por perfil
            de usuário.
          </p>
        </section>

        <section className="mb-6">
          <h2 className="text-lg font-semibold mb-2">9. Alterações</h2>
          <p className="text-sm leading-relaxed">
            Esta política pode ser atualizada periodicamente. Alterações significativas serão
            comunicadas no portal.
          </p>
        </section>

        <section className="mb-6">
          <h2 className="text-lg font-semibold mb-2">10. Contato</h2>
          <p className="text-sm leading-relaxed">
            <a
              href="mailto:santos@biocasaimob.com.br"
              className="text-blue-600 hover:underline"
            >
              santos@biocasaimob.com.br
            </a>
            <br />
            CF8 Negócios Imobiliários Ltda — Av. Cons. Nebias, 671 — Santos/SP
          </p>
        </section>
      </div>
    </div>
  )
}
