# Regras Firebase do Baba schema v2

As regras versionadas ficam na raiz do projeto:

- `firestore.rules`: Firestore geral e colecoes do Baba.
- `storage.rules`: imagens das metas de compra.
- `firestore.indexes.json`: indices compostos. O schema v2 usa apenas indices simples no momento.

Publique as regras antes de abrir a versao nova do Baba em producao:

```bash
firebase deploy --only firestore:rules,firestore:indexes,storage
```

O documento `orders_public/baba_live_state` aceita somente o ponteiro do schema v2. Os documentos do Baba possuem validacao de campos e as imagens ficam limitadas a 2 MiB no Firebase Storage.

## Limite de seguranca atual

O Baba permite acompanhamento publico e ainda usa uma senha de organizador apenas no navegador. Por isso, as colecoes do Baba precisam aceitar gravacoes sem Firebase Auth, embora as regras limitem formato, caminhos e tamanho. Para autorizacao forte, o proximo passo e autenticar o organizador no Firebase e exigir um `custom claim` de administrador nas operacoes de escrita.
