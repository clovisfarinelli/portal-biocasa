'use client'

import { useState, useEffect, useRef } from 'react'
import { useRouter } from 'next/navigation'
import GerenciarFotosModal from './GerenciarFotosModal'
import TagInput from '@/components/TagInput'
import { formatarMoeda } from '@/lib/utils'

// ─── Constantes ──────────────────────────────────────────────────────────────

const TIPOS_RESIDENCIAL = [
  { value: 'CASA', label: 'Casa' },
  { value: 'APARTAMENTO', label: 'Apartamento' },
  { value: 'TERRENO', label: 'Terreno' },
  { value: 'CHACARA', label: 'Chácara' },
]

const TIPOS_COMERCIAL = [
  { value: 'SALA', label: 'Sala' },
  { value: 'LOJA', label: 'Loja' },
  { value: 'CASA_COMERCIAL', label: 'Casa Comercial' },
  { value: 'GALPAO', label: 'Galpão' },
]

const SUBTIPOS: Record<string, { value: string; label: string }[]> = {
  CASA: [
    { value: 'ISOLADA', label: 'Isolada' },
    { value: 'SOBRADO', label: 'Sobrado' },
    { value: 'SOBREPOSTA_ALTA', label: 'Sobreposta Alta' },
    { value: 'SOBREPOSTA_BAIXA', label: 'Sobreposta Baixa' },
    { value: 'VILLAGGIO', label: 'Villaggio' },
  ],
  APARTAMENTO: [
    { value: 'KITNET', label: 'Kitnet' },
    { value: 'STUDIO', label: 'Studio' },
    { value: 'PADRAO', label: 'Padrão' },
  ],
}

const FACILIDADES_IMOVEL = [
  { id: 'ARMARIOS_QUARTOS', label: 'Armários Quartos' },
  { id: 'COZ_PLANEJADA', label: 'Coz. Planejada' },
  { id: 'VENTILADOR_TETO', label: 'Ventilador Teto' },
  { id: 'AR_CONDICIONADO', label: 'Ar Condicionado' },
  { id: 'VARANDA_GOURMET', label: 'Varanda Gourmet' },
  { id: 'CHURRASQUEIRA', label: 'Churrasqueira' },
  { id: 'OUTROS', label: 'Outros' },
]

const FACILIDADES_COND = [
  { id: 'PISCINA', label: 'Piscina' },
  { id: 'ACADEMIA', label: 'Academia' },
  { id: 'SALAO_FESTAS', label: 'Salão de Festas' },
  { id: 'SALAO_JOGOS', label: 'Salão de Jogos' },
  { id: 'PLAYGROUND', label: 'Playground' },
  { id: 'OUTROS', label: 'Outros' },
]

const SUFFIX_PARCERIA = '\n\nImóvel em Parceria Imobiliária'

function formatarTelefone(valor: string): string {
  const nums = valor.replace(/\D/g, '').slice(0, 11)
  if (!nums) return ''
  if (nums.length <= 2) return `(${nums}`
  if (nums.length <= 6) return `(${nums.slice(0, 2)}) ${nums.slice(2)}`
  const isCelular = nums[2] === '9'
  if (isCelular) {
    if (nums.length <= 7) return `(${nums.slice(0, 2)}) ${nums.slice(2)}`
    return `(${nums.slice(0, 2)}) ${nums.slice(2, 7)}-${nums.slice(7)}`
  }
  return `(${nums.slice(0, 2)}) ${nums.slice(2, 6)}-${nums.slice(6)}`
}

// ─── Tipos ────────────────────────────────────────────────────────────────────

export interface ImovelCompleto {
  id: string
  codigoRef: string
  nome: string | null
  finalidade: string
  tipo: string
  subtipo: string | null
  logradouro: string
  numero: string | null
  complemento: string | null
  bairro: string
  cidade: string
  estado: string
  cep: string | null
  edificio: string | null
  andar: number | null
  acesso: string | null
  proprietario: string | null
  telProprietario: string | null
  captador: string | null
  parceria: boolean
  nomeParceiro: string | null
  modalidade: string
  valorVenda: number | null
  valorLocacao: number | null
  locacaoPacote: boolean
  valorCondominio: number | null
  valorIptu: number | null
  areaUtil: number | null
  areaTotal: number | null
  dormitorios: string | null
  suites: string | null
  totalBanheiros: string | null
  vagasGaragem: string | null
  tipoGaragem: string | null
  situacaoImovel: string | null
  dependencia: boolean
  vistaMar: boolean
  tipoVistaMar: string | null
  facilidadesImovel: string | null
  facilidadesImovelOutros: string | null
  facilidadesCond: string | null
  facilidadesCondOutros: string | null
  aceitaPermuta: boolean
  aceitaFinanc: boolean
  documentacaoOk: boolean
  exclusividade: boolean
  publicarSite: boolean
  publicarPortais: boolean
  destaque: boolean
  linkSite: string | null
  linkExterno: string | null
  codIptu: string | null
  codMatricula: string | null
  descricao: string | null
  obsInternas: string | null
  percComissao: number | null
  fotos: string | null
  situacao: string
  unidadeId: string
  dataCadastro: string
  updatedAt: string
}

interface FotoItem { url: string; ordem: number; principal: boolean }

interface FormState {
  codigoRef: string
  nome: string
  finalidade: string
  tipo: string
  subtipo: string
  logradouro: string
  numero: string
  complemento: string
  bairro: string
  cidade: string
  estado: string
  cep: string
  edificio: string
  andar: string
  acesso: string
  proprietario: string
  telProprietario: string
  captador: string
  parceria: boolean
  nomeParceiro: string
  modalidade: string
  valorVenda: string
  valorLocacao: string
  valorCondominio: string
  valorIptu: string
  areaUtil: string
  areaTotal: string
  dormitorios: string
  suites: string
  totalBanheiros: string
  vagasGaragem: string
  tipoGaragem: string
  situacaoImovel: string
  dependencia: boolean
  vistaMar: boolean
  tipoVistaMar: string
  facilidadesImovel: string[]
  facilidadesImovelOutros: string[]
  facilidadesCond: string[]
  facilidadesCondOutros: string[]
  locacaoPacote: boolean
  aceitaPermuta: boolean
  aceitaFinanc: boolean
  documentacaoOk: boolean
  exclusividade: boolean
  publicarSite: boolean
  publicarPortais: boolean
  destaque: boolean
  linkSite: string
  linkExterno: string
  codIptu: string
  codMatricula: string
  descricao: string
  obsInternas: string
  percComissao: string
  situacao: string
}

const FORM_VAZIO: FormState = {
  codigoRef: '', nome: '', finalidade: 'RESIDENCIAL', tipo: 'APARTAMENTO', subtipo: '',
  logradouro: '', numero: '', complemento: '', bairro: '', cidade: '', estado: 'SP', cep: '',
  edificio: '', andar: '', acesso: '', proprietario: '', telProprietario: '',
  captador: '', parceria: false, nomeParceiro: '',
  modalidade: 'VENDA', valorVenda: '', valorLocacao: '', valorCondominio: '', valorIptu: '',
  areaUtil: '', areaTotal: '',
  dormitorios: '', suites: '', totalBanheiros: '', vagasGaragem: '', tipoGaragem: '',
  situacaoImovel: '', dependencia: false, vistaMar: false, tipoVistaMar: '',
  facilidadesImovel: [], facilidadesImovelOutros: [],
  facilidadesCond: [], facilidadesCondOutros: [],
  locacaoPacote: false,
  aceitaPermuta: false, aceitaFinanc: false, documentacaoOk: false, exclusividade: false,
  publicarSite: false, publicarPortais: false, destaque: false,
  linkSite: '', linkExterno: '', codIptu: '', codMatricula: '',
  descricao: '', obsInternas: '', percComissao: '',
  situacao: 'DISPONIVEL',
}

function imovelParaForm(imovel: ImovelCompleto): FormState {
  const parseFacil = (s: string | null): string[] => {
    if (!s) return []
    try { return JSON.parse(s) } catch { return [] }
  }
  const parseFacilOutros = (s: string | null): string[] => {
    if (!s) return []
    try {
      const parsed = JSON.parse(s)
      if (Array.isArray(parsed)) return parsed
      return [s]
    } catch { return [s] }
  }
  return {
    codigoRef: imovel.codigoRef,
    nome: imovel.nome ?? '',
    finalidade: imovel.finalidade,
    tipo: imovel.tipo,
    subtipo: imovel.subtipo ?? '',
    logradouro: imovel.logradouro,
    numero: imovel.numero ?? '',
    complemento: imovel.complemento ?? '',
    bairro: imovel.bairro,
    cidade: imovel.cidade,
    estado: imovel.estado,
    cep: imovel.cep ?? '',
    edificio: imovel.edificio ?? '',
    andar: imovel.andar != null ? String(imovel.andar) : '',
    acesso: imovel.acesso ?? '',
    proprietario: imovel.proprietario ?? '',
    telProprietario: imovel.telProprietario ? formatarTelefone(imovel.telProprietario) : '',
    captador: imovel.captador ?? '',
    parceria: imovel.parceria,
    nomeParceiro: imovel.nomeParceiro ?? '',
    modalidade: imovel.modalidade,
    valorVenda: imovel.valorVenda != null ? String(imovel.valorVenda) : '',
    valorLocacao: imovel.valorLocacao != null ? String(imovel.valorLocacao) : '',
    valorCondominio: imovel.valorCondominio != null ? String(imovel.valorCondominio) : '',
    valorIptu: imovel.valorIptu != null ? String(imovel.valorIptu) : '',
    areaUtil: imovel.areaUtil != null ? String(imovel.areaUtil) : '',
    areaTotal: imovel.areaTotal != null ? String(imovel.areaTotal) : '',
    dormitorios: imovel.dormitorios ?? '',
    suites: imovel.suites ?? '',
    totalBanheiros: imovel.totalBanheiros ?? '',
    vagasGaragem: imovel.vagasGaragem ?? '',
    tipoGaragem: imovel.tipoGaragem ?? '',
    situacaoImovel: imovel.situacaoImovel ?? '',
    dependencia: imovel.dependencia,
    vistaMar: imovel.vistaMar,
    tipoVistaMar: imovel.tipoVistaMar ?? '',
    facilidadesImovel: parseFacil(imovel.facilidadesImovel),
    facilidadesImovelOutros: parseFacilOutros(imovel.facilidadesImovelOutros),
    facilidadesCond: parseFacil(imovel.facilidadesCond),
    facilidadesCondOutros: parseFacilOutros(imovel.facilidadesCondOutros),
    locacaoPacote: imovel.locacaoPacote,
    aceitaPermuta: imovel.aceitaPermuta,
    aceitaFinanc: imovel.aceitaFinanc,
    documentacaoOk: imovel.documentacaoOk,
    exclusividade: imovel.exclusividade,
    publicarSite: imovel.publicarSite,
    publicarPortais: imovel.publicarPortais,
    destaque: imovel.destaque,
    linkSite: imovel.linkSite ?? '',
    linkExterno: imovel.linkExterno ?? '',
    codIptu: imovel.codIptu ?? '',
    codMatricula: imovel.codMatricula ?? '',
    descricao: imovel.descricao ?? '',
    obsInternas: imovel.obsInternas ?? '',
    percComissao: imovel.percComissao != null ? String(imovel.percComissao) : '',
    situacao: imovel.situacao,
  }
}

// ─── Props ────────────────────────────────────────────────────────────────────

interface Props {
  imovelId?: string
  imovelInicial?: ImovelCompleto
  perfil: string
}

// ─── Helpers de UI ────────────────────────────────────────────────────────────

function Label({ children, required }: { children: React.ReactNode; required?: boolean }) {
  return (
    <label className="block text-sm font-medium text-escuro-100 mb-1.5">
      {children}{required && <span className="text-dourado-400 ml-0.5">*</span>}
    </label>
  )
}

function Input(props: React.InputHTMLAttributes<HTMLInputElement>) {
  return <input {...props} className={`input-field ${props.className ?? ''}`} />
}

function Select(props: React.SelectHTMLAttributes<HTMLSelectElement> & { children: React.ReactNode }) {
  const { children, ...rest } = props
  return (
    <select {...rest} className={`input-field ${rest.className ?? ''}`}>
      {children}
    </select>
  )
}

function Textarea(props: React.TextareaHTMLAttributes<HTMLTextAreaElement>) {
  return <textarea {...props} rows={props.rows ?? 4} className={`input-field resize-none ${props.className ?? ''}`} />
}

function Toggle({ checked, onChange, label }: { checked: boolean; onChange: () => void; label: string }) {
  return (
    <button
      type="button"
      onClick={onChange}
      className={`flex items-center gap-2 px-3 py-2 rounded-lg border text-sm transition-colors font-medium
        ${checked
          ? 'bg-dourado-400/15 border-dourado-400/60 text-dourado-400'
          : 'bg-escuro-700 border-escuro-400 text-escuro-200 hover:border-escuro-300'
        }`}
    >
      <span className={`w-4 h-4 rounded border-2 flex items-center justify-center flex-shrink-0 transition-colors ${checked ? 'border-dourado-400 bg-dourado-400' : 'border-escuro-300'}`}>
        {checked && (
          <svg className="w-2.5 h-2.5 text-escuro-700" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={3}>
            <path strokeLinecap="round" strokeLinejoin="round" d="M5 13l4 4L19 7" />
          </svg>
        )}
      </span>
      {label}
    </button>
  )
}

function SecaoTitulo({ children }: { children: React.ReactNode }) {
  return (
    <h3 className="text-base font-semibold text-dourado-400 border-b border-escuro-400 pb-2 mb-4">
      {children}
    </h3>
  )
}

function CampoMonetario({ value, onChange, placeholder }: {
  value: string
  onChange: (v: string) => void
  placeholder?: string
}) {
  const [focado, setFocado] = useState(false)
  const n = parseFloat(value)
  const displayValue = !focado && value && !isNaN(n) ? formatarMoeda(n) : value
  return (
    <Input
      type="text"
      inputMode="numeric"
      value={displayValue}
      placeholder={placeholder ?? 'R$ 0,00'}
      onFocus={() => setFocado(true)}
      onBlur={() => setFocado(false)}
      onChange={e => onChange(e.target.value.replace(/\D/g, ''))}
    />
  )
}

// ─── Componente Principal ─────────────────────────────────────────────────────

