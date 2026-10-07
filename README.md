# Delivroo — Cliente Web (cardápio digital)

Front do cliente do **Delivroo 2**: cada loja tem o seu link pelo slug (`https://seu-dominio/brothersburger`).
Vite + React 19 + Tailwind v4 (JavaScript) + React Router. Consome a [delivroo-api-v2](https://github.com/jccintr/delivroo-api-v2).

## Rodar

```bash
npm install
npm run dev        # http://localhost:5173/pizzaria-exemplo
```

Em desenvolvimento o Vite faz proxy de `/api` para `http://localhost:3000` (a API local). Para criar a loja de teste na API:
`npm run migrate:fresh:seed` (na pasta da API) → slug **pizzaria-exemplo**.

## Produção

1. Copie `.env.example` para `.env` e defina `VITE_API_URL` (URL pública da API, sem barra no final).
2. `npm run build` → pasta `dist/`.
3. Publique em Vercel/Netlify (já há `vercel.json` e `public/_redirects` com o fallback de SPA para `/:slug`).
4. A API já libera CORS (`origin: *`).

## Rotas

| Rota | Tela |
|---|---|
| `/` | Início: digitar o endereço da loja + pedidos feitos neste aparelho |
| `/:slug` | Cardápio da loja |
| `/:slug/checkout` | Finalizar pedido |
| `/pedido/:publicId` | Acompanhamento em tempo real (SSE; conferência de segurança a cada 60 s, ou 15 s se a conexão cair) |

## O que tem

- **Cardápio**: cabeçalho da loja com as cores dela (contraste garantido), aberto/fechado + "abre hoje às…", tempo de espera, horários/taxas/pagamentos, busca sem acento, abas de categoria que acompanham a rolagem, selo de quantidade no card.
- **Produto**: variações (tamanho), grupos de opções com as regras da API (obrigatório/opcional, mínimo/máximo, repetir a mesma opção com `+/-`, "cobramos o sabor mais caro" no meio a meio com "incluso"), observação, quantidade e preço ao vivo. Validação aponta e rola até o grupo que falta.
- **Sacola**: salva no aparelho por loja, edita/remove itens, barra fixa no celular e painel lateral no desktop. Itens que saíram do cardápio são removidos com aviso.
- **Checkout**: entrega ou retirada, bairro com taxa, máscara de telefone, pagamento, troco (valida contra o total), lembra seus dados. Erros da API aparecem na tela (loja fechada, item indisponível → "Atualizar cardápio").
- **Acompanhamento**: linha do tempo (entrega ou retirada), cancelado/recusado com o motivo, chave Pix copiável, botão do WhatsApp da loja.
- Loja fechada: dá para ver o cardápio, mas não pedir.

## Preço

`src/lib/pricing.js` repete o cálculo do servidor só para **mostrar** o valor. O cliente nunca envia preço: a API recalcula tudo ao criar o pedido, e a tela de acompanhamento mostra os valores oficiais.

## Testes

```bash
npm test    # preço (meio a meio, adicionais repetidos, "a partir de"), sacola, telefone, dinheiro, horários, cores
```

## Estrutura

```
src/
  api/client.js          fetch + erros da API
  context/StoreContext   cardápio + sacola (localStorage) + avisos
  lib/                   pricing, cart, money, phone, hours, color, orderStatus, storage
  components/            StoreHeader, CategoryNav, ProductCard, ProductSheet, OptionGroup, CartPanel, Sheet…
  pages/                 HomePage, StoreLayout, MenuPage, CheckoutPage, OrderPage, NotFoundPage
tests/
```
