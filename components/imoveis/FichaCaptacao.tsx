'use client'

// Prop `dados` opcional — quando ausente renderiza em branco, quando presente renderiza preenchida
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

interface FichaCaptacaoProps {
  dados?: DadosImovelFicha
}

function fmt(v: number | null | undefined) {
  if (!v) return ''
  return v.toLocaleString('pt-BR', { style: 'currency', currency: 'BRL' })
}

function Linha({ label, valor }: { label: string; valor?: string | null }) {
  return (
    <div className="ficha-linha">
      <span className="ficha-label">{label}:</span>
      <span className="ficha-campo">{valor ?? ''}</span>
    </div>
  )
}

function Checkbox({ marcado, label }: { marcado?: boolean | null; label: string }) {
  return (
    <span className="ficha-checkbox">
      <span className={`ficha-box${marcado ? ' marcado' : ''}`}>{marcado ? '✓' : ''}</span>
      {label}
    </span>
  )
}

const TIPOS_LABEL: Record<string, string> = {
  APARTAMENTO: 'Apartamento', CASA: 'Casa', TERRENO: 'Terreno', CHACARA: 'Chácara',
  SALA: 'Sala', LOJA: 'Loja', CASA_COMERCIAL: 'Casa Comercial', GALPAO: 'Galpão',
}

const SUBTIPO_LABEL: Record<string, string> = {
  ISOLADA: 'Isolada', SOBRADO: 'Sobrado', SOBREPOSTA_ALTA: 'Sobreposta Alta',
  SOBREPOSTA_BAIXA: 'Sobreposta Baixa', VILLAGGIO: 'Villaggio',
  KITNET_STUDIO: 'Kitnet/Studio', PADRAO: 'Padrão', TERREO: 'Térreo',
}

