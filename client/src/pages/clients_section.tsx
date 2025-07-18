import { useState, useEffect } from 'react';

interface Client {
  id: string;
  attributes: {
    name: string;
    kind: 'individual' | 'company';
    email?: string;
    phone?: string;
    'mobile-phone'?: string;
    cpf?: string;
    cnpj?: string;
    city?: string;
    state?: string;
    'company-name'?: string;
    'registered-at'?: string;
  };
}

interface ClientsSectionProps {
  searchedClients: Client[];
  clientFilter: string;
  clientTypeFilter: string;
  clientMarkerFilter: string;
  clientSearchTerm: string;
  clientFieldFilter: string;
  listViewMode: boolean;
  setClientFilter: (value: string) => void;
  setClientTypeFilter: (value: string) => void;
  setClientMarkerFilter: (value: string) => void;
  setClientSearchTerm: (value: string) => void;
  setClientFieldFilter: (value: string) => void;
  setSearchedClients: (clients: Client[]) => void;
  setSelectedClientForModal: (client: Client | null) => void;
  setShowClientModal: (show: boolean) => void;
  setListViewMode: (mode: boolean) => void;
}

export const ClientsSection = ({
  searchedClients,
  clientFilter,
  clientTypeFilter,
  clientMarkerFilter,
  clientSearchTerm,
  clientFieldFilter,
  listViewMode,
  setClientFilter,
  setClientTypeFilter,
  setClientMarkerFilter,
  setClientSearchTerm,
  setClientFieldFilter,
  setSearchedClients,
  setSelectedClientForModal,
  setShowClientModal,
  setListViewMode
}: ClientsSectionProps) => {
  const [stats, setStats] = useState({
    totalClients: 0,
    individualClients: 0,
    companyClients: 0,
    recentClients: 0,
  });

  // Estatísticas de clientes
  useEffect(() => {
    const fetchStats = async () => {
      try {
        const response = await fetch('/api/clients/stats');
        if (response.ok) {
          const data = await response.json();
          setStats(data);
        }
      } catch (error) {
        console.error('Erro ao carregar estatísticas:', error);
      }
    };

    fetchStats();
  }, []);

  // Busca de clientes
  useEffect(() => {
    const searchClients = async () => {
      if (!clientSearchTerm.trim()) {
        setSearchedClients([]);
        return;
      }

      try {
        const params = new URLSearchParams({
          search: clientSearchTerm,
          ...(clientTypeFilter && { kind: clientTypeFilter }),
          ...(clientFieldFilter && { field: clientFieldFilter }),
          ...(clientMarkerFilter && { marker: clientMarkerFilter }),
        });

        const response = await fetch(`/api/clients/search?${params}`);
        if (response.ok) {
          const data = await response.json();
          setSearchedClients(data.data || []);
        }
      } catch (error) {
        console.error('Erro ao buscar clientes:', error);
      }
    };

    const timeoutId = setTimeout(searchClients, 300);
    return () => clearTimeout(timeoutId);
  }, [clientSearchTerm, clientTypeFilter, clientFieldFilter, clientMarkerFilter]);

  return (
    <div className="space-y-6">
      {/* Estatísticas de Clientes */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
        <div className="stats-card p-4 rounded-lg border">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm" style={{ color: "var(--text-secondary)" }}>Total de Clientes</p>
              <p className="text-2xl font-bold" style={{ color: "var(--text-primary)" }}>
                {stats.totalClients}
              </p>
            </div>
            <div className="w-12 h-12 rounded-full bg-blue-100 flex items-center justify-center">
              <i className="ri-user-line text-blue-600 text-xl"></i>
            </div>
          </div>
        </div>

        <div className="stats-card p-4 rounded-lg border">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm" style={{ color: "var(--text-secondary)" }}>Pessoa Física</p>
              <p className="text-2xl font-bold" style={{ color: "var(--text-primary)" }}>
                {stats.individualClients}
              </p>
            </div>
            <div className="w-12 h-12 rounded-full bg-green-100 flex items-center justify-center">
              <i className="ri-user-line text-green-600 text-xl"></i>
            </div>
          </div>
        </div>

        <div className="stats-card p-4 rounded-lg border">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm" style={{ color: "var(--text-secondary)" }}>Pessoa Jurídica</p>
              <p className="text-2xl font-bold" style={{ color: "var(--text-primary)" }}>
                {stats.companyClients}
              </p>
            </div>
            <div className="w-12 h-12 rounded-full bg-purple-100 flex items-center justify-center">
              <i className="ri-building-line text-purple-600 text-xl"></i>
            </div>
          </div>
        </div>

        <div className="stats-card p-4 rounded-lg border">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm" style={{ color: "var(--text-secondary)" }}>Novos (30d)</p>
              <p className="text-2xl font-bold" style={{ color: "var(--text-primary)" }}>
                {stats.recentClients}
              </p>
            </div>
            <div className="w-12 h-12 rounded-full bg-orange-100 flex items-center justify-center">
              <i className="ri-user-add-line text-orange-600 text-xl"></i>
            </div>
          </div>
        </div>
      </div>

      {/* Filtros de Busca */}
      <div className="bg-white dark:bg-gray-800 rounded-lg p-4 border">
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-5 gap-4 mb-4">
          {/* Tipo de Cliente */}
          <div>
            <label className="block text-sm font-medium mb-2" style={{ color: "var(--text-secondary)" }}>
              Tipo de Cliente
            </label>
            <select
              value={clientTypeFilter}
              onChange={(e) => setClientTypeFilter(e.target.value)}
              className="w-full p-2 border rounded-md text-sm"
            >
              <option value="">Todos</option>
              <option value="individual">Pessoa Física</option>
              <option value="company">Pessoa Jurídica</option>
            </select>
          </div>

          {/* Campo de Busca */}
          <div>
            <label className="block text-sm font-medium mb-2" style={{ color: "var(--text-secondary)" }}>
              Buscar em
            </label>
            <select
              value={clientFieldFilter}
              onChange={(e) => setClientFieldFilter(e.target.value)}
              className="w-full p-2 border rounded-md text-sm"
            >
              <option value="">Todos os campos</option>
              <option value="name">Nome</option>
              <option value="email">E-mail</option>
              <option value="phone">Telefone</option>
              <option value="cpf">CPF</option>
              <option value="cnpj">CNPJ</option>
              <option value="city">Cidade</option>
            </select>
          </div>

          {/* Marcador */}
          <div>
            <label className="block text-sm font-medium mb-2" style={{ color: "var(--text-secondary)" }}>
              Marcador
            </label>
            <select
              value={clientMarkerFilter}
              onChange={(e) => setClientMarkerFilter(e.target.value)}
              className="w-full p-2 border rounded-md text-sm"
            >
              <option value="">Todos</option>
              <option value="active">Ativo</option>
              <option value="inactive">Inativo</option>
              <option value="premium">Premium</option>
            </select>
          </div>

          {/* Busca por Texto */}
          <div>
            <label className="block text-sm font-medium mb-2" style={{ color: "var(--text-secondary)" }}>
              Buscar por
            </label>
            <input
              type="text"
              value={clientSearchTerm}
              onChange={(e) => setClientSearchTerm(e.target.value)}
              placeholder="Nome, CPF, CNPJ, telefone..."
              className="w-full p-2 border rounded-md text-sm"
            />
          </div>

          {/* Botão Limpar */}
          <div className="flex items-end">
            <button
              onClick={() => {
                setClientFilter("");
                setClientTypeFilter("");
                setClientMarkerFilter("");
                setClientSearchTerm("");
                setClientFieldFilter("");
                setSearchedClients([]);
              }}
              className="action-button px-4 py-2 rounded-lg text-sm font-medium w-full"
            >
              <i className="ri-close-line mr-2"></i>
              Limpar Filtros
            </button>
          </div>
        </div>

        {/* Controles de Visualização */}
        <div className="flex items-center justify-between border-t pt-4">
          <div className="flex items-center space-x-2">
            <span className="text-sm" style={{ color: "var(--text-secondary)" }}>
              Visualização:
            </span>
            <button
              onClick={() => setListViewMode(true)}
              className={`p-2 rounded ${listViewMode ? 'bg-blue-100 text-blue-600' : 'text-gray-400'}`}
            >
              <i className="ri-list-check text-lg"></i>
            </button>
            <button
              onClick={() => setListViewMode(false)}
              className={`p-2 rounded ${!listViewMode ? 'bg-blue-100 text-blue-600' : 'text-gray-400'}`}
            >
              <i className="ri-grid-line text-lg"></i>
            </button>
          </div>

          <button
            onClick={() => setShowClientModal(true)}
            className="action-button px-4 py-2 rounded-lg text-sm font-medium"
          >
            <i className="ri-user-add-line mr-2"></i>
            Novo Cliente
          </button>
        </div>
      </div>

      {/* Mensagem inicial quando não há busca */}
      {searchedClients.length === 0 && (
        <div className="text-center py-16" style={{ color: "var(--text-secondary)" }}>
          <i className="ri-search-line text-6xl text-gray-400 mb-4"></i>
          <h3 className="text-lg font-semibold mb-2">Digite para buscar clientes</h3>
          <p className="text-sm">
            Use os filtros acima para encontrar clientes por nome, CPF, CNPJ ou telefone.
          </p>
          <p className="text-sm text-gray-500 mt-2">
            Todos os dados são carregados diretamente da API do Monde.
          </p>
        </div>
      )}

      {/* Resultados da busca */}
      {searchedClients.length > 0 && (
        <div className="space-y-4">
          <div className="flex items-center justify-between">
            <p className="text-sm" style={{ color: "var(--text-secondary)" }}>
              {searchedClients.length} cliente{searchedClients.length !== 1 ? 's' : ''} encontrado{searchedClients.length !== 1 ? 's' : ''}
            </p>
          </div>

          {/* Visualização em Lista */}
          {listViewMode ? (
            <div className="overflow-x-auto">
              <table className="w-full">
                <thead>
                  <tr className="table-row">
                    <th className="text-left py-3 px-4 font-medium text-sm" style={{ color: "var(--text-secondary)" }}>
                      Cliente
                    </th>
                    <th className="text-left py-3 px-4 font-medium text-sm" style={{ color: "var(--text-secondary)" }}>
                      E-mail
                    </th>
                    <th className="text-left py-3 px-4 font-medium text-sm" style={{ color: "var(--text-secondary)" }}>
                      Telefone
                    </th>
                    <th className="text-left py-3 px-4 font-medium text-sm" style={{ color: "var(--text-secondary)" }}>
                      Celular
                    </th>
                    <th className="text-left py-3 px-4 font-medium text-sm" style={{ color: "var(--text-secondary)" }}>
                      Cidade
                    </th>
                    <th className="text-left py-3 px-4 font-medium text-sm" style={{ color: "var(--text-secondary)" }}>
                      UF
                    </th>
                    <th className="text-right py-3 px-4 font-medium text-sm" style={{ color: "var(--text-secondary)" }}>
                      Ações
                    </th>
                  </tr>
                </thead>
                <tbody>
                  {searchedClients.map((client) => (
                    <tr key={client.id} className="table-row">
                      <td className="py-4 px-4">
                        <div className="flex items-center">
                          <div className="w-10 h-10 rounded-full client-avatar flex items-center justify-center text-white font-medium text-sm mr-3">
                            {client.attributes.name?.charAt(0)?.toUpperCase() || 'C'}
                          </div>
                          <div>
                            <p className="font-medium text-sm" style={{ color: "var(--text-primary)" }}>
                              {client.attributes.name}
                            </p>
                            <p className="text-xs" style={{ color: "var(--text-tertiary)" }}>
                              {client.attributes.kind === 'individual' ? 'Pessoa Física' : 'Pessoa Jurídica'}
                            </p>
                          </div>
                        </div>
                      </td>
                      <td className="py-4 px-4">
                        <p className="text-sm" style={{ color: "var(--text-secondary)" }}>
                          {client.attributes.email || '-'}
                        </p>
                      </td>
                      <td className="py-4 px-4">
                        <p className="text-sm" style={{ color: "var(--text-secondary)" }}>
                          {client.attributes.phone || '-'}
                        </p>
                      </td>
                      <td className="py-4 px-4">
                        <p className="text-sm" style={{ color: "var(--text-secondary)" }}>
                          {client.attributes['mobile-phone'] || '-'}
                        </p>
                      </td>
                      <td className="py-4 px-4">
                        <p className="text-sm" style={{ color: "var(--text-secondary)" }}>
                          {client.attributes.city || '-'}
                        </p>
                      </td>
                      <td className="py-4 px-4">
                        <p className="text-sm" style={{ color: "var(--text-secondary)" }}>
                          {client.attributes.state || '-'}
                        </p>
                      </td>
                      <td className="py-4 px-4 text-right">
                        <div className="flex items-center justify-end space-x-2">
                          <button
                            onClick={() => {
                              setSelectedClientForModal(client);
                              setShowClientModal(true);
                            }}
                            className="action-button p-1 rounded"
                          >
                            <i className="ri-eye-line text-sm"></i>
                          </button>
                          <button
                            onClick={() => {
                              setSelectedClientForModal(client);
                              setShowClientModal(true);
                            }}
                            className="action-button p-1 rounded"
                          >
                            <i className="ri-edit-line text-sm"></i>
                          </button>
                        </div>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          ) : (
            /* Visualização em Cards */
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
              {searchedClients.map((client) => (
                <div key={client.id} className="card p-4 rounded-lg border">
                  <div className="flex items-start justify-between mb-3">
                    <div className="flex-1">
                      <h4 className="font-semibold text-sm mb-1" style={{ color: "var(--text-primary)" }}>
                        {client.attributes.name}
                      </h4>
                      {client.attributes['company-name'] && (
                        <p className="text-xs text-gray-500 mb-1">
                          {client.attributes['company-name']}
                        </p>
                      )}
                      <p className="text-xs mb-2" style={{ color: "var(--text-tertiary)" }}>
                        {client.attributes.kind === 'individual' ? 'Pessoa Física' : 'Pessoa Jurídica'}
                      </p>
                    </div>
                    <div className="flex items-center space-x-2">
                      <button
                        onClick={() => {
                          setSelectedClientForModal(client);
                          setShowClientModal(true);
                        }}
                        className="action-button p-1 rounded"
                      >
                        <i className="ri-eye-line text-sm"></i>
                      </button>
                      <button
                        onClick={() => {
                          setSelectedClientForModal(client);
                          setShowClientModal(true);
                        }}
                        className="action-button p-1 rounded"
                      >
                        <i className="ri-edit-line text-sm"></i>
                      </button>
                    </div>
                  </div>
                  <div className="space-y-2">
                    {client.attributes.email && (
                      <div className="flex items-center text-xs" style={{ color: "var(--text-secondary)" }}>
                        <i className="ri-mail-line mr-2"></i>
                        {client.attributes.email}
                      </div>
                    )}
                    {client.attributes.phone && (
                      <div className="flex items-center text-xs" style={{ color: "var(--text-secondary)" }}>
                        <i className="ri-phone-line mr-2"></i>
                        {client.attributes.phone}
                      </div>
                    )}
                    {client.attributes['mobile-phone'] && (
                      <div className="flex items-center text-xs" style={{ color: "var(--text-secondary)" }}>
                        <i className="ri-smartphone-line mr-2"></i>
                        {client.attributes['mobile-phone']}
                      </div>
                    )}
                    {client.attributes.cpf && (
                      <div className="flex items-center text-xs" style={{ color: "var(--text-secondary)" }}>
                        <i className="ri-user-line mr-2"></i>
                        CPF: {client.attributes.cpf}
                      </div>
                    )}
                    {client.attributes.cnpj && (
                      <div className="flex items-center text-xs" style={{ color: "var(--text-secondary)" }}>
                        <i className="ri-building-line mr-2"></i>
                        CNPJ: {client.attributes.cnpj}
                      </div>
                    )}
                    {client.attributes.city && (
                      <div className="flex items-center text-xs" style={{ color: "var(--text-secondary)" }}>
                        <i className="ri-map-pin-line mr-2"></i>
                        {client.attributes.city}{client.attributes.state && ` - ${client.attributes.state}`}
                      </div>
                    )}
                    {client.attributes['registered-at'] && (
                      <div className="flex items-center text-xs text-gray-500">
                        <i className="ri-calendar-line mr-2"></i>
                        Cadastrado em {new Date(client.attributes['registered-at']).toLocaleDateString('pt-BR')}
                      </div>
                    )}
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      )}
    </div>
  );
};