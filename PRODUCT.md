# Product

<!-- impeccable:product-schema 1 -->

## Platform

web

## Users

- **Associados (integradores e instaladores de energia solar do RN):** empresas que pagam mensalidade à FPGD para serem representadas perante a Cosern (Neoenergia) e órgãos reguladores. Entram pelo site, se cadastram como integrador e passam a abrir tickets e acompanhar usinas de seus clientes.
- **Clientes finais de energia solar:** cadastram imóveis/usinas e abrem reclamações quando a compensação de créditos falha.
- **Equipe da FPGD (superadmin e mediador):** administra associados no CRM (funil de adesão, contrato, cobrança), media tickets junto à concessionária e configura integrações.
- **Visitante público:** consulta o Termômetro de Satisfação (`/#/reclame`) e conhece a entidade pelo site.

## Product Purpose

A FPGD (Frente Potiguar de Geração Distribuída) é uma associação de empresas integradoras e instaladoras de energia solar do Rio Grande do Norte. A plataforma existe para (1) dar voz coletiva ao setor diante da Cosern, transformando reclamações individuais em dados públicos (NPS, acordo/desacordo, recursos), e (2) sustentar a associação: captar, contratar e cobrar mensalidades dos associados.

Sucesso: associados adimplentes e crescendo; protocolos sem solução documentados e visíveis; equipe gastando pouco tempo com contrato e cobrança manuais.

## Positioning

É a única frente organizada dos integradores potiguares com um termômetro público de satisfação com a Cosern alimentado pelos próprios tickets dos associados e clientes. A representação é coletiva e baseada em evidência, não em reclamação avulsa.

## Operating Context

- Site público em `https://fpgd.site` (HashRouter, hospedagem estática Hostinger via FTP, CI no GitHub Actions).
- Backend Supabase (Auth, Postgres, Edge Functions) no projeto `ayhbafvvnbwrnfqglklp`.
- Fluxos: cadastro de integrador com busca de CNPJ; cadastro de cliente com dimensionamento solar; tickets com NPS 1–5 por canal (agências, WhatsApp, telefone, portal GD, equipe de campo); Kanban de tickets; usinas/UCs.
- CRM de associados (novo): funil Inscritos → Ativos → Inadimplentes → Inativos → Cancelados, em Kanban e Lista; contrato de adesão gerado no modal do associado; envio para assinatura via Autentique, notificação por WhatsApp (Evolution API) e e-mail (Resend); cobrança recorrente no Asaas.
- Configurações do CRM guardam planos/valores e as credenciais/API keys de Autentique, Evolution, Resend e Asaas.

## Capabilities and Constraints

- Associado = registro em `companies` com `user_type = 'integrador'`, estendido com campos de status, plano, contrato e Asaas (decisão do usuário, 2026-11-19).
- CRM e Configurações acessíveis a `superadmin` e `mediador` (decisão do usuário, 2026-11-19).
- Perfis RBAC: cliente, integrador, mediador, superadmin.
- Escala NPS padronizada 1–5 com cores fixas (ver documentação do projeto); essas cores são semânticas de dado, não de marca.
- Hospedagem estática: toda chamada a serviços terceiros com segredo deve passar por Edge Function, nunca pelo navegador.
- Valores dos planos ainda não definidos: são cadastrados nas Configurações (não inventar preços).

## Brand Commitments

- Nome: FPGD RN — Frente Potiguar de Geração Distribuída.
- Logo existente (hospedado em `b2wenergia.com.br/.../FPGD-LOGO.png`) permanece.
- Redesign completo aprovado (2026-11-19): só o logo fica; paleta, tipografia e linguagem visual podem ser substituídas.
- Idioma: português do Brasil.

## Evidence on Hand

- Pauta oficial da reunião com a Cosern de 03/02/2026 (texto em `src/components/landing/DemandsPDF.tsx`).
- Dados reais de tickets e NPS no Supabase alimentam o Termômetro público.
- Contato: `fpgd.rn@gmail.com`, Natal/RN.
- Não existem: depoimentos, número oficial de associados, preços de planos, logos de parceiros. Não fabricar.

## Product Principles

1. Força coletiva com prova: todo argumento público se apoia nos dados dos tickets.
2. A adesão precisa ser simples para uma pequena empresa: cadastro, contrato e pagamento sem atrito.
3. Operação enxuta: a equipe da FPGD é pequena; automatizar contrato, cobrança e lembretes.
4. Segredos nunca saem do servidor.