export default function FichaCaptacao({ dados }: FichaCaptacaoProps) {
  const d = dados ?? {}
  const dataImpressao = new Date().toLocaleDateString('pt-BR')

  const facilImovel: string[] = (() => {
    try { return d.facilidadesImovel ? JSON.parse(d.facilidadesImovel) : [] } catch { return [] }
  })()
  const facilCond: string[] = (() => {
    try { return d.facilidadesCond ? JSON.parse(d.facilidadesCond) : [] } catch { return [] }
  })()

  const temDados = !!dados

  return (
    <>
      <style>{`
        .ficha-captacao {
          font-family: Arial, Helvetica, sans-serif;
          font-size: 11px;
          color: #000;
          background: #fff;
          width: 210mm;
          min-height: 297mm;
          margin: 0 auto;
          padding: 12mm 14mm 10mm;
          box-sizing: border-box;
        }
        .ficha-cabecalho {
          display: flex;
          align-items: center;
          justify-content: space-between;
          border-bottom: 2px solid #000;
          padding-bottom: 8px;
          margin-bottom: 10px;
        }
        .ficha-titulo {
          text-align: center;
          flex: 1;
        }
        .ficha-titulo h1 {
          font-size: 15px;
          font-weight: bold;
          margin: 0;
          text-transform: uppercase;
          letter-spacing: 1px;
        }
        .ficha-titulo p {
          font-size: 10px;
          margin: 2px 0 0;
          color: #333;
        }
        .ficha-logo-area {
          width: 60px;
          text-align: right;
          font-size: 10px;
          font-weight: bold;
          letter-spacing: 1px;
        }
        .ficha-secao {
          margin-bottom: 8px;
          border: 1px solid #aaa;
          padding: 6px 8px;
          border-radius: 2px;
          page-break-inside: avoid;
        }
        .ficha-secao-titulo {
          font-size: 10px;
          font-weight: bold;
          text-transform: uppercase;
          letter-spacing: 0.5px;
          border-bottom: 1px solid #ccc;
          padding-bottom: 3px;
          margin-bottom: 6px;
        }
        .ficha-linha {
          display: flex;
          align-items: baseline;
          gap: 4px;
          margin-bottom: 4px;
          flex-wrap: nowrap;
        }
        .ficha-label {
          font-size: 10px;
          font-weight: bold;
          white-space: nowrap;
          flex-shrink: 0;
        }
        .ficha-campo {
          flex: 1;
          border-bottom: 1px solid #000;
          min-width: 40px;
          font-size: 11px;
          padding: 0 2px;
          display: inline-block;
          min-height: 14px;
        }
        .ficha-grid-2 {
          display: grid;
          grid-template-columns: 1fr 1fr;
          gap: 0 12px;
        }
        .ficha-grid-3 {
          display: grid;
          grid-template-columns: 1fr 1fr 1fr;
          gap: 0 12px;
        }
        .ficha-checkboxes {
          display: flex;
          flex-wrap: wrap;
          gap: 4px 12px;
          margin-bottom: 4px;
          align-items: center;
        }
        .ficha-checkbox {
          display: inline-flex;
          align-items: center;
          gap: 3px;
          font-size: 10px;
          white-space: nowrap;
        }
        .ficha-box {
          display: inline-block;
          width: 11px;
          height: 11px;
          border: 1px solid #000;
          text-align: center;
          line-height: 11px;
          font-size: 9px;
          flex-shrink: 0;
        }
        .ficha-box.marcado {
          background: #000;
          color: #fff;
        }
        .ficha-descricao {
          border: 1px solid #aaa;
          min-height: 70px;
          padding: 3px;
          font-size: 11px;
          margin-top: 3px;
          white-space: pre-wrap;
        }
        .ficha-rodape {
          margin-top: 10px;
          border-top: 1px solid #ccc;
          padding-top: 5px;
          display: flex;
          justify-content: space-between;
          font-size: 9px;
          color: #555;
        }
        .ficha-outros {
          display: flex;
          align-items: baseline;
          gap: 4px;
          margin-top: 2px;
        }
        .ficha-outros-label {
          font-size: 10px;
          font-weight: bold;
          white-space: nowrap;
          flex-shrink: 0;
        }
        .ficha-outros-campo {
          flex: 1;
          border-bottom: 1px solid #000;
          min-height: 14px;
          font-size: 11px;
          padding: 0 2px;
        }

        @media print {
          * { -webkit-print-color-adjust: exact !important; print-color-adjust: exact !important; }
          body > * { display: none !important; }
          .ficha-captacao-wrapper { display: block !important; }
          .ficha-captacao {
            width: 100%;
            margin: 0;
            padding: 8mm 12mm;
          }
          .ficha-box.marcado {
            background: #000 !important;
            color: #fff !important;
          }
        }
      `}</style>

      <div className="ficha-captacao">
        {/* Cabeçalho */}
        <div className="ficha-cabecalho">
          <div style={{ width: 60, fontSize: 12, fontWeight: 'bold', letterSpacing: 1 }}>
            BIOCASA
          </div>
          <div className="ficha-titulo">
            <h1>Ficha de Captação de Imóvel</h1>
            <p>{d.unidadeNome ? `${d.unidadeNome} · ` : ''}Data: {dataImpressao}</p>
          </div>
          <div style={{ width: 60 }} />
        </div>

        {/* Seção 1 — Dados Comerciais */}
        <div className="ficha-secao">
          <div className="ficha-secao-titulo">1. Dados Comerciais</div>

          <div className="ficha-grid-2">
            <Linha label="Código de Referência" valor={d.codigoRef} />
            <Linha label="Nome do Imóvel" valor={d.nome} />
          </div>

          <div className="ficha-checkboxes" style={{ marginBottom: 4 }}>
            <span className="ficha-label" style={{ marginRight: 4 }}>Finalidade:</span>
            <Checkbox marcado={temDados ? d.finalidade === 'RESIDENCIAL' : false} label="Residencial" />
            <Checkbox marcado={temDados ? d.finalidade === 'COMERCIAL' : false} label="Comercial" />
            <Checkbox marcado={temDados ? d.finalidade === 'RURAL' : false} label="Rural" />
          </div>

          <div className="ficha-checkboxes" style={{ marginBottom: 4 }}>
            <span className="ficha-label" style={{ marginRight: 4 }}>Tipo:</span>
            <Checkbox marcado={temDados ? d.tipo === 'APARTAMENTO' : false} label="Apartamento" />
            <Checkbox marcado={temDados ? d.tipo === 'CASA' : false} label="Casa" />
            <Checkbox marcado={temDados ? d.tipo === 'TERRENO' : false} label="Terreno" />
            <Checkbox marcado={temDados ? (d.tipo === 'APARTAMENTO' && d.subtipo === 'KITNET_STUDIO') : false} label="Kitnet" />
            <Checkbox marcado={false} label="Cobertura" />
            <Checkbox marcado={false} label="Village" />
            <Checkbox marcado={temDados ? d.tipo === 'LOJA' : false} label="Loja" />
            <Checkbox marcado={false} label="Garagem" />
            <Checkbox marcado={temDados ? d.tipo === 'CHACARA' : false} label="Chácara" />
          </div>

          <Linha
            label="Subtipo"
            valor={temDados && d.subtipo ? (SUBTIPO_LABEL[d.subtipo] ?? d.subtipo) : undefined}
          />

          <div className="ficha-grid-3">
            <Linha label="CEP" valor={d.cep} />
            <Linha label="Logradouro" valor={d.logradouro} />
            <Linha label="Número" valor={d.numero} />
          </div>

          <div className="ficha-grid-2">
            <Linha label="Complemento" valor={d.complemento} />
            <Linha label="Bairro" valor={d.bairro} />
          </div>

          <div className="ficha-grid-3">
            <Linha label="Cidade" valor={d.cidade} />
            <Linha label="Estado" valor={d.estado} />
            <Linha label="Edifício/Cond." valor={d.edificio} />
          </div>

          <div className="ficha-grid-2">
            <Linha label="Proprietário" valor={d.proprietario} />
            <Linha label="Contato" valor={d.telProprietario} />
          </div>

          <div className="ficha-grid-2">
            <Linha label="Captador" valor={d.captador} />
            <div style={{ display: 'flex', alignItems: 'baseline', gap: 8 }}>
              <Checkbox marcado={d.parceria} label="Parceria Imobiliária" />
            </div>
          </div>

          <div className="ficha-checkboxes" style={{ marginBottom: 4 }}>
            <span className="ficha-label" style={{ marginRight: 4 }}>Modalidade:</span>
            <Checkbox marcado={temDados ? d.modalidade === 'VENDA' : false} label="Venda" />
            <Checkbox marcado={temDados ? d.modalidade === 'LOCACAO' : false} label="Locação" />
            <Checkbox marcado={temDados ? d.modalidade === 'AMBOS' : false} label="Venda + Locação" />
          </div>

          <div className="ficha-grid-2">
            <Linha label="Valor de Venda (R$)" valor={temDados ? fmt(d.valorVenda) : undefined} />
            <Linha label="Valor de Locação (R$)" valor={temDados ? fmt(d.valorLocacao) : undefined} />
          </div>

          <div className="ficha-grid-2">
            <Linha label="Condomínio (R$/mês)" valor={temDados ? fmt(d.valorCondominio) : undefined} />
            <Linha label="IPTU Mensal (R$)" valor={temDados ? fmt(d.valorIptu) : undefined} />
          </div>

          <div className="ficha-grid-2">
            <Linha label="Área Útil (m²)" valor={temDados && d.areaUtil ? String(d.areaUtil) : undefined} />
            <Linha label="Área Total (m²)" valor={temDados && d.areaTotal ? String(d.areaTotal) : undefined} />
          </div>

          <div className="ficha-checkboxes">
            <Checkbox marcado={d.aceitaPermuta} label="Aceita Permuta" />
            <Checkbox marcado={d.documentacaoOk} label="Documentação OK" />
            <Checkbox marcado={d.aceitaFinanc} label="Aceita Financiamento" />
          </div>
        </div>

        {/* Seção 2 — Dados do Imóvel */}
        <div className="ficha-secao">
          <div className="ficha-secao-titulo">2. Dados do Imóvel</div>

          <div className="ficha-checkboxes" style={{ marginBottom: 4 }}>
            <span className="ficha-label" style={{ marginRight: 4 }}>Dormitórios:</span>
            <Checkbox marcado={temDados ? d.dormitorios === '1' : false} label="1" />
            <Checkbox marcado={temDados ? d.dormitorios === '2' : false} label="2" />
            <Checkbox marcado={temDados ? d.dormitorios === '3' : false} label="3" />
            <Checkbox marcado={temDados ? d.dormitorios === '4' : false} label="4" />
            <Checkbox marcado={temDados ? d.dormitorios === '4_MAIS' : false} label="5+" />
            <Checkbox marcado={temDados ? d.dormitorios === 'KIT_STUDIO' : false} label="Kit/Studio" />
          </div>

          <div className="ficha-checkboxes" style={{ marginBottom: 4 }}>
            <span className="ficha-label" style={{ marginRight: 4 }}>Suítes:</span>
            <Checkbox marcado={temDados ? d.suites === 'NAO_TEM' : false} label="Não tem" />
            <Checkbox marcado={temDados ? d.suites === '1' : false} label="1" />
            <Checkbox marcado={temDados ? d.suites === '2' : false} label="2" />
            <Checkbox marcado={temDados ? d.suites === '3_MAIS' : false} label="3+" />
          </div>

          <div className="ficha-checkboxes" style={{ marginBottom: 4 }}>
            <span className="ficha-label" style={{ marginRight: 4 }}>Total de Banheiros:</span>
            <Checkbox marcado={temDados ? d.totalBanheiros === '1' : false} label="1" />
            <Checkbox marcado={temDados ? d.totalBanheiros === '2' : false} label="2" />
            <Checkbox marcado={temDados ? d.totalBanheiros === '3' : false} label="3" />
            <Checkbox marcado={temDados ? d.totalBanheiros === '4' : false} label="4+" />
          </div>

          <div className="ficha-checkboxes" style={{ marginBottom: 4 }}>
            <span className="ficha-label" style={{ marginRight: 4 }}>Situação do Imóvel:</span>
            <Checkbox marcado={temDados ? d.situacaoImovel === 'MOBILIADO' : false} label="Mobiliado" />
            <Checkbox marcado={temDados ? d.situacaoImovel === 'SEMI_MOBILIADO' : false} label="Semi-Mobiliado" />
            <Checkbox marcado={temDados ? d.situacaoImovel === 'SEM_MOBILIA' : false} label="Sem Mobília" />
            <Checkbox marcado={temDados ? d.situacaoImovel === 'EM_REFORMA' : false} label="Em Reforma" />
            <Checkbox marcado={temDados ? d.situacaoImovel === 'NA_PLANTA' : false} label="Na Planta" />
          </div>

          <div className="ficha-checkboxes" style={{ marginBottom: 4 }}>
            <span className="ficha-label" style={{ marginRight: 4 }}>Vagas de Garagem:</span>
            <Checkbox marcado={temDados ? d.vagasGaragem === 'SEM_VAGA' : false} label="Sem Vaga" />
            <Checkbox marcado={temDados ? d.vagasGaragem === '1' : false} label="1" />
            <Checkbox marcado={temDados ? d.vagasGaragem === '2' : false} label="2" />
            <Checkbox marcado={temDados ? d.vagasGaragem === '3_MAIS' : false} label="3+" />
          </div>

          <div className="ficha-checkboxes" style={{ marginBottom: 4 }}>
            <span className="ficha-label" style={{ marginRight: 4 }}>Tipo de Garagem:</span>
            <Checkbox marcado={temDados ? d.tipoGaragem === 'FECHADA' : false} label="Box Fechado" />
            <Checkbox marcado={temDados ? d.tipoGaragem === 'DEMARCADA' : false} label="Descoberta" />
            <Checkbox marcado={temDados ? d.tipoGaragem === 'COLETIVA_SUF' : false} label="Coberta" />
            <Checkbox marcado={temDados ? d.tipoGaragem === 'COLETIVA_INSUF' : false} label="Rotativa" />
          </div>

          <div className="ficha-checkboxes" style={{ marginBottom: 4 }}>
            <Checkbox marcado={d.dependencia} label="Dependência" />
            <Checkbox marcado={d.vistaMar} label="Vista Mar" />
          </div>

          <div className="ficha-checkboxes" style={{ marginBottom: 4 }}>
            <span className="ficha-label" style={{ marginRight: 4 }}>Tipo de Vista Mar:</span>
            <Checkbox marcado={temDados ? d.tipoVistaMar === 'FRENTE' : false} label="Frontal" />
            <Checkbox marcado={temDados ? d.tipoVistaMar === 'LATERAL' : false} label="Lateral" />
            <Checkbox marcado={temDados ? (d.vistaMar && !d.tipoVistaMar) || false : false} label="Parcial" />
          </div>

          <div style={{ marginBottom: 4 }}>
            <span className="ficha-label">Facilidades do Imóvel:</span>
            <div className="ficha-checkboxes" style={{ marginTop: 2 }}>
              <Checkbox marcado={temDados ? facilImovel.includes('ARMARIOS_QUARTOS') : false} label="Armários Quartos" />
              <Checkbox marcado={temDados ? facilImovel.includes('COZ_PLANEJADA') : false} label="Coz. Planejada" />
              <Checkbox marcado={temDados ? facilImovel.includes('VENTILADOR_TETO') : false} label="Ventilador Teto" />
              <Checkbox marcado={temDados ? facilImovel.includes('AR_CONDICIONADO') : false} label="Ar Condicionado" />
              <Checkbox marcado={temDados ? facilImovel.includes('VARANDA_GOURMET') : false} label="Varanda Gourmet" />
              <Checkbox marcado={temDados ? facilImovel.includes('CHURRASQUEIRA') : false} label="Churrasqueira" />
            </div>
            <div className="ficha-outros">
              <span className="ficha-outros-label">Outros:</span>
              <span className="ficha-outros-campo">{d.facilidadesImovelOutros ?? ''}</span>
            </div>
          </div>

          <div style={{ marginBottom: 0 }}>
            <span className="ficha-label">Descrição do Imóvel:</span>
            <div className="ficha-descricao">{d.descricao ?? ''}</div>
          </div>
        </div>

        {/* Seção 3 — Dados do Condomínio */}
        <div className="ficha-secao">
          <div className="ficha-secao-titulo">3. Dados do Condomínio</div>

          <div className="ficha-checkboxes" style={{ marginBottom: 4 }}>
            <span className="ficha-label" style={{ marginRight: 4 }}>Acesso:</span>
            <Checkbox marcado={temDados ? d.acesso === 'ELEVADOR' : false} label="Elevador" />
            <Checkbox marcado={temDados ? d.acesso === 'ESCADAS' : false} label="Escada" />
            <Checkbox marcado={temDados ? d.acesso === 'RAMPA' : false} label="Rampa" />
            <Checkbox marcado={temDados ? d.acesso === 'TERREO' : false} label="Térreo" />
          </div>

          <Linha label="Andar" valor={temDados && d.andar != null ? String(d.andar) : undefined} />

          <div style={{ marginBottom: 0 }}>
            <span className="ficha-label">Facilidades do Condomínio:</span>
            <div className="ficha-checkboxes" style={{ marginTop: 2 }}>
              <Checkbox marcado={temDados ? facilCond.includes('PISCINA') : false} label="Piscina" />
              <Checkbox marcado={temDados ? facilCond.includes('ACADEMIA') : false} label="Academia" />
              <Checkbox marcado={temDados ? facilCond.includes('SALAO_FESTAS') : false} label="Salão de Festas" />
              <Checkbox marcado={temDados ? facilCond.includes('SALAO_JOGOS') : false} label="Salão de Jogos" />
              <Checkbox marcado={temDados ? facilCond.includes('PLAYGROUND') : false} label="Playground" />
            </div>
            <div className="ficha-outros">
              <span className="ficha-outros-label">Outros:</span>
              <span className="ficha-outros-campo">{d.facilidadesCondOutros ?? ''}</span>
            </div>
          </div>
        </div>

        {/* Rodapé */}
        <div className="ficha-rodape">
          <span>Biocasa Santos — uso interno</span>
          <span>Data de impressão: {dataImpressao}</span>
        </div>
      </div>
    </>
  )
}
