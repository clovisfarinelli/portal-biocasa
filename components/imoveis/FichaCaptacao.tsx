'use client'

export interface DadosImovelFicha {
  codigoRef?: string | null
  nome?: string | null
  finalidade?: string | null
  tipo?: string | null
  subtipo?: string | null
  cep?: string | null
  logradouro?: string | null
  numero?: string | null
  complemento?: string | null
  bairro?: string | null
  cidade?: string | null
  estado?: string | null
  edificio?: string | null
  proprietario?: string | null
  telProprietario?: string | null
  captador?: string | null
  parceria?: boolean | null
  modalidade?: string | null
  valorVenda?: number | null
  valorLocacao?: number | null
  valorCondominio?: number | null
  valorIptu?: number | null
  areaUtil?: number | null
  areaTotal?: number | null
  aceitaPermuta?: boolean | null
  documentacaoOk?: boolean | null
  aceitaFinanc?: boolean | null
  dormitorios?: string | null
  suites?: string | null
  totalBanheiros?: string | null
  situacaoImovel?: string | null
  vagasGaragem?: string | null
  tipoGaragem?: string | null
  dependencia?: boolean | null
  vistaMar?: boolean | null
  tipoVistaMar?: string | null
  facilidadesImovel?: string | null
  facilidadesImovelOutros?: string | null
  facilidadesCond?: string | null
  facilidadesCondOutros?: string | null
  descricao?: string | null
  acesso?: string | null
  andar?: number | null
  unidadeNome?: string | null
}

// ─── Constantes de labels ────────────────────────────────────────────────────

const SUBTIPO_LABEL: Record<string, string> = {
  ISOLADA: 'Isolada', SOBRADO: 'Sobrado', SOBREPOSTA_ALTA: 'Sob. Alta',
  SOBREPOSTA_BAIXA: 'Sob. Baixa', VILLAGGIO: 'Villaggio',
  KITNET_STUDIO: 'Kitnet/Studio', PADRAO: 'Padrão', TERREO: 'Térreo',
}
const DORMI_LABEL: Record<string, string> = {
  KIT_STUDIO: 'Kit/Studio', '1': '1', '2': '2', '3': '3', '4_MAIS': '4+',
}
const SUITES_LABEL: Record<string, string> = {
  NAO_TEM: '0', '1': '1', '2': '2', '3_MAIS': '3+',
}
const VAGAS_LABEL: Record<string, string> = {
  SEM_VAGA: '0', '1': '1', '2': '2', '3_MAIS': '3+', MOTOS: 'Motos',
}
const GARAGEM_LABEL: Record<string, string> = {
  FECHADA: 'Box Fechado', DEMARCADA: 'Descoberta',
  COLETIVA_SUF: 'Coberta', COLETIVA_INSUF: 'Rotativa',
}

function fmt(v: number | null | undefined) {
  if (!v) return ''
  return v.toLocaleString('pt-BR', { style: 'currency', currency: 'BRL' })
}

// ─── Estilos base (todos inline para garantir impressão correta) ─────────────

const S = {
  label: {
    fontSize: '7.5pt',
    fontWeight: 'bold' as const,
    whiteSpace: 'nowrap' as const,
    flexShrink: 0,
    color: '#000',
    background: 'transparent',
  },
  campo: {
    flex: 1,
    borderBottom: '1px solid #333',
    minWidth: 18,
    paddingLeft: 2,
    display: 'inline-block' as const,
    minHeight: 11,
    fontSize: '8pt',
    color: '#000',
    background: 'transparent',
    verticalAlign: 'baseline' as const,
  },
  campoFixo: (w: number | string) => ({
    display: 'inline-block' as const,
    borderBottom: '1px solid #333',
    width: w,
    minHeight: 11,
    padding: '0 2px',
    fontSize: '8pt',
    color: '#000',
    background: 'transparent',
    verticalAlign: 'baseline' as const,
  }),
  row: {
    display: 'flex' as const,
    alignItems: 'baseline' as const,
    gap: 6,
    marginBottom: 3,
  },
  cbWrap: {
    display: 'inline-flex' as const,
    alignItems: 'center' as const,
    gap: 2,
    marginRight: 5,
    fontSize: '7.5pt',
    whiteSpace: 'nowrap' as const,
    color: '#000',
    background: 'transparent',
  },
}

// ─── Componentes helper ──────────────────────────────────────────────────────

function Cb({ m, label }: { m?: boolean | null; label: string }) {
  return (
    <span style={S.cbWrap}>
      <span style={{
        display: 'inline-block', width: 9, height: 9,
        border: '1px solid #000', textAlign: 'center', lineHeight: '9px',
        fontSize: '7pt', flexShrink: 0,
        background: m ? '#000' : 'white',
        color: m ? 'white' : 'transparent',
        fontFamily: 'Arial, sans-serif',
      }}>
        {m ? '✓' : ''}
      </span>
      {label}
    </span>
  )
}

function Row({ children, mb = 3 }: { children: React.ReactNode; mb?: number }) {
  return <div style={{ ...S.row, marginBottom: mb }}>{children}</div>
}

function CbRow({ label, children, mb = 3 }: { label?: string; children: React.ReactNode; mb?: number }) {
  return (
    <div style={{ display: 'flex', flexWrap: 'wrap', alignItems: 'center', gap: '1px 0', marginBottom: mb }}>
      {label && <span style={{ ...S.label, marginRight: 4 }}>{label}</span>}
      {children}
    </div>
  )
}

function SecTitle({ n, title }: { n: number; title: string }) {
  return (
    <div className="ficha-secao-titulo" style={{
      fontSize: '7pt', fontWeight: 'bold', textTransform: 'uppercase',
      background: '#eee', color: '#000', padding: '1px 4px',
      marginBottom: 3, letterSpacing: 0.3,
    }}>
      {n}. {title}
    </div>
  )
}

function Sec({ children }: { children: React.ReactNode }) {
  return (
    <div style={{
      border: '1px solid #bbb', padding: '3px 6px', marginBottom: 3,
      background: 'white',
    }}>
      {children}
    </div>
  )
}

function FacilGrid({ items, selected }: { items: { id: string; label: string }[]; selected: string[] }) {
  return (
    <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr 1fr', gap: '0 1px', marginBottom: 1 }}>
      {items.map(item => (
        <Cb key={item.id} m={selected.includes(item.id)} label={item.label} />
      ))}
    </div>
  )
}

// ─── Ficha unitária (A5 — meia folha A4) ─────────────────────────────────────

function FichaUnica({ dados }: { dados?: DadosImovelFicha }) {
  const d = dados ?? {}
  const td = !!dados
  const data = new Date().toLocaleDateString('pt-BR')

  const facilImovel: string[] = (() => {
    try { return d.facilidadesImovel ? JSON.parse(d.facilidadesImovel) : [] } catch { return [] }
  })()
  const facilCond: string[] = (() => {
    try { return d.facilidadesCond ? JSON.parse(d.facilidadesCond) : [] } catch { return [] }
  })()

  return (
    <div style={{
      fontFamily: 'Arial, Helvetica, sans-serif',
      fontSize: '8pt',
      lineHeight: '1.5',
      color: '#000',
      background: '#fff',
      width: '100%',
      padding: '1mm 5mm 1mm',
      boxSizing: 'border-box',
    }}>
      {/* ── Cabeçalho (1 linha) ── */}
      <div style={{
        display: 'flex', alignItems: 'center', justifyContent: 'space-between',
        borderBottom: '2px solid #000', paddingBottom: 2, marginBottom: 3,
        background: 'white',
      }}>
        <span style={{ fontWeight: 'bold', fontSize: '10pt', letterSpacing: 1, color: '#000' }}>BIOCASA</span>
        <span style={{ fontWeight: 'bold', fontSize: '8.5pt', textTransform: 'uppercase', letterSpacing: 0.5, color: '#000' }}>
          Ficha de Captação de Imóvel
        </span>
        <span style={{ fontSize: '7pt', color: '#444', background: 'white' }}>
          {d.unidadeNome ? `${d.unidadeNome} · ` : ''}
          {td ? `Santos, ${data}` : 'Santos, ____/____/______'}
        </span>
      </div>

      {/* ── Seção 1: Dados Comerciais ── */}
      <Sec>
        <SecTitle n={1} title="Dados Comerciais" />

        {/* Código + Nome */}
        <Row>
          <span style={{ display: 'flex', alignItems: 'baseline', gap: 3, flex: '0 0 35%' }}>
            <span style={S.label}>Cód.Ref.:</span>
            <span style={S.campo}>{d.codigoRef ?? ''}</span>
          </span>
          <span style={{ display: 'flex', alignItems: 'baseline', gap: 3, flex: 1 }}>
            <span style={S.label}>Nome:</span>
            <span style={S.campo}>{d.nome ?? ''}</span>
          </span>
        </Row>

        {/* Finalidade */}
        <CbRow label="Finalidade:">
          <Cb m={td ? d.finalidade === 'RESIDENCIAL' : false} label="Residencial" />
          <Cb m={td ? d.finalidade === 'COMERCIAL' : false} label="Comercial" />
          <Cb m={td ? d.finalidade === 'RURAL' : false} label="Rural" />
        </CbRow>

        {/* Tipo + Subtipo — mesma linha */}
        <div style={{ display: 'flex', flexWrap: 'wrap', alignItems: 'center', gap: '1px 0', marginBottom: 5 }}>
          <span style={{ ...S.label, marginRight: 4 }}>Tipo:</span>
          <Cb m={td ? d.tipo === 'APARTAMENTO' : false} label="Apto" />
          <Cb m={td ? d.tipo === 'CASA' : false} label="Casa" />
          <Cb m={td ? d.tipo === 'TERRENO' : false} label="Terreno" />
          <Cb m={td ? (d.tipo === 'APARTAMENTO' && d.subtipo === 'KITNET_STUDIO') : false} label="Kitnet" />
          <Cb m={false} label="Cobertura" />
          <Cb m={false} label="Village" />
          <Cb m={td ? d.tipo === 'LOJA' : false} label="Loja" />
          <Cb m={false} label="Garagem" />
          <Cb m={td ? d.tipo === 'CHACARA' : false} label="Chácara" />
          <span style={{ display: 'inline-flex', alignItems: 'baseline', gap: 3, marginLeft: 6 }}>
            <span style={S.label}>Subtipo:</span>
            <span style={{ ...S.campo, minWidth: 55 }}>{td && d.subtipo ? (SUBTIPO_LABEL[d.subtipo] ?? d.subtipo) : ''}</span>
          </span>
        </div>

        {/* CEP + Logradouro + Nº */}
        <Row>
          <span style={{ display: 'flex', alignItems: 'baseline', gap: 3, flex: '0 0 28%' }}>
            <span style={S.label}>CEP:</span>
            <span style={S.campo}>{d.cep ?? ''}</span>
          </span>
          <span style={{ display: 'flex', alignItems: 'baseline', gap: 3, flex: '0 0 51%' }}>
            <span style={S.label}>Logradouro:</span>
            <span style={S.campo}>{d.logradouro ?? ''}</span>
          </span>
          <span style={{ display: 'flex', alignItems: 'baseline', gap: 3, flex: 1 }}>
            <span style={S.label}>Nº:</span>
            <span style={S.campo}>{d.numero ?? ''}</span>
          </span>
        </Row>

        {/* Complemento + Bairro + Estado */}
        <Row>
          <span style={{ display: 'flex', alignItems: 'baseline', gap: 3, flex: '0 0 38%' }}>
            <span style={S.label}>Complemento:</span>
            <span style={S.campo}>{d.complemento ?? ''}</span>
          </span>
          <span style={{ display: 'flex', alignItems: 'baseline', gap: 3, flex: '0 0 37%' }}>
            <span style={S.label}>Bairro:</span>
            <span style={S.campo}>{d.bairro ?? ''}</span>
          </span>
          <span style={{ display: 'flex', alignItems: 'baseline', gap: 3, flex: 1 }}>
            <span style={S.label}>UF:</span>
            <span style={S.campo}>{d.estado ?? ''}</span>
          </span>
        </Row>

        {/* Cidade + Edifício */}
        <Row>
          <span style={{ display: 'flex', alignItems: 'baseline', gap: 3, flex: '0 0 50%' }}>
            <span style={S.label}>Cidade:</span>
            <span style={S.campo}>{d.cidade ?? ''}</span>
          </span>
          <span style={{ display: 'flex', alignItems: 'baseline', gap: 3, flex: 1 }}>
            <span style={S.label}>Edifício/Cond.:</span>
            <span style={S.campo}>{d.edificio ?? ''}</span>
          </span>
        </Row>

        {/* Proprietário + Contato */}
        <Row>
          <span style={{ display: 'flex', alignItems: 'baseline', gap: 3, flex: '0 0 58%' }}>
            <span style={S.label}>Proprietário:</span>
            <span style={S.campo}>{d.proprietario ?? ''}</span>
          </span>
          <span style={{ display: 'flex', alignItems: 'baseline', gap: 3, flex: 1 }}>
            <span style={S.label}>Contato:</span>
            <span style={S.campo}>{d.telProprietario ?? ''}</span>
          </span>
        </Row>

        {/* Captador (solo) */}
        <Row>
          <span style={S.label}>Captador:</span>
          <span style={S.campo}>{d.captador ?? ''}</span>
        </Row>

        {/* Parceria + Modalidade (mesma linha, sem V+L) */}
        <CbRow mb={2}>
          <Cb m={d.parceria} label="Parceria Imobiliária" />
          <span style={{ ...S.label, marginLeft: 8, marginRight: 3 }}>Modalidade:</span>
          <Cb m={td ? d.modalidade === 'VENDA' : false} label="Venda" />
          <Cb m={td ? (d.modalidade === 'LOCACAO' || d.modalidade === 'AMBOS') : false} label="Locação" />
        </CbRow>

        {/* Valor Venda/Locação (campo único) */}
        <Row>
          <span style={S.label}>Valor Venda/Locação R$:</span>
          <span style={S.campo}>{td ? (fmt(d.valorVenda) || fmt(d.valorLocacao)) : ''}</span>
        </Row>

        {/* Cond + IPTU + Área Útil + Área Total (mesma linha) */}
        <Row>
          <span style={{ display: 'inline-flex', alignItems: 'baseline', gap: 3 }}>
            <span style={S.label}>Cond. R$:</span>
            <span style={S.campoFixo(42)}>{td ? fmt(d.valorCondominio) : ''}</span>
          </span>
          <span style={{ display: 'inline-flex', alignItems: 'baseline', gap: 3, marginLeft: 4 }}>
            <span style={S.label}>IPTU R$:</span>
            <span style={S.campoFixo(42)}>{td ? fmt(d.valorIptu) : ''}</span>
          </span>
          <span style={{ display: 'inline-flex', alignItems: 'baseline', gap: 3, marginLeft: 4 }}>
            <span style={S.label}>Área Útil m²:</span>
            <span style={S.campoFixo(28)}>{td && d.areaUtil ? String(d.areaUtil) : ''}</span>
          </span>
          <span style={{ display: 'inline-flex', alignItems: 'baseline', gap: 3, marginLeft: 4 }}>
            <span style={S.label}>Área Total m²:</span>
            <span style={S.campoFixo(28)}>{td && d.areaTotal ? String(d.areaTotal) : ''}</span>
          </span>
        </Row>

        {/* Permuta + Doc + Financiamento */}
        <CbRow mb={0}>
          <Cb m={d.aceitaPermuta} label="Aceita Permuta" />
          <Cb m={d.documentacaoOk} label="Documentação OK" />
          <Cb m={d.aceitaFinanc} label="Aceita Financiamento" />
        </CbRow>
      </Sec>

      {/* ── Seção 2: Dados do Imóvel ── */}
      <Sec>
        <SecTitle n={2} title="Dados do Imóvel" />

        {/* 2 colunas: esquerda 60% | direita 40% */}
        <div style={{ display: 'flex', gap: 6, alignItems: 'flex-start', marginBottom: 4 }}>

          {/* Coluna esquerda */}
          <div style={{ flex: '0 0 60%' }}>
            {/* Dorms / Suítes / Banheiros */}
            <Row>
              <span style={{ display: 'inline-flex', alignItems: 'baseline', gap: 2 }}>
                <span style={S.label}>Dorm:</span>
                <span style={S.campoFixo(24)}>{td ? (DORMI_LABEL[d.dormitorios ?? ''] ?? d.dormitorios ?? '') : ''}</span>
              </span>
              <span style={{ display: 'inline-flex', alignItems: 'baseline', gap: 2, marginLeft: 4 }}>
                <span style={S.label}>Suítes:</span>
                <span style={S.campoFixo(22)}>{td ? (SUITES_LABEL[d.suites ?? ''] ?? d.suites ?? '') : ''}</span>
              </span>
              <span style={{ display: 'inline-flex', alignItems: 'baseline', gap: 2, marginLeft: 4 }}>
                <span style={S.label}>Banh:</span>
                <span style={S.campoFixo(22)}>{td ? (d.totalBanheiros ?? '') : ''}</span>
              </span>
            </Row>
            {/* Situação */}
            <CbRow label="Situação:" mb={0}>
              <Cb m={td ? d.situacaoImovel === 'MOBILIADO' : false} label="Mobiliado" />
              <Cb m={td ? d.situacaoImovel === 'SEMI_MOBILIADO' : false} label="Semi-Mob." />
              <Cb m={td ? d.situacaoImovel === 'SEM_MOBILIA' : false} label="Sem Mob." />
              <Cb m={td ? d.situacaoImovel === 'EM_REFORMA' : false} label="Em Reforma" />
              <Cb m={td ? d.situacaoImovel === 'NA_PLANTA' : false} label="Na Planta" />
            </CbRow>
          </div>

          {/* Coluna direita */}
          <div style={{ flex: 1, minWidth: 0 }}>
            {/* Vagas + Tipo Garagem */}
            <Row>
              <span style={{ display: 'inline-flex', alignItems: 'baseline', gap: 2 }}>
                <span style={S.label}>Vagas:</span>
                <span style={S.campoFixo(22)}>{td ? (VAGAS_LABEL[d.vagasGaragem ?? ''] ?? d.vagasGaragem ?? '') : ''}</span>
              </span>
              <span style={{ display: 'inline-flex', alignItems: 'baseline', gap: 2, marginLeft: 4, flex: 1 }}>
                <span style={S.label}>Tipo:</span>
                <span style={{ ...S.campo, minWidth: 40 }}>{td ? (GARAGEM_LABEL[d.tipoGaragem ?? ''] ?? d.tipoGaragem ?? '') : ''}</span>
              </span>
            </Row>
            {/* Dependência + Vista Mar */}
            <CbRow mb={0}>
              <Cb m={d.dependencia} label="Dependência" />
              <Cb m={d.vistaMar} label="Vista Mar" />
            </CbRow>
            {/* Tipo Vista Mar */}
            <CbRow label="Tipo Vista:" mb={0}>
              <Cb m={td ? d.tipoVistaMar === 'FRENTE' : false} label="Frontal" />
              <Cb m={td ? d.tipoVistaMar === 'LATERAL' : false} label="Lateral" />
              <Cb m={td ? (!d.tipoVistaMar && !!d.vistaMar) : false} label="Parcial" />
            </CbRow>
          </div>
        </div>

        {/* Facilidades do Imóvel — 3 colunas */}
        <div style={{ marginBottom: 3 }}>
          <span style={{ ...S.label, display: 'block', marginBottom: 0 }}>Facilidades do Imóvel:</span>
          <FacilGrid
            selected={facilImovel}
            items={[
              { id: 'ARMARIOS_QUARTOS', label: 'Armários Quartos' },
              { id: 'COZ_PLANEJADA', label: 'Coz. Planejada' },
              { id: 'VENTILADOR_TETO', label: 'Ventilador Teto' },
              { id: 'AR_CONDICIONADO', label: 'Ar Condicionado' },
              { id: 'VARANDA_GOURMET', label: 'Varanda Gourmet' },
              { id: 'CHURRASQUEIRA', label: 'Churrasqueira' },
            ]}
          />
        </div>

        <Row mb={0}>
          <span style={S.label}>Outros:</span>
          <span style={S.campo}>{d.facilidadesImovelOutros ?? ''}</span>
        </Row>
      </Sec>

      {/* ── Seção 3: Dados do Condomínio ── */}
      <Sec>
        <SecTitle n={3} title="Dados do Condomínio" />

        {/* Acesso + Andar (mesma linha) */}
        <Row>
          <span style={{ display: 'inline-flex', alignItems: 'center', gap: 2 }}>
            <span style={{ ...S.label, marginRight: 3 }}>Acesso:</span>
            <Cb m={td ? d.acesso === 'ELEVADOR' : false} label="Elevador" />
            <Cb m={td ? d.acesso === 'ESCADAS' : false} label="Escada" />
            <Cb m={td ? d.acesso === 'RAMPA' : false} label="Rampa" />
            <Cb m={td ? d.acesso === 'TERREO' : false} label="Térreo" />
          </span>
          <span style={{ display: 'inline-flex', alignItems: 'baseline', gap: 2, marginLeft: 10 }}>
            <span style={S.label}>Andar:</span>
            <span style={S.campoFixo(35)}>{td && d.andar != null ? String(d.andar) : ''}</span>
          </span>
        </Row>

        {/* Facilidades do Condomínio + Outros — mesma linha */}
        <div style={{ display: 'flex', flexWrap: 'wrap', alignItems: 'baseline', gap: '1px 0', marginBottom: 0 }}>
          <span style={{ ...S.label, marginRight: 3 }}>Facilidades Cond.:</span>
          <Cb m={facilCond.includes('PISCINA')} label="Piscina" />
          <Cb m={facilCond.includes('ACADEMIA')} label="Academia" />
          <Cb m={facilCond.includes('SALAO_FESTAS')} label="Salão Festas" />
          <Cb m={facilCond.includes('SALAO_JOGOS')} label="Salão Jogos" />
          <Cb m={facilCond.includes('PLAYGROUND')} label="Playground" />
          <span style={{ ...S.label, marginLeft: 6, marginRight: 3 }}>Outros:</span>
          <span style={S.campo}>{d.facilidadesCondOutros ?? ''}</span>
        </div>
      </Sec>

      {/* ── Rodapé (1 linha, 7pt) ── */}
      <div style={{
        borderTop: '1px solid #ccc', paddingTop: 3, marginTop: 3,
        fontSize: '7pt', color: '#666', textAlign: 'center', background: 'white',
      }}>
        Biocasa Santos — uso interno — {data}
      </div>
    </div>
  )
}

// ─── Componente exportado: 2 fichas por folha A4 ────────────────────────────

export default function FichaCaptacao({ dados }: { dados?: DadosImovelFicha }) {
  return (
    <>
      <style>{`
        @media print {
          * {
            background: white !important;
            background-color: white !important;
            color: black !important;
            -webkit-print-color-adjust: exact;
            print-color-adjust: exact;
          }
          body, html {
            background: white !important;
          }
          /* Preservar fundo cinza nos títulos de seção */
          .ficha-secao-titulo {
            background-color: #eee !important;
            color: #000 !important;
          }
          @page {
            size: A4 portrait;
            margin: 0;
          }
        }
      `}</style>

      <div style={{ background: '#fff', maxWidth: '210mm', margin: '0 auto' }}>
        <FichaUnica dados={dados} />

        {/* Separador cortável */}
        <div style={{
          position: 'relative', textAlign: 'center',
          borderTop: '1.5px dashed #888', margin: '2mm 0',
          background: 'white',
        }}>
          <span style={{
            position: 'absolute', top: -10, left: '50%', transform: 'translateX(-50%)',
            background: 'white', padding: '0 8px', fontSize: '13pt', lineHeight: '1', color: '#555',
          }}>✂</span>
        </div>

        <FichaUnica dados={dados} />
      </div>
    </>
  )
}
