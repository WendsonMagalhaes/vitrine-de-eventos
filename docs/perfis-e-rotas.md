# Perfis e rotas — Vitrine Eventos

Três perfis, cada um com a sua experiência. Depois do login (`POST /api/auth/login`), o app chama
`GET /api/me` e escolhe a experiência pelo campo `role`.

| Perfil | Onde usa | O que pode fazer |
|---|---|---|
| **CLIENT** (cliente) | App | Ver a vitrine, buscar, ver perfil do fornecedor, favoritar (`/api/favorites`), ver banners (`/api/banners`) |
| **PROVIDER** (fornecedor) | Painel web `/fornecedor` e app | Editar o próprio perfil (`/api/providers/me`), fotos (`/api/uploads`), serviços (`/api/services`), enviar para análise (`/api/providers/me/submit`), ver números (`/api/providers/me/stats`) |
| **ADMIN** (administrador) | Painel web `/admin` | Moderar fornecedores, categorias, banners e usuários (`/api/admin/*`) |

Todos os perfis: `GET /api/me` e `POST /api/auth/password` (trocar a própria senha).

Cada rota valida o perfil no servidor: um token de cliente recebe 403 em rota de fornecedor ou de admin,
e vice-versa. Favoritar é exclusivo do cliente.

## Fluxo do app
1. Login → `GET /api/me`.
2. `role = CLIENT` → telas de vitrine, busca, fornecedor e favoritos.
3. `role = PROVIDER` → telas "Meu perfil" (informações, fotos, serviços) e o status (`provider.status`):
   `DRAFT`/`REJECTED` mostram "Enviar para análise"; `PENDING` mostra "Em análise"; `APPROVED` mostra "Publicado".
4. `role = ADMIN` → orientar a usar o painel web.
