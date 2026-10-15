# Caribi — website

Site de venda de automóveis premium usados, com painel de gestão para publicar viaturas e fotografias.

Node.js + Express, páginas geradas no servidor com EJS, dados guardados em `data/viaturas.json` e fotografias em `public/uploads/`. Não precisa de base de dados.

## Arrancar

```bash
npm install
cp .env.example .env      # edita ADMIN_PASSWORD e SESSION_SECRET
npm run dev               # http://localhost:3000
```

Requer Node 18 ou superior.

## Painel de gestão

Entra em `/admin/entrar` com a password definida em `ADMIN_PASSWORD`. No painel podes:

- adicionar, editar e apagar viaturas;
- carregar fotografias (várias de uma vez), escolher a capa e remover as que não queres;
- mudar o estado: Disponível, Reservado, Chega em breve ou Vendido (as vendidas saem da listagem mas o link continua a funcionar);
- escolher a viatura em destaque na página inicial (só uma de cada vez).

Se o preço ficar vazio, o site mostra «Preço sob consulta».

## Antes de publicar

1. Preenche os contactos reais em `config.js`: telefone, WhatsApp e email.
2. Revê o texto da política de privacidade em `views/privacidade.ejs`.
3. Define `NODE_ENV=production`, `SITE_URL` com o domínio final e um `SESSION_SECRET` longo e aleatório.

## Alojamento

Funciona em qualquer serviço que corra Node.js (VPS, Render, Railway, etc.). Como os dados e as fotografias ficam em ficheiros, o servidor precisa de **disco persistente**: num VPS isto é automático; em Render ou Railway, monta um volume para `data/` e `public/uploads/`.

As sessões do painel ficam em memória, por isso reiniciar o servidor obriga a voltar a entrar. Para um painel com um só utilizador, isto chega.

## Estrutura

```
server.js            rotas do site e do painel
config.js            dados da empresa e contactos
lib/store.js         leitura e escrita das viaturas
lib/helpers.js       formatação de preços, km, estados
views/               páginas (EJS)
views/admin/         painel de gestão
public/css/style.css estilos
data/viaturas.json   viaturas
public/uploads/      fotografias carregadas
```
