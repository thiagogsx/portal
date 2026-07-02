# Monitor de Ofertas — protótipo

Protótipo estático (HTML/CSS/JS puro, sem build) para acompanhar novas ofertas de
equipamentos publicadas em portais como **Petronect** (Petrobras) e, futuramente,
**Vale**. Feito para apresentação interna — hoje funciona com dados de demonstração
e já está estruturado para plugar a API real assim que a chave for liberada.

## Estrutura

```
index.html        página única do dashboard
css/style.css      estilos
js/app.js          dados, filtros e ponto de integração com a API
```

## Rodando localmente

Não precisa de build nem instalação. Basta abrir `index.html` no navegador, ou,
para evitar restrições de `file://`, subir um servidor simples:

```bash
python3 -m http.server 8080
# depois acesse http://localhost:8080
```

## Publicando no GitHub Pages

1. Crie o repositório (ex: `thiagogsx/monitor-ofertas`) e suba estes arquivos.
2. No GitHub: **Settings → Pages → Source**, selecione a branch `main` e a pasta `/root`.
3. Em alguns minutos o link ficará disponível em
   `https://thiagogsx.github.io/monitor-ofertas/`.

## Sobre a chave de API — leia antes de conectar a chave real

Este protótipo é hospedado como página **estática**. Qualquer chave colocada no
JavaScript do navegador fica visível para quem abrir o link e inspecionar o
código-fonte — não existe forma de esconder isso só com HTML/CSS/JS. Além disso,
portais corporativos como Petronect normalmente bloqueiam chamadas diretas do
navegador (CORS).

Duas opções quando a chave chegar:

- **Para a apresentação/demo interna:** manter o modo demonstração (já é o padrão)
  ou fazer chamadas manuais à API por fora (Postman/script) e colar os resultados
  como dados de exemplo — sem nunca colocar a chave no código publicado.
- **Para uso real, com dados ao vivo:** criar um pequeno backend (Node, Python,
  ou uma função serverless — Vercel/Cloudflare Workers/AWS Lambda são gratuitos
  para esse volume) que guarda a chave em variável de ambiente e repassa as
  requisições para o portal. O front-end passa a chamar esse backend, nunca o
  portal diretamente. O arquivo `js/app.js` já tem a função `buscarOfertasReais()`
  isolada e comentada, pronta para apontar para esse backend assim que ele existir.

## Formato de dados esperado

Cada oferta segue este formato (contrato entre a API e a interface):

```js
{
  codigo: "PTN-48213",
  equipamento: "Bomba centrífuga API 610 8x10",
  categoria: "Bombas centrífugas",
  portal: "Petronect", // ou "Vale"
  publicadoEm: "2026-06-30",
  encerraEm: "2026-07-14",
  valorEstimado: 842000,
  status: "aberta", // "aberta" | "encerrando" | "encerrada"
  url: "https://..."
}
```

Quando a API da Petronect (ou da Vale) estiver disponível, ajuste o `.map(...)`
dentro de `buscarOfertasReais()` em `js/app.js` para converter a resposta real
nesse formato — o resto da interface (tabela, filtros, cartões de resumo) não
precisa mudar.

## Próximos passos sugeridos

- [ ] Adicionar portal Vale como segunda fonte quando a integração existir
- [ ] Exportar tabela filtrada para Excel/CSV
- [ ] Notificação (e-mail/Slack/Teams) quando uma oferta nova bater critérios definidos
- [ ] Histórico de ofertas encerradas para análise de preço médio por categoria
