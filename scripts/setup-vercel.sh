#!/bin/bash
# Script auxiliar para configurar variáveis na Vercel via CLI
# Execute APÓS: vercel link (conectar ao projeto na Vercel)

set -e

echo "Configurando variáveis de ambiente na Vercel..."

# Gera NEXTAUTH_SECRET automaticamente
NEXTAUTH_SECRET=$(openssl rand -base64 32)
echo "NEXTAUTH_SECRET gerado: $NEXTAUTH_SECRET"

# DATABASE_URL — ajuste a senha se necessário
DATABASE_URL="postgresql://biocasa_user:Bi0c4s%40Pg%232026%21Xk9@178.105.38.118:5433/portal_biocasa"

# Adiciona variáveis (vai perguntar o ambiente: Production/Preview/Development)
echo "$DATABASE_URL" | vercel env add DATABASE_URL production
echo "$NEXTAUTH_SECRET" | vercel env add NEXTAUTH_SECRET production
echo "https://portal.biocasa.com.br" | vercel env add NEXTAUTH_URL production
echo "5.50" | vercel env add DOLAR_REAL_PADRAO production

echo ""
echo "Variáveis configuradas! Falta adicionar manualmente:"
echo "  - GEMINI_API_KEY     (obter em: https://aistudio.google.com/app/apikey)"
echo "  - BLOB_READ_WRITE_TOKEN (obter em: painel Vercel > Storage > Blob)"
echo ""
echo "Execute: vercel env add GEMINI_API_KEY production"
echo "Execute: vercel env add BLOB_READ_WRITE_TOKEN production"
