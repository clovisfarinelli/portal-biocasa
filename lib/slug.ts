function slugify(str: string): string {
  return str
    .normalize('NFD')
    .replace(/[̀-ͯ]/g, '')   // remove acentos
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, '-')      // não-alfanumérico → hífen
    .replace(/^-+|-+$/g, '')           // trim hífens
}

export function gerarSlugImovel(codigoRef: string, tipo: string, bairro: string, cidade: string): string {
  return [
    slugify(codigoRef),
    slugify(tipo),
    slugify(bairro),
    slugify(cidade),
  ].filter(Boolean).join('-')
}
