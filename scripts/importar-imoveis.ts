/**
 * Importa imóveis da planilha ESTOQUE_IMOVEIS.xlsx para o banco de dados.
 * Uso: npx tsx scripts/importar-imoveis.ts
 *   ou: export $(grep -v '^#' .env.local | xargs) && npx tsx scripts/importar-imoveis.ts
 */

import * as XLSX from 'xlsx'
import * as path from 'path'
import * as fs from 'fs'
import { PrismaClient } from '@prisma/client'

// ── Carrega .env.local se DATABASE_URL não estiver no ambiente ───────────────
if (!process.env.DATABASE_URL) {
  const envPath = path.join(process.cwd(), '.env.local')
  if (fs.existsSync(envPath)) {
    const linhas = fs.readFileSync(envPath, 'utf-8').split('\n')
    for (const linha of linhas) {
      const t = linha.trim()
      if (!t || t.startsWith('#')) continue
      const idx = t.indexOf('=')
      if (idx === -1) continue
      const chave = t.slice(0, idx).trim()
      let valor = t.slice(idx + 1).trim()
      // Remove aspas envolventes
      if ((valor.startsWith('"') && valor.endsWith('"')) ||
          (valor.startsWith("'") && valor.endsWith("'"))) {
        valor = valor.slice(1, -1)
      }
      process.env[chave] = valor
    }
  }
}

const prisma = new PrismaClient()

const UNIDADE_ID = 'cmoeqswu10001o1rxojovm4ia'
const PLANILHA   = path.join(process.cwd(), 'scripts', 'ESTOQUE_IMOVEIS.xlsx')

// ── Helpers ──────────────────────────────────────────────────────────────────

/** Extrai as 2 primeiras letras do código de referência */
function prefixo(ref: string): string {
  return ref.replace(/[^A-Za-z]/g, '').toUpperCase().slice(0, 2)
}

function resolverFinalidade(pref: string): string {
  return ['LO', 'GR'].includes(pref) ? 'COMERCIAL' : 'RESIDENCIAL'
}

function resolverTipo(pref: string): string {
  const mapa: Record<string, string> = {
    AP: 'APARTAMENTO', KN: 'APARTAMENTO', CO: 'APARTAMENTO',
    CA: 'CASA',        VL: 'CASA',
    TE: 'TERRENO',
    CH: 'CHACARA',
    LO: 'LOJA',
    GR: 'GALPAO',
  }
  return mapa[pref] ?? 'APARTAMENTO'
}

function resolverSubtipo(pref: string): string | null {
  if (pref === 'KN') return 'KITNET'
  if (pref === 'VL') return 'VILLAGGIO'
  return null
}

function resolverModalidade(pretensao: string): 'VENDA' | 'LOCACAO' | 'AMBOS' {
  const p = (pretensao ?? '').toLowerCase()
  if (p.includes('venda') && (p.includes('loca') || p.includes('alug'))) return 'AMBOS'
  if (p.includes('loca') || p.includes('alug')) return 'LOCACAO'
  return 'VENDA'
}

/** Limpa strings monetárias como "R$ 450.000,00" → 450000 */
function limparValor(val: any): number | null {
  if (val === null || val === undefined || val === '') return null
  if (typeof val === 'number') return val > 0 ? val : null
  const str = String(val)
    .replace(/R\$\s?/g, '')
    .replace(/\s/g, '')
    .replace(/\./g, '')     // separador de milhar
    .replace(',', '.')      // separador decimal
    .trim()
  const num = parseFloat(str)
  return isNaN(num) || num <= 0 ? null : num
}

/** Converte serial Excel ou string DD/MM/YYYY para Date */
function resolverData(val: any): Date {
  if (!val) return new Date()
  if (val instanceof Date) return val
  if (typeof val === 'number') {
    // Serial Excel: dias desde 01/01/1900 (com o bug do ano bissexto do Excel)
    return new Date(Math.round((val - 25569) * 86400000))
  }
  const str = String(val).trim()
  // DD/MM/YYYY ou D/M/YYYY
  const m = str.match(/^(\d{1,2})\/(\d{1,2})\/(\d{4})$/)
  if (m) {
    return new Date(Number(m[3]), Number(m[2]) - 1, Number(m[1]))
  }
  const d = new Date(str)
  return isNaN(d.getTime()) ? new Date() : d
}

function resolverCaptador(nomeAba: string, proprietario: string): string {
  if (nomeAba === 'Biocasa')      return 'Biocasa'
  if (nomeAba === 'Carone')       return 'Carone'
  return proprietario || nomeAba   // Construtoras → nome do proprietário
}

/** Normaliza chaves da linha removendo espaços extras e variações de encoding */
function normalizar(row: Record<string, any>): Record<string, any> {
  const out: Record<string, any> = {}
  for (const k of Object.keys(row)) {
    out[k.trim()] = row[k]
  }
  return out
}

/** Lê uma chave com variações de acento (fallback) */
function cel(row: Record<string, any>, ...chaves: string[]): any {
  for (const c of chaves) {
    if (row[c] !== undefined && row[c] !== '') return row[c]
  }
  return ''
}