export default function ImovelForm({ imovelId, imovelInicial, perfil }: Props) {
  const router = useRouter()
  const modoEdicao = !!imovelId

  const [form, setForm] = useState<FormState>(
    imovelInicial ? imovelParaForm(imovelInicial) : FORM_VAZIO
  )
  const [salvando, setSalvando] = useState(false)
  const [excluindo, setExcluindo] = useState(false)
  const [mensagem, setMensagem] = useState<{ tipo: 'sucesso' | 'erro'; texto: string } | null>(null)
  const [buscandoCep, setBuscandoCep] = useState(false)
  const [cepMensagem, setCepMensagem] = useState<string | null>(null)
  const ultimoCepBuscadoRef = useRef<string>('')

  // ── Derived flags
  const tiposDisponiveis = form.finalidade === 'RESIDENCIAL' ? TIPOS_RESIDENCIAL : TIPOS_COMERCIAL
  const subtiposDisponiveis = SUBTIPOS[form.tipo] ?? []
  const semQuartos = ['TERRENO', 'CHACARA', 'SALA', 'LOJA', 'GALPAO'].includes(form.tipo)
  const semCondominio = ['TERRENO', 'CHACARA', 'CASA', 'CASA_COMERCIAL', 'GALPAO'].includes(form.tipo)
  const mostrarVenda = ['VENDA', 'AMBOS'].includes(form.modalidade)
  const mostrarLocacao = ['LOCACAO', 'AMBOS'].includes(form.modalidade)

  // Quando finalidade muda, resetar tipo para o primeiro disponível
  useEffect(() => {
    const tipos = form.finalidade === 'RESIDENCIAL' ? TIPOS_RESIDENCIAL : TIPOS_COMERCIAL
    const tipoValido = tipos.find(t => t.value === form.tipo)
    if (!tipoValido) {
      setForm(prev => ({ ...prev, tipo: tipos[0].value, subtipo: '' }))
    }
  }, [form.finalidade])

  // Quando tipo muda, resetar subtipo
  useEffect(() => {
    if (!SUBTIPOS[form.tipo]) {
      setForm(prev => ({ ...prev, subtipo: '' }))
    }
  }, [form.tipo])

  function set<K extends keyof FormState>(field: K, value: FormState[K]) {
    setForm(prev => ({ ...prev, [field]: value }))
  }

  function campo(field: keyof FormState) {
    return {
      value: form[field] as string,
      onChange: (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement | HTMLSelectElement>) =>
        set(field, e.target.value as any),
    }
  }

  function toggleParceria() {
    const novoValor = !form.parceria
    setForm(prev => {
      let desc = prev.descricao
      if (novoValor && !desc.includes(SUFFIX_PARCERIA.trim())) {
        desc = desc + SUFFIX_PARCERIA
      } else if (!novoValor) {
        desc = desc.replace(SUFFIX_PARCERIA, '').trimEnd()
      }
      return { ...prev, parceria: novoValor, descricao: desc }
    })
  }

  function toggleFacilidade(lista: 'facilidadesImovel' | 'facilidadesCond', id: string) {
    setForm(prev => {
      const atual = prev[lista] as string[]
      const novaLista = atual.includes(id) ? atual.filter(x => x !== id) : [...atual, id]
      return { ...prev, [lista]: novaLista }
    })
  }

  function formatarCep(valor: string): string {
    const nums = valor.replace(/\D/g, '').slice(0, 8)
    if (nums.length > 5) return `${nums.slice(0, 5)}-${nums.slice(5)}`
    return nums
  }

  async function buscarCep(cepRaw: string) {
    const nums = cepRaw.replace(/\D/g, '')
    if (nums.length !== 8) return
    if (nums === ultimoCepBuscadoRef.current) return

    ultimoCepBuscadoRef.current = nums
    setBuscandoCep(true)
    setCepMensagem(null)

    try {
      const res = await fetch(`https://viacep.com.br/ws/${nums}/json/`)
      if (!res.ok) throw new Error('network')
      const data = await res.json()

      if (data.erro) {
        setCepMensagem('CEP não encontrado')
        return
      }

      setForm(prev => ({
        ...prev,
        logradouro: prev.logradouro.trim() ? prev.logradouro : (data.logradouro ?? prev.logradouro),
        bairro: prev.bairro.trim() ? prev.bairro : (data.bairro ?? prev.bairro),
        cidade: prev.cidade.trim() ? prev.cidade : (data.localidade ?? prev.cidade),
        estado: data.uf ?? prev.estado,
      }))
    } catch {
      setCepMensagem('Erro ao buscar CEP, preencha manualmente')
    } finally {
      setBuscandoCep(false)
    }
  }

  function validar(): string | null {
    if (!form.codigoRef.trim()) return 'Código de referência é obrigatório'
    if (!form.finalidade) return 'Finalidade é obrigatória'
    if (!form.tipo) return 'Tipo é obrigatório'
    if (!form.logradouro.trim()) return 'Logradouro é obrigatório'
    if (!form.bairro.trim()) return 'Bairro é obrigatório'
    if (!form.cidade.trim()) return 'Cidade é obrigatória'
    if (!form.estado.trim()) return 'Estado é obrigatório'
    if (!form.modalidade) return 'Modalidade é obrigatória'
    if (mostrarVenda && !form.valorVenda) return 'Valor de venda é obrigatório para modalidade Venda'
    if (mostrarLocacao && !form.valorLocacao) return 'Valor de locação é obrigatório para modalidade Locação'
    return null
  }

  function montarPayload() {
    const n = (s: string) => s ? parseFloat(s) : undefined
    const ni = (s: string) => s ? parseInt(s) : undefined
    const arr = (a: string[]) => a.length > 0 ? JSON.stringify(a) : undefined

    return {
      codigoRef: form.codigoRef.trim().toUpperCase(),
      nome: form.nome.trim() || undefined,
      finalidade: form.finalidade,
      tipo: form.tipo,
      subtipo: form.subtipo || undefined,
      logradouro: form.logradouro.trim(),
      numero: form.numero.trim() || undefined,
      complemento: form.complemento.trim() || undefined,
      bairro: form.bairro.trim(),
      cidade: form.cidade.trim(),
      estado: form.estado.trim().toUpperCase(),
      cep: form.cep.trim() || undefined,
      edificio: form.edificio.trim() || undefined,
      andar: ni(form.andar),
      acesso: form.acesso || undefined,
      proprietario: form.proprietario.trim() || undefined,
      telProprietario: form.telProprietario.replace(/\D/g, '') || undefined,
      captador: form.captador.trim() || undefined,
      parceria: form.parceria,
      modalidade: form.modalidade,
      valorVenda: mostrarVenda ? n(form.valorVenda) : undefined,
      valorLocacao: mostrarLocacao ? n(form.valorLocacao) : undefined,
      valorCondominio: n(form.valorCondominio),
      valorIptu: n(form.valorIptu),
      areaUtil: n(form.areaUtil),
      areaTotal: n(form.areaTotal),
      dormitorios: semQuartos ? undefined : (form.dormitorios || undefined),
      suites: semQuartos ? undefined : (form.suites || undefined),
      totalBanheiros: semQuartos ? undefined : (form.totalBanheiros || undefined),
      vagasGaragem: form.vagasGaragem || undefined,
      tipoGaragem: form.vagasGaragem === 'SEM_VAGA' ? undefined : (form.tipoGaragem || undefined),
      situacaoImovel: semQuartos ? undefined : (form.situacaoImovel || undefined),
      dependencia: form.dependencia,
      vistaMar: form.vistaMar,
      tipoVistaMar: form.vistaMar ? (form.tipoVistaMar || undefined) : undefined,
      facilidadesImovel: arr(form.facilidadesImovel),
      facilidadesImovelOutros: form.facilidadesImovel.includes('OUTROS')
        ? (form.facilidadesImovelOutros.length > 0 ? JSON.stringify(form.facilidadesImovelOutros) : undefined)
        : undefined,
      facilidadesCond: semCondominio ? undefined : arr(form.facilidadesCond),
      facilidadesCondOutros: (!semCondominio && form.facilidadesCond.includes('OUTROS'))
        ? (form.facilidadesCondOutros.length > 0 ? JSON.stringify(form.facilidadesCondOutros) : undefined)
        : undefined,
      locacaoPacote: form.locacaoPacote,
      aceitaPermuta: form.aceitaPermuta,
      aceitaFinanc: form.aceitaFinanc,
      documentacaoOk: form.documentacaoOk,
      exclusividade: form.exclusividade,
      publicarSite: form.publicarSite,
      publicarPortais: form.publicarPortais,
      destaque: form.destaque,
      linkExterno: form.linkExterno.trim() || undefined,
      codIptu: form.codIptu.trim() || undefined,
      codMatricula: form.codMatricula.trim() || undefined,
      descricao: form.descricao.trim() || undefined,
      obsInternas: form.obsInternas.trim() || undefined,
      percComissao: n(form.percComissao),
      situacao: form.situacao,
    }
  }

  async function salvar() {
    const erroValidacao = validar()
    if (erroValidacao) {
      setMensagem({ tipo: 'erro', texto: erroValidacao })
      window.scrollTo({ top: 0, behavior: 'smooth' })
      return
    }

    setSalvando(true)
    setMensagem(null)

    try {
      const payload = montarPayload()
      const url = modoEdicao ? `/api/imoveis/${imovelId}` : '/api/imoveis'
      const method = modoEdicao ? 'PUT' : 'POST'

      const res = await fetch(url, {
        method,
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload),
      })
      const data = await res.json()

      if (!res.ok) {
        setMensagem({ tipo: 'erro', texto: data.erro ?? 'Erro ao salvar' })
        window.scrollTo({ top: 0, behavior: 'smooth' })
        return
      }

      if (!modoEdicao) {
        router.push(`/imoveis/${data.id}/editar`)
        return
      }

      setMensagem({ tipo: 'sucesso', texto: 'Imóvel atualizado com sucesso!' })
      window.scrollTo({ top: 0, behavior: 'smooth' })
    } catch {
      setMensagem({ tipo: 'erro', texto: 'Erro de conexão. Tente novamente.' })
    } finally {
      setSalvando(false)
    }
  }

  async function excluir() {
    if (!imovelId) return
    if (!confirm(`Excluir permanentemente o imóvel ${form.codigoRef}? Esta ação não pode ser desfeita.`)) return

    setExcluindo(true)
    try {
      const res = await fetch(`/api/imoveis/${imovelId}`, { method: 'DELETE' })
      const data = await res.json()
      if (!res.ok) {
        setMensagem({ tipo: 'erro', texto: data.erro ?? 'Erro ao excluir' })
        return
      }
      router.push('/imoveis')
    } catch {
      setMensagem({ tipo: 'erro', texto: 'Erro de conexão ao excluir.' })
    } finally {
      setExcluindo(false)
    }
  }

  const fotosIniciais: FotoItem[] = imovelInicial?.fotos
    ? (() => { try { return JSON.parse(imovelInicial.fotos) } catch { return [] } })()
    : []

  // ─── Render ───────────────────────────────────────────────────────────────

  return (
    <div className="max-w-4xl mx-auto px-4 py-8">
      {/* Header */}
      <div className="flex items-center justify-between mb-6">
        <div>
          <h1 className="text-2xl font-bold text-white">
            {modoEdicao ? `Editar Imóvel — ${form.codigoRef}` : 'Novo Imóvel'}
          </h1>
          {modoEdicao && imovelInicial && (
            <p className="text-sm text-escuro-300 mt-1">
              Cadastrado em {new Date(imovelInicial.dataCadastro).toLocaleDateString('pt-BR')}
            </p>
          )}
        </div>
        <button onClick={() => router.push('/imoveis')} className="btn-secondary flex items-center gap-2 text-sm">
          <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M10 19l-7-7m0 0l7-7m-7 7h18" />
          </svg>
          Voltar
        </button>
      </div>

      {/* Mensagem */}
      {mensagem && (
        <div className={`mb-6 px-4 py-3 rounded-xl border text-sm font-medium flex items-center gap-3
          ${mensagem.tipo === 'sucesso'
            ? 'bg-green-900/30 border-green-700/50 text-green-300'
            : 'bg-red-900/30 border-red-700/50 text-red-300'
          }`}>
          {mensagem.tipo === 'sucesso' ? (
            <svg className="w-5 h-5 flex-shrink-0" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
            </svg>
          ) : (
            <svg className="w-5 h-5 flex-shrink-0" fill="currentColor" viewBox="0 0 20 20">
              <path fillRule="evenodd" d="M18 10a8 8 0 11-16 0 8 8 0 0116 0zm-7 4a1 1 0 11-2 0 1 1 0 012 0zm-1-9a1 1 0 00-1 1v4a1 1 0 102 0V6a1 1 0 00-1-1z" clipRule="evenodd" />
            </svg>
          )}
          {mensagem.texto}
        </div>
      )}

      {/* ─── Seção 1: Dados Comerciais ─────────────────────────────────────── */}
      <div className="card mb-6">
        <SecaoTitulo>1. Dados Comerciais</SecaoTitulo>

        <div className="grid grid-cols-2 gap-4 mb-4">
          <div>
            <Label required>Código de Referência</Label>
            <Input {...campo('codigoRef')} placeholder="AP17597" className="uppercase" />
          </div>
          <div>
            <Label>Nome do Imóvel</Label>
            <Input {...campo('nome')} placeholder="Ex: SAMBURA" />
          </div>
        </div>

        <div className="grid grid-cols-3 gap-4 mb-4">
          <div>
            <Label required>Finalidade</Label>
            <Select value={form.finalidade} onChange={e => set('finalidade', e.target.value)}>
              <option value="RESIDENCIAL">Residencial</option>
              <option value="COMERCIAL">Comercial</option>
            </Select>
          </div>
          <div>
            <Label required>Tipo</Label>
            <Select value={form.tipo} onChange={e => set('tipo', e.target.value)}>
              {tiposDisponiveis.map(t => <option key={t.value} value={t.value}>{t.label}</option>)}
            </Select>
          </div>
          <div>
            <Label>Subtipo</Label>
            <Select value={form.subtipo} onChange={e => set('subtipo', e.target.value)} disabled={subtiposDisponiveis.length === 0}>
              <option value="">— Selecione —</option>
              {subtiposDisponiveis.map(s => <option key={s.value} value={s.value}>{s.label}</option>)}
            </Select>
          </div>
        </div>

        {/* Endereço */}
        <div className="grid grid-cols-4 gap-4 mb-4">
          <div>
            <Label>CEP</Label>
            <div className="relative">
              <Input
                value={form.cep}
                onChange={e => {
                  const formatted = formatarCep(e.target.value)
                  set('cep', formatted)
                  setCepMensagem(null)
                  ultimoCepBuscadoRef.current = ''
                  if (formatted.replace(/\D/g, '').length === 8) buscarCep(formatted)
                }}
                onBlur={() => buscarCep(form.cep)}
                placeholder="00000-000"
                maxLength={9}
              />
              {buscandoCep && (
                <div className="absolute right-3 top-1/2 -translate-y-1/2 pointer-events-none">
                  <svg className="w-4 h-4 animate-spin text-dourado-400" fill="none" viewBox="0 0 24 24">
                    <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
                    <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4z" />
                  </svg>
                </div>
              )}
            </div>
            {cepMensagem && (
              <p className="text-xs mt-1 text-red-400">{cepMensagem}</p>
            )}
          </div>
          <div className="col-span-2">
            <Label required>Logradouro</Label>
            <Input {...campo('logradouro')} placeholder="Rua, Av., Al., etc." />
          </div>
          <div>
            <Label>Número</Label>
            <Input {...campo('numero')} placeholder="123" />
          </div>
        </div>

        <div className="grid grid-cols-2 gap-4 mb-4">
          <div>
            <Label>Complemento</Label>
            <Input {...campo('complemento')} placeholder="Apto 12" />
          </div>
          <div>
            <Label required>Bairro</Label>
            <Input {...campo('bairro')} placeholder="Centro" />
          </div>
        </div>

        <div className="grid grid-cols-3 gap-4 mb-4">
          <div>
            <Label required>Cidade</Label>
            <Input {...campo('cidade')} placeholder="São Paulo" />
          </div>
          <div>
            <Label required>Estado</Label>
            <Input {...campo('estado')} placeholder="SP" maxLength={2} className="uppercase" />
          </div>
          <div>
            <Label>Edifício / Condomínio</Label>
            <Input {...campo('edificio')} placeholder="Nome do edifício" />
          </div>
        </div>

        <div className="grid grid-cols-2 gap-4 mb-4">
          <div>
            <Label>Proprietário</Label>
            <Input {...campo('proprietario')} placeholder="Nome completo" />
          </div>
          <div>
            <Label>Contato do Proprietário</Label>
            <Input
              value={form.telProprietario}
              onChange={e => set('telProprietario', formatarTelefone(e.target.value))}
              placeholder="(11) 99999-9999"
              maxLength={15}
            />
          </div>
        </div>

        <div className="mb-4">
          <Label>Captador</Label>
          <Input {...campo('captador')} placeholder="Nome do corretor / parceiro / Biocasa" />
        </div>

        <div className="flex flex-wrap items-center gap-4 mb-4">
          <Toggle checked={form.parceria} onChange={toggleParceria} label="Parceria Imobiliária" />
        </div>

        {/* Modalidade e Valores */}
        <div className="border-t border-escuro-400 pt-4 mt-4">
          <div className="mb-4">
            <Label required>Modalidade</Label>
            <div className="flex gap-3">
              {[
                { v: 'VENDA', l: 'Venda' },
                { v: 'LOCACAO', l: 'Locação' },
                { v: 'AMBOS', l: 'Venda + Locação' },
              ].map(op => (
                <button
                  key={op.v}
                  type="button"
                  onClick={() => set('modalidade', op.v)}
                  className={`px-4 py-2 rounded-lg border text-sm font-medium transition-colors
                    ${form.modalidade === op.v
                      ? 'bg-dourado-400/15 border-dourado-400 text-dourado-400'
                      : 'bg-escuro-700 border-escuro-400 text-escuro-200 hover:border-escuro-300'
                    }`}
                >
                  {op.l}
                </button>
              ))}
            </div>
          </div>

          <div className="grid grid-cols-2 gap-4 mb-3">
            {mostrarVenda && (
              <div>
                <Label required>Valor de Venda (R$)</Label>
                <CampoMonetario value={form.valorVenda} onChange={v => set('valorVenda', v)} />
              </div>
            )}
            {mostrarLocacao && (
              <div>
                <Label required>Valor de Locação (R$/mês)</Label>
                <CampoMonetario value={form.valorLocacao} onChange={v => set('valorLocacao', v)} />
              </div>
            )}
          </div>

          {mostrarLocacao && (
            <div className="mb-3">
              <Toggle
                checked={form.locacaoPacote}
                onChange={() => set('locacaoPacote', !form.locacaoPacote)}
                label="É pacote? (aluguel já inclui condomínio e IPTU)"
              />
            </div>
          )}

          {!(mostrarLocacao && form.locacaoPacote) && (
            <div className="grid grid-cols-2 gap-4 mb-4">
              <div>
                <Label>Condomínio (R$/mês)</Label>
                <CampoMonetario value={form.valorCondominio} onChange={v => set('valorCondominio', v)} />
              </div>
              <div>
                <Label>IPTU Mensal (R$)</Label>
                <CampoMonetario value={form.valorIptu} onChange={v => set('valorIptu', v)} />
              </div>
            </div>
          )}

          <div className="grid grid-cols-2 gap-4 mb-4">
            <div>
              <Label>Área Útil (m²)</Label>
              <Input {...campo('areaUtil')} type="number" min="0" step="0.01" placeholder="80" />
            </div>
            <div>
              <Label>Área Total (m²)</Label>
              <Input {...campo('areaTotal')} type="number" min="0" step="0.01" placeholder="100" />
            </div>
          </div>
        </div>

        <div className="flex flex-wrap gap-3 mt-2">
          <Toggle checked={form.aceitaPermuta} onChange={() => set('aceitaPermuta', !form.aceitaPermuta)} label="Aceita Permuta" />
          <Toggle checked={form.documentacaoOk} onChange={() => set('documentacaoOk', !form.documentacaoOk)} label="Documentação OK" />
          <Toggle checked={form.aceitaFinanc} onChange={() => set('aceitaFinanc', !form.aceitaFinanc)} label="Aceita Financiamento" />
        </div>
      </div>

      {/* ─── Seção 2: Dados do Imóvel ──────────────────────────────────────── */}
      <div className="card mb-6">
        <SecaoTitulo>2. Dados do Imóvel</SecaoTitulo>

        {!semQuartos && (
          <div className="grid grid-cols-2 gap-4 mb-4">
            <div>
              <Label>Dormitórios</Label>
              <Select {...campo('dormitorios')}>
                <option value="">— Selecione —</option>
                <option value="KIT_STUDIO">Kit/Studio</option>
                <option value="1">1</option>
                <option value="2">2</option>
                <option value="3">3</option>
                <option value="4_MAIS">4+</option>
              </Select>
            </div>
            <div>
              <Label>Suítes</Label>
              <Select {...campo('suites')}>
                <option value="">— Selecione —</option>
                <option value="NAO_TEM">Não tem</option>
                <option value="1">1</option>
                <option value="2">2</option>
                <option value="3_MAIS">3+</option>
              </Select>
            </div>
          </div>
        )}

        <div className="grid grid-cols-2 gap-4 mb-4">
          {!semQuartos && (
            <div>
              <Label>Total de Banheiros</Label>
              <Select {...campo('totalBanheiros')}>
                <option value="">— Selecione —</option>
                <option value="1">1</option>
                <option value="2">2</option>
                <option value="3_MAIS">3+</option>
              </Select>
            </div>
          )}
          {!semQuartos && (
            <div>
              <Label>Situação do Imóvel</Label>
              <Select {...campo('situacaoImovel')}>
                <option value="">— Selecione —</option>
                <option value="MOBILIADO">Mobiliado</option>
                <option value="SEMI_MOBILIADO">Semi-Mobiliado</option>
                <option value="VAZIO">Vazio</option>
              </Select>
            </div>
          )}
        </div>

        <div className="grid grid-cols-2 gap-4 mb-4">
          <div>
            <Label>Vagas de Garagem</Label>
            <Select {...campo('vagasGaragem')}>
              <option value="">— Selecione —</option>
              <option value="SEM_VAGA">Sem Vaga</option>
              <option value="1">1</option>
              <option value="2">2</option>
              <option value="3_MAIS">3+</option>
              <option value="MOTOS">Motos</option>
            </Select>
          </div>
          <div>
            <Label>Tipo de Garagem</Label>
            <Select
              {...campo('tipoGaragem')}
              disabled={form.vagasGaragem === 'SEM_VAGA' || !form.vagasGaragem}
            >
              <option value="">— Selecione —</option>
              <option value="FECHADA">Fechada</option>
              <option value="DEMARCADA">Demarcada</option>
              <option value="COLETIVA_SUF">Coletiva Suficiente</option>
              <option value="COLETIVA_INSUF">Coletiva Insuficiente</option>
            </Select>
          </div>
        </div>

        <div className="flex flex-wrap gap-3 mb-4">
          <Toggle checked={form.dependencia} onChange={() => set('dependencia', !form.dependencia)} label="Dependência" />
          <Toggle checked={form.vistaMar} onChange={() => set('vistaMar', !form.vistaMar)} label="Vista Mar" />
          {form.vistaMar && (
            <Select value={form.tipoVistaMar} onChange={e => set('tipoVistaMar', e.target.value)} className="w-40">
              <option value="">— Tipo —</option>
              <option value="FRENTE">Frente</option>
              <option value="LATERAL">Lateral</option>
            </Select>
          )}
        </div>

        <div className="mb-4">
          <Label>Facilidades do Imóvel</Label>
          <div className="flex flex-wrap gap-2">
            {FACILIDADES_IMOVEL.map(f => (
              <button
                key={f.id}
                type="button"
                onClick={() => toggleFacilidade('facilidadesImovel', f.id)}
                className={`px-3 py-1.5 rounded-lg border text-sm transition-colors
                  ${form.facilidadesImovel.includes(f.id)
                    ? 'bg-dourado-400/15 border-dourado-400/60 text-dourado-400'
                    : 'bg-escuro-700 border-escuro-400 text-escuro-200 hover:border-escuro-300'
                  }`}
              >
                {f.label}
              </button>
            ))}
          </div>
          {form.facilidadesImovel.includes('OUTROS') && (
            <div className="mt-2">
              <TagInput
                tags={form.facilidadesImovelOutros}
                onChange={v => set('facilidadesImovelOutros', v)}
                placeholder="Digite e pressione vírgula para adicionar..."
              />
            </div>
          )}
        </div>

        <div>
          <Label>Descrição do Imóvel</Label>
          <Textarea {...campo('descricao')} rows={5} placeholder="Descreva o imóvel para publicação..." />
        </div>
      </div>

      {/* ─── Seção 3: Dados do Condomínio ──────────────────────────────────── */}
      {!semCondominio && (
        <div className="card mb-6">
          <SecaoTitulo>3. Dados do Condomínio</SecaoTitulo>

          <div className="grid grid-cols-2 gap-4 mb-4">
            <div>
              <Label>Acesso</Label>
              <Select {...campo('acesso')}>
                <option value="">— Selecione —</option>
                <option value="ESCADAS">Escadas</option>
                <option value="ELEVADOR">Elevador</option>
              </Select>
            </div>
            <div>
              <Label>Andar</Label>
              <Input {...campo('andar')} type="number" min="0" placeholder="3" />
            </div>
          </div>

          <div>
            <Label>Facilidades do Condomínio</Label>
            <div className="flex flex-wrap gap-2">
              {FACILIDADES_COND.map(f => (
                <button
                  key={f.id}
                  type="button"
                  onClick={() => toggleFacilidade('facilidadesCond', f.id)}
                  className={`px-3 py-1.5 rounded-lg border text-sm transition-colors
                    ${form.facilidadesCond.includes(f.id)
                      ? 'bg-dourado-400/15 border-dourado-400/60 text-dourado-400'
                      : 'bg-escuro-700 border-escuro-400 text-escuro-200 hover:border-escuro-300'
                    }`}
                >
                  {f.label}
                </button>
              ))}
            </div>
            {form.facilidadesCond.includes('OUTROS') && (
              <div className="mt-2">
                <TagInput
                  tags={form.facilidadesCondOutros}
                  onChange={v => set('facilidadesCondOutros', v)}
                  placeholder="Digite e pressione vírgula para adicionar..."
                />
              </div>
            )}
          </div>
        </div>
      )}

      {/* ─── Seção 4: Dados Administrativos ────────────────────────────────── */}
      <div className="card mb-6">
        <SecaoTitulo>4. Dados Administrativos</SecaoTitulo>

        <div className="grid grid-cols-2 gap-4 mb-4">
          <div className="flex items-center gap-4">
            <Toggle checked={form.exclusividade} onChange={() => set('exclusividade', !form.exclusividade)} label="Exclusividade" />
          </div>
          <div>
            <Label>Comissão (%)</Label>
            <Input {...campo('percComissao')} type="number" min="0" max="100" step="0.1" placeholder="6" />
          </div>
        </div>

        <div className="grid grid-cols-2 gap-4 mb-4">
          <div>
            <Label>Cód. IPTU</Label>
            <Input {...campo('codIptu')} placeholder="123456789" />
          </div>
          <div>
            <Label>Cód. Matrícula</Label>
            <Input {...campo('codMatricula')} placeholder="00001234" />
          </div>
        </div>

        <div className="mb-4">
          <Label>Publicações</Label>
          <div className="flex flex-wrap gap-3">
            <Toggle checked={form.publicarSite} onChange={() => set('publicarSite', !form.publicarSite)} label="Publicar no Site" />
            <Toggle checked={form.publicarPortais} onChange={() => set('publicarPortais', !form.publicarPortais)} label="Publicar nos Portais" />
            <Toggle checked={form.destaque} onChange={() => set('destaque', !form.destaque)} label="Destaque" />
          </div>
        </div>

        <div className="grid grid-cols-2 gap-4 mb-4">
          <div>
            <Label>Link Externo (Kenlo / portal)</Label>
            <Input {...campo('linkExterno')} placeholder="https://..." type="url" />
          </div>
          <div>
            <Label>Link do Site</Label>
            <Input
              value={modoEdicao ? (form.linkSite || `/imovel/${form.codigoRef.toLowerCase()}`) : `/imovel/${form.codigoRef.toLowerCase()}`}
              readOnly
              className="opacity-60 cursor-default"
            />
          </div>
        </div>

        <div className="mb-4">
          <Label required>Situação</Label>
          <Select {...campo('situacao')}>
            <option value="DISPONIVEL">Disponível</option>
            <option value="VENDIDO">Vendido</option>
            <option value="ALUGADO">Alugado</option>
          </Select>
        </div>

        <div>
          <Label>Observações Internas (não publicar)</Label>
          <Textarea {...campo('obsInternas')} rows={3} placeholder="Anotações para uso interno..." />
        </div>

        {modoEdicao && imovelInicial && (
          <p className="mt-3 text-xs text-escuro-300">
            Cadastrado em {new Date(imovelInicial.dataCadastro).toLocaleDateString('pt-BR', { day: '2-digit', month: '2-digit', year: 'numeric', hour: '2-digit', minute: '2-digit' })}
            {' · '}Atualizado em {new Date(imovelInicial.updatedAt).toLocaleDateString('pt-BR', { day: '2-digit', month: '2-digit', year: 'numeric', hour: '2-digit', minute: '2-digit' })}
          </p>
        )}
      </div>

      {/* ─── Seção 5: Fotos (apenas modo edição) ───────────────────────────── */}
      {modoEdicao && imovelId ? (
        <div className="card mb-6">
          <SecaoTitulo>5. Fotos</SecaoTitulo>
          <p className="text-sm text-escuro-300">
            {fotosIniciais.length} foto{fotosIniciais.length !== 1 ? 's' : ''} cadastrada{fotosIniciais.length !== 1 ? 's' : ''}.
            {' '}Use o botão "Gerenciar Fotos" abaixo para adicionar, remover ou reordenar.
          </p>
        </div>
      ) : !modoEdicao && (
        <div className="card mb-6 opacity-60">
          <SecaoTitulo>5. Fotos</SecaoTitulo>
          <p className="text-sm text-escuro-200">
            O upload de fotos estará disponível após salvar o imóvel.
          </p>
        </div>
      )}

      {/* ─── Botões de ação ─────────────────────────────────────────────────── */}
      <div className="flex items-center justify-between gap-4 flex-wrap">
        <div className="flex flex-wrap gap-2">
          {perfil === 'MASTER' && modoEdicao && (
            <button
              onClick={excluir}
              disabled={excluindo}
              className="btn-danger flex items-center gap-2 text-sm"
            >
              <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
              </svg>
              {excluindo ? 'Excluindo...' : 'Excluir Imóvel'}
            </button>
          )}
          {modoEdicao && imovelId && (
            <>
              {fotosIniciais.length > 0 && (
                <a
                  href={`/api/imoveis/${imovelId}/fotos/zip`}
                  download
                  className="btn-secondary flex items-center gap-2 text-sm"
                >
                  <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 16v1a3 3 0 003 3h10a3 3 0 003-3v-1m-4-4l-4 4m0 0l-4-4m4 4V4" />
                  </svg>
                  Baixar Fotos
                </a>
              )}
              <GerenciarFotosModal imovelId={imovelId} fotosIniciais={fotosIniciais} />
            </>
          )}
        </div>
        <div className="flex gap-3">
          <button onClick={() => router.push('/imoveis')} className="btn-secondary text-sm">
            Cancelar
          </button>
          <button
            onClick={salvar}
            disabled={salvando}
            className="btn-primary flex items-center gap-2 text-sm min-w-32 justify-center"
          >
            {salvando ? (
              <>
                <svg className="w-4 h-4 animate-spin" fill="none" viewBox="0 0 24 24">
                  <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
                  <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4z" />
                </svg>
                Salvando...
              </>
            ) : (
              <>
                <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                </svg>
                {modoEdicao ? 'Salvar Alterações' : 'Cadastrar Imóvel'}
              </>
            )}
          </button>
        </div>
      </div>
    </div>
  )
}
