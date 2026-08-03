# Sitey Caixa

## Importação inteligente de babas

A área **Organizador → Importar novo baba com IA** transforma relatórios em dados estruturados, compara jogadores e aliases, valida gols/pontos e exige revisão antes da transação Firestore. O parser determinístico é obrigatório; a API de IA é apenas um apoio para textos desorganizados.

Configuração:

1. Copie `.env.example` para `.env` no servidor e preencha `OPENAI_API_KEY`, `OPENAI_MODEL`, `FIREBASE_PROJECT_ID` e, para migrations administrativas, `BABA_ACCOUNT_UID`.
2. Ative o provedor Google no Firebase Authentication. Toda conta autenticada é tratada como administradora do Baba.
3. Execute `npm run migrate:baba-import` e publique regras/índices com `firebase deploy --only firestore:rules,firestore:indexes --project sitey-caixa-16e06`.
4. Inicie o endpoint opcional com `npm run api`, conforme o ambiente de hospedagem.

O organizador gera o código dos jogadores na aba **Organizador**. O Firestore armazena somente o hash SHA-256 desse código; gerar outro revoga imediatamente o anterior. Login Google, modo de acesso, código lembrado e última tela permanecem salvos no dispositivo.

Cada conta Google possui um espaço isolado em `baba_accounts/{uid}` para jogadores, babas, rankings, pagamentos, aliases e histórico de importações. A importação com IA reutiliza automaticamente o login principal e não apresenta um segundo pedido de autenticação. Coleções globais antigas são preservadas; no primeiro acesso, a cópia local existente é reivindicada por uma única conta e migrada sem apagar a origem.

Comandos de verificação: `npm test`, `npm run lint`, `npm run typecheck` e `npm run build`.

## Integração MCP

O projeto inclui um servidor MCP para agentes de IA lerem e, mediante confirmação, alterarem os dados do Baba. A implantação principal expõe `https://sitey-caixa.vercel.app/mcp`. Consulte [MCP.md](./MCP.md) para configurar o Firebase Admin, acesso local por `stdio`, acesso remoto por Streamable HTTP, proteção por token e auditoria de alterações.

## Correções de produção importantes

### 1) Domínio OAuth autorizado (erro `domain not authorized`)
Se usar login Google popup/redirect:

1. Firebase Console → **Authentication** → **Settings** → **Authorized domains**.
2. Adicione:
   - domínio de produção (ex: `seudominio.com`)
   - domínio preview da Vercel (ex: `*.vercel.app`)
   - se necessário, o domínio específico do projeto na Vercel.

### 2) Manifest público (erro 401)
- O projeto usa `<link rel="manifest" href="/manifest.webmanifest">`.
- Garanta que `manifest.webmanifest` e ícones (`/icons/*`) estejam públicos sem autenticação.

### 3) Firestore sem login para cliente
- Regras recomendadas estão em `FIRESTORE_RULES.md`.
- Fluxo público do cliente:
  - URL: `/arteonline.html?oid=<OID>&token=<TOKEN>`
  - valida `order_clients/{token}` -> `oid`
  - lê `orders_public/{oid}`
  - envia feedback para `order_feedback/{token}/items/*`.

### 4) Permissões do Firestore no modo sem login
- Se o painel admin estiver sem autenticação Firebase, ele **precisa** de permissão de escrita em:
  - `orders/{oid}`
  - `orders_public/{oid}`
  - `order_clients/{token}`
- Use temporariamente as regras abertas do arquivo `FIRESTORE_RULES.md` para remover os erros de permissão no fluxo atual.
- Depois que estabilizar, faça hardening com Auth ou Cloud Functions.
