# Acesso MCP ao Baba

Este servidor permite que agentes de IA consultem e, quando explicitamente habilitado, alterem os dados do Baba no Firestore. O acesso sempre fica limitado à conta definida em `BABA_ACCOUNT_UID`.

## Conectar ao Gemini Spark

Informe somente esta URL ao criar a conexão MCP:

```text
https://sitey-caixa.vercel.app/mcp
```

O Gemini descobre o OAuth automaticamente, registra o cliente e abre a página **Autorizar acesso ao Baba**. Nessa página, digite a senha definida em `BABA_MCP_OAUTH_PASSWORD`. Não envie essa senha, a conta de serviço Firebase ou outros segredos no chat do Gemini.

O servidor implementa OAuth 2.1 Authorization Code, PKCE S256, descoberta do recurso protegido, descoberta do servidor de autorização, registro dinâmico de clientes e rotação de refresh tokens.

## Configuração na Vercel

Cadastre em **Vercel → Project Settings → Environment Variables** no ambiente Production:

```env
FIREBASE_PROJECT_ID=sitey-caixa-16e06
FIREBASE_SERVICE_ACCOUNT_JSON={JSON_COMPLETO_DA_CONTA_DE_SERVICO}
BABA_ACCOUNT_UID=UID_DA_CONTA_GOOGLE

BABA_MCP_PUBLIC_URL=https://sitey-caixa.vercel.app
BABA_MCP_OAUTH_SECRET=SEGREDO_ALEATORIO_COM_PELO_MENOS_32_CARACTERES
BABA_MCP_OAUTH_PASSWORD=SENHA_FORTE_COM_PELO_MENOS_12_CARACTERES
BABA_MCP_WRITE_ENABLED=false
BABA_MCP_CONFIRMATION_SECRET=OUTRO_SEGREDO_ALEATORIO_COM_PELO_MENOS_32_CARACTERES
```

Depois, faça um novo deploy. `BABA_MCP_OAUTH_SECRET` assina códigos e tokens; não deve ser trocado enquanto houver conexões ativas. `BABA_MCP_OAUTH_PASSWORD` é a senha digitada na tela de autorização. Use `FIREBASE_SERVICE_ACCOUNT_JSON` na Vercel, pois o caminho local de `GOOGLE_APPLICATION_CREDENTIALS` não existe no servidor.

Para criar segredos aleatórios no PowerShell:

```powershell
node -e "console.log(require('crypto').randomBytes(32).toString('hex'))"
```

Execute duas vezes e use valores diferentes para `BABA_MCP_OAUTH_SECRET` e `BABA_MCP_CONFIRMATION_SECRET`.

## Segurança adotada

- O endpoint público usa Bearer tokens emitidos pelo fluxo OAuth padrão; não usa token fixo compartilhado com o cliente.
- Todo cliente usa PKCE S256 e o callback deve corresponder exatamente ao registrado.
- Códigos de autorização e refresh tokens são de uso único, registrados no Firestore.
- Escritas começam desativadas e só funcionam com `BABA_MCP_WRITE_ENABLED=true` e escopo `baba.write`.
- Toda escrita exige duas chamadas: `baba_preparar_alteracao` e `baba_salvar_documento`, com confirmação assinada válida por cinco minutos.
- Alterações geram registro em `baba_accounts/{uid}/mcp_audit`.
- Não há exclusão física. Para remover algo, grave `{ "deleted": true }` por mesclagem.
- Migrações, chaves de importação e auditoria são somente leitura pelo MCP.

## Uso local por stdio

Requer Node.js 20 ou superior e uma credencial Firebase Admin. No diretório `public`, execute:

```powershell
npm run mcp
```

Configuração genérica de um cliente MCP local:

```json
{
  "mcpServers": {
    "baba": {
      "command": "node",
      "args": ["C:\\caminho\\sitey-caixa\\public\\mcp\\stdio.mjs"],
      "env": {
        "FIREBASE_PROJECT_ID": "sitey-caixa-16e06",
        "GOOGLE_APPLICATION_CREDENTIALS": "C:\\caminho\\service-account.json",
        "BABA_ACCOUNT_UID": "UID_DA_CONTA"
      }
    }
  }
}
```

O servidor HTTP local iniciado por `npm run mcp:http` continua aceitando `Authorization: Bearer <BABA_MCP_ACCESS_TOKEN>` em `http://127.0.0.1:3001/mcp`. Esse modo é apenas para desenvolvimento local; o endpoint da Vercel usa OAuth.

## Ferramentas disponíveis

- `baba_resumo`
- `baba_listar_jogadores`
- `baba_listar_eventos`
- `baba_detalhar_evento`
- `baba_ler_documento`
- `baba_listar_colecao`
- `baba_preparar_alteracao`
- `baba_salvar_documento`

Também existem os recursos `baba://conta/resumo` e `baba://conta/mapa-de-dados`.

## Fluxo correto de alteração

1. Leia o documento atual.
2. Chame `baba_preparar_alteracao` com caminho, dados, modo e motivo.
3. Mostre a prévia para a pessoa responsável.
4. Após aprovação, chame `baba_salvar_documento` com os mesmos valores e o token `confirmation`.

Use `modo: "mesclar"` na maioria dos casos. `substituir` apaga do documento todos os campos que não forem reenviados.
