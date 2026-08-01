# 20260801 — Importação inteligente de babas

Migration aditiva e reversível para o schema Firestore v2.

## Up

1. Publica as regras e índices que autorizam as novas coleções administrativas.
2. Preenche `normalizedName` e `normalizedAliasKey` nos jogadores existentes.
3. Cria chaves de unicidade em `baba_player_name_keys` sem alterar nomes oficiais.

```powershell
cd public
$env:GOOGLE_APPLICATION_CREDENTIALS='C:\caminho\service-account.json'
$env:FIREBASE_PROJECT_ID='seu-project-id'
npm run migrate:baba-import
cd ..
firebase deploy --only firestore:rules,firestore:indexes
```

## Down

A reversão remove somente os dois campos normalizados e as chaves cuja origem é esta migration. Imports, aliases, babas e históricos já criados são preservados.

```powershell
cd public
npm run migrate:baba-import:down
```

Não execute `down` em produção sem backup e janela de manutenção.
