# Baba Psyzon

Sistema de organizacao do Baba Psyzon com jogadores, times, partidas, gols, pagamentos, rankings, mesa tatica e importacao inteligente de relatorios.

## Configuracao

1. Copie `.env.example` para `.env` no servidor.
2. Preencha `OPENAI_API_KEY`, `OPENAI_MODEL`, `FIREBASE_PROJECT_ID` e, para migracoes administrativas, `BABA_ACCOUNT_UID`.
3. Ative os provedores Google e e-mail/senha no Firebase Authentication.
4. Publique as regras com `firebase deploy --only firestore:rules,firestore:indexes,storage`.
5. Quando necessario, execute a migracao com `npm run migrate:baba-import`.

Cada conta Google possui um espaco isolado em `baba_accounts/{uid}` para jogadores, babas, rankings, pagamentos, aliases e historico de importacoes. O organizador pode gerar um codigo de acesso para os jogadores; somente o hash SHA-256 e salvo no Firestore.

## Verificacao

- `npm test`
- `npm run lint`

## Integracao MCP

O projeto inclui um servidor MCP para agentes de IA consultarem e, mediante confirmacao, alterarem dados de uma ou mais contas do Baba. Consulte [MCP.md](./MCP.md) para configurar Firebase Admin, acesso local por `stdio`, OAuth e auditoria de alteracoes.

## Producao

No Firebase Authentication, adicione o dominio de producao e os dominios de preview autorizados. O manifesto e os icones em `/icons/` devem permanecer publicos.
