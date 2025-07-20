import React, { useState, useCallback, useRef } from 'react';

interface ClientSearchFieldProps {
  value: string;
  onChange: (value: string) => void;
  onSelect: (client: any) => void;
  results: any[];
  isSearching: boolean;
  placeholder?: string;
  readonly?: boolean;
}

const ClientSearchField: React.FC<ClientSearchFieldProps> = ({
  value,
  onChange,
  onSelect,
  results,
  isSearching,
  placeholder = "Digite para buscar cliente...",
  readonly = false
}) => {
  const [showDropdown, setShowDropdown] = useState(false);
  const searchTimeoutRef = useRef<NodeJS.Timeout | null>(null);

  const handleInputChange = useCallback((e: React.ChangeEvent<HTMLInputElement>) => {
    const inputValue = e.target.value;
    onChange(inputValue);
    
    // Clear previous timeout
    if (searchTimeoutRef.current) {
      clearTimeout(searchTimeoutRef.current);
    }

    // Set new timeout with optimized 300ms debounce
    searchTimeoutRef.current = setTimeout(() => {
      if (inputValue.length >= 2) {
        // Trigger search through parent component
      }
    }, 300);
  }, [onChange]);

  const handleClientSelect = (client: any) => {
    onSelect(client);
    setShowDropdown(false);
  };

  if (readonly) {
    return (
      <input
        type="text"
        className="form-input w-full px-3 py-2 text-sm bg-gray-100"
        value={value}
        readOnly
      />
    );
  }

  return (
    <div className="relative">
      <input
        type="text"
        placeholder=""
        className="form-input w-full px-3 py-2 pr-10 text-sm border rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
        value={value}
        onChange={handleInputChange}
      />
      
      {/* Ícone corrigido - agora está dentro do campo */}
      <button
        type="button"
        onClick={() => setShowDropdown(!showDropdown)}
        className="absolute right-2 top-1/2 transform -translate-y-1/2 text-blue-600 hover:text-blue-800 z-10"
        title="Buscar ou cadastrar cliente"
      >
        <i className="ri-user-add-line text-lg"></i>
      </button>

      {/* Dropdown de opções de cadastro */}
      {showDropdown && (
        <div className="absolute right-0 top-full mt-1 z-50 bg-white border border-gray-200 rounded-lg shadow-lg py-2 min-w-[200px]">
          <button
            type="button"
            onClick={() => {
              // Trigger através de evento customizado
              window.dispatchEvent(new CustomEvent('openPersonFisicaModal'));
              setShowDropdown(false);
            }}
            className="w-full text-left px-4 py-2 hover:bg-blue-50 flex items-center"
          >
            <i className="ri-user-add-line text-blue-600 mr-3"></i>
            Nova Pessoa Física
          </button>
          <button
            type="button"
            onClick={() => {
              // Trigger através de evento customizado
              window.dispatchEvent(new CustomEvent('openPersonJuridicaModal'));
              setShowDropdown(false);
            }}
            className="w-full text-left px-4 py-2 hover:bg-blue-50 flex items-center"
          >
            <i className="ri-building-line text-blue-600 mr-3"></i>
            Nova Pessoa Jurídica
          </button>
          <button
            type="button"
            onClick={() => {
              // Trigger através de evento customizado
              window.dispatchEvent(new CustomEvent('openSearchModal'));
              setShowDropdown(false);
            }}
            className="w-full text-left px-4 py-2 hover:bg-blue-50 flex items-center"
          >
            <i className="ri-search-line text-blue-600 mr-3"></i>
            Buscar Existente
          </button>
        </div>
      )}

      {/* Dropdown de resultados */}
      {results.length > 0 && (
        <div className="absolute z-40 w-full mt-1 bg-white border rounded-lg shadow-lg max-h-60 overflow-y-auto">
          {results.map((client: any) => (
            <div
              key={client.id}
              className="px-3 py-2 hover:bg-gray-100 cursor-pointer text-sm border-b"
              onClick={() => handleClientSelect(client)}
            >
              <div className="font-medium">
                {client.attributes.name || client.attributes['company-name']}
              </div>
              <div className="text-xs text-gray-500">
                {client.attributes.cpf && `CPF: ${client.attributes.cpf}`}
                {client.attributes.cnpj && `CNPJ: ${client.attributes.cnpj}`}
                {client.attributes.email && ` • ${client.attributes.email}`}
                {client.attributes.phone && ` • ${client.attributes.phone}`}
              </div>
            </div>
          ))}
        </div>
      )}

      {/* Loading indicator */}
      {isSearching && (
        <div className="absolute z-40 w-full mt-1 bg-white border rounded-lg shadow-lg p-3 text-sm text-center">
          <i className="ri-loader-4-line animate-spin mr-2"></i>
          Buscando clientes...
        </div>
      )}
    </div>
  );
};

export default ClientSearchField;