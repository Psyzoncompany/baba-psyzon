# Acesso MCP ao Baba

Este servidor permite que agentes de IA consultem e, quando explicitamente habilitado, alterem os dados do Baba no Firestore. Ele sempre fica preso à conta definida em `BABA_ACCOUNT_UID`.

## Segurança adotada

- O modo HTTP exige `Authorization: Bearer <BABA_MCP_ACCESS_TOKEN>`.
- Escritas começam desativadas e só funcionam com `BABA_MCP_WRITE_ENABLED=true`.
- Toda escrita exige duas chamadas: `baba_preparar_alteracao` e `baba_salvar_documento` com confirmação assinada válida por cinco minutos.
- Alterações geram um registro em `baba_accounts/{uid}/mcp_audit`.
- Não há exclusão física. Para remover algo, grave `{ "deleted": true }` por mesclagem.
- Migrações, chaves de importação e auditoria são somente leitura pelo MCP.

## Configuração

Requer Node.js 20 ou superior e uma credencial Firebase Admin. Copie `.env.example` para `.env` e preencha:

```env
FIREBASE_PROJECT_ID=sitey-caixa-16e06
GOOGLE_APPLICATION_CREDENTIALS=C:\caminho\service-account.json
BABA_ACCOUNT_UID=UID_DA_CONTA_GOOGLE

BABA_MCP_WRITE_ENABLED=false
BABA_MCP_ACCESS_TOKEN=gere-um-segredo-aleatorio-com-ao-menos-32-caracteres
BABA_MCP_CONFIRMATION_SECRET=outro-segredo-longo-e-aleatorio
BABA_MCP_HOST=127.0.0.1
BABA_MCP_PORT=3001
```

Em hospedagens onde não há arquivo de credencial, use `FIREBASE_SERVICE_ACCOUNT_JSON` com o JSON completo da conta de serviço, armazenado como segredo do provedor.

## Uso local por stdio

No diretório `public`:

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

Para liberar alterações nesse cliente, acrescente `"BABA_MCP_WRITE_ENABLED": "true"`. O transporte stdio é indicado para Codex, Claude Desktop, VS Code e outras ferramentas que iniciam o processo localmente.

## Uso remoto por Streamable HTTP

```powershell
npm run mcp:http
```

- URL MCP: `http://127.0.0.1:3001/mcp`
- Saúde: `http://127.0.0.1:3001/health`
- Cabeçalho: `Authorization: Bearer <BABA_MCP_ACCESS_TOKEN>`

Para expor na internet, publique esse processo Node atrás de HTTPS e mantenha o token e a credencial Firebase somente como segredos do servidor. Ao usar `BABA_MCP_HOST=0.0.0.0`, configure também `BABA_MCP_ALLOWED_HOSTS` com os domínios aceitos, separados por vírgula.

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
