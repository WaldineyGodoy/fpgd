import React from 'react';
import { useTenant } from './useTenant';
import TenantHeader from './TenantHeader';
import TenantConfigPanel from './TenantConfigPanel';

const MeuCrmConfigPage: React.FC = () => {
  const tenant = useTenant();
  if (!tenant.companyId) return null;
  return (
    <div className="max-w-[880px]">
      <TenantHeader tenant={tenant} title="Configurações"
        description="Sua marca e as credenciais da sua empresa: WhatsApp, e-mail, cobrança, contrato, assistente de IA e conexão MCP. Nada disso é compartilhado com outros associados." />
      <TenantConfigPanel companyId={tenant.companyId} initialOpen="marca" onSaved={(k) => { if (k === 'marca') tenant.reloadMarca(); }} />
    </div>
  );
};

export default MeuCrmConfigPage;
