---
version: 1
slug: "src-pages-homepage-tsx"
primary_target: "src/pages/HomePage.tsx"
related_targets: ["src/pages/CrmPage.tsx","src/components/AppLayout.tsx"]
---

## Scope
Site público (Persuade: HomePage + landing, login, cadastro, /reclame) e CRM autenticado (Operate: shell, Associados Kanban/Lista, modal do associado, Configurações). Áreas legadas (tickets, usinas, admin) herdam o shell e os tokens.

## Audience and job
Integradores solares do RN decidem se associar; equipe FPGD (superadmin/mediador) opera adesão, contrato e cobrança.

## Direction contract
THESIS: O padrão da categoria executado com a régua do elekeeper (SAJ): portal de energia escuro, preciso, com fotos reais de usinas. Recusa a manchete centralizada sobre foto com fileira de cards.
OWN-WORLD: Azul-marinho profundo (#0B0E17 / painéis #161B27), texto quase branco, um único degradê de energia verde-água→ciano→azul reservado a item ativo e ação primária, brilho suave em cantos de painéis-chave, Manrope com numerais tabulares, painéis raio 16, controles 10, chips pill. Fotos reais de usinas em fileira.
STORY: O visitante entende que a FPGD é a frente organizada dos integradores do RN contra falhas da Cosern, vê a prova (termômetro e pauta) e se associa pelo CNPJ.
FIRST VIEWPORT: Foto de usina ocupando a tela com escurecimento à esquerda; manchete alinhada à esquerda em 2–3 linhas; campo de CNPJ + "Quero me associar" logo abaixo; ação secundária "Registrar reclamação"; à direita, painel flutuante com dados reais do termômetro.
FORM: canon (padrão da categoria, régua elekeeper/SAJ escolhida pelo usuário), seed:f86985d29a77e1c9
FINISH: unreviewed and undocumented is unfinished; this build ends with the finish review, the verdict, DESIGN.md, and every shipping raster carrying its provenance