// ── Principal ────────────────────────────────────────────────────────────────

async function main() {
  if (!fs.existsSync(PLANILHA)) {
    console.error(`\n❌ Planilha não encontrada: ${PLANILHA}`)
    console.error('   Copie o arquivo ESTOQUE_IMOVEIS.xlsx para a pasta scripts/ e tente novamente.\n')
    process.exit(1)
  }

  console.log(`\n📂 Lendo: ${PLANILHA}`)

  const wb = XLSX.readFile(PLANILHA, { cellDates: true })
  console.log(`   Abas encontradas: ${wb.SheetNames.join(', ')}\n`)

  let totalImportados = 0
  let totalDuplicados = 0
  let totalErros      = 0

  for (const nomeAba of wb.SheetNames) {
    const sheet  = wb.Sheets[nomeAba]
    const linhas = XLSX.utils.sheet_to_json<Record<string, any>>(sheet, { defval: '' })

    console.log(`\n${'─'.repeat(60)}`)
    console.log(`  Aba: ${nomeAba}  (${linhas.length} linhas lidas)`)
    console.log(`${'─'.repeat(60)}`)

    for (const linhaRaw of linhas) {
      const row = normalizar(linhaRaw)

      // Código de referência — pula linhas sem ref ou com cabeçalho repetido
      const ref = String(cel(row, 'Ref.', 'Ref', 'REF')).trim()
      if (!ref || /^ref\.?$/i.test(ref)) continue

      try {
        // ── Duplicado? ─────────────────────────────────────────────────────
        const existe = await prisma.imovel.findUnique({ where: { codigoRef: ref } })
        if (existe) {
          console.log(`  ⤸  ${ref.padEnd(12)} duplicado — ignorado`)
          totalDuplicados++
          continue
        }

        // ── Mapeamento ─────────────────────────────────────────────────────
        const pretensao  = String(cel(row, 'Pretensão', 'Pretensao', 'PRETENSÃO')).trim()
        const modalidade = resolverModalidade(pretensao)
        const pref       = prefixo(ref)

        const valorRaw    = cel(row, 'Valor', 'VALOR')
        const valor       = limparValor(valorRaw)

        const proprietario   = String(cel(row, 'Proprietário', 'Proprietario', 'PROPRIETÁRIO')).trim() || null
        const telProprietario = String(cel(row, 'Telefone Prop', 'Telefone', 'TEL PROP')).trim() || null
        const nome           = String(cel(row, 'Imovel', 'Imóvel', 'IMOVEL')).trim() || null
        const logradouro     = String(cel(row, 'Logradouro', 'LOGRADOURO')).trim() || '-'
        const bairro         = String(cel(row, 'Bairro', 'BAIRRO')).trim() || '-'
        const cidade         = String(cel(row, 'Cidade', 'CIDADE')).trim() || 'Santos'
        const linkExterno    = String(cel(row, 'link', 'Link', 'LINK')).trim() || null
        const dataRaw        = cel(row, 'Data de cadastro', 'Data', 'DATA')
        const dataCadastro   = resolverData(dataRaw)

        // ── Inserir ────────────────────────────────────────────────────────
        await prisma.imovel.create({
          data: {
            codigoRef:     ref,
            nome,
            finalidade:    resolverFinalidade(pref),
            tipo:          resolverTipo(pref),
            subtipo:       resolverSubtipo(pref),
            logradouro,
            bairro,
            cidade,
            estado:        'SP',
            modalidade,
            valorVenda:    ['VENDA',  'AMBOS'].includes(modalidade) ? valor : null,
            valorLocacao:  ['LOCACAO','AMBOS'].includes(modalidade) ? valor : null,
            situacao:      'DISPONIVEL',
            proprietario,
            telProprietario,
            captador:      resolverCaptador(nomeAba, proprietario ?? ''),
            linkExterno,
            dataCadastro,
            unidadeId:     UNIDADE_ID,
          },
        })

        const loc = [bairro !== '-' ? bairro : null, cidade].filter(Boolean).join(', ')
        console.log(`  ✓  ${ref.padEnd(12)} ${(nome ?? '').slice(0, 28).padEnd(30)} ${modalidade.padEnd(7)} ${loc}`)
        totalImportados++

      } catch (err: any) {
        console.log(`  ✗  ${ref.padEnd(12)} ERRO: ${err.message?.slice(0, 80)}`)
        totalErros++
      }
    }
  }

  // ── Totais ─────────────────────────────────────────────────────────────────
  console.log('\n' + '═'.repeat(60))
  console.log(`  ✓  Importados : ${totalImportados}`)
  console.log(`  ⤸  Duplicados : ${totalDuplicados}`)
  console.log(`  ✗  Erros      : ${totalErros}`)
  console.log(`  ─  Total      : ${totalImportados + totalDuplicados + totalErros}`)
  console.log('═'.repeat(60) + '\n')

  await prisma.$disconnect()
}

main().catch(async (err) => {
  console.error('\n❌ Erro fatal:', err.message ?? err)
  await prisma.$disconnect()
  process.exit(1)
})
