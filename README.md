# Estoque Santo Favo

Sistema de Controle de Estoque desenvolvido para a Santo Favo.

## Funcionalidades

- **Dashboard**: Visão geral de alertas e métricas.
- **Produtos**: Cadastro, edição e listagem de produtos.
- **Entradas**: Registro de notas fiscais e compras.
- **Contagem (App do Colaborador)**: Interface simplificada para contagem física de estoque.
- **Aprovação**: Fluxo de revisão e aprovação de contagens por gerentes.
- **Relatórios**: Processamento semanal de consumo e listas de compras automáticas.

## Tecnologias

- **Frontend**: React + Vite + TypeScript
- **UI**: Tailwind CSS + Shadcn UI
- **Backend/Banco de Dados**: Supabase
- **Ícones**: Lucide React

## Configuração Inicial

### 1. Supabase

1. Crie um novo projeto no [Supabase](https://supabase.com).
2. Vá para o **SQL Editor** e execute o script contido em `supabase/schema.sql`.
   - Isso criará as tabelas e políticas de segurança (RLS).
3. Copie as chaves de API (`Project URL` e `anon public key`).

### 2. Ambiente Local

1. Clone o repositório.
2. Instale as dependências:
   ```bash
   npm install
   ```
3. Crie um arquivo `.env` na raiz basendo-se no exemplo (se houver) ou adicione:
   ```env
   VITE_SUPABASE_URL=sua_url_do_supabase
   VITE_SUPABASE_ANON_KEY=sua_chave_anonima_do_supabase
   ```
4. Inicie o servidor de desenvolvimento:
   ```bash
   npm run dev
   ```

## Deploy

O projeto está pronto para deploy na Vercel, Netlify ou qualquer host de arquivos estáticos.

**Comando de Build:**

```bash
npm run build
```

**Diretório de Saída:** `dist`

## Estrutura do Banco de Dados

- `products`: Catálogo mestre.
- `stock_entries`: Histórico de entradas.
- `stock_counts`: Cabeçalho das contagens.
- `stock_count_items`: Itens das contagens.
- `weekly_reports`: Relatórios de fechamento semanal.
