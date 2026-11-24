-- Assinatura eletrônica pelo Documenso (docs.b2wenergia.com.br).
alter table contratos add column if not exists documenso_document_id text;
alter table contratos add column if not exists provedor text not null default 'documenso';
update contratos set provedor = 'autentique' where autentique_document_id is not null;
create index if not exists contratos_documenso_idx on contratos (documenso_document_id);

alter table tenant_contratos add column if not exists documenso_document_id text;
alter table tenant_contratos add column if not exists link_assinatura text;
create index if not exists tenant_contratos_documenso_idx on tenant_contratos (documenso_document_id);
