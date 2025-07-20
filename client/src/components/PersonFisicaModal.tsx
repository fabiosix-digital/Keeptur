import React, { useState, useEffect } from 'react';

interface PersonFisicaModalProps {
  show: boolean;
  onClose: () => void;
  onSubmit: (data: any) => void;
  cities: any[];
  loadCities: () => void;
  loadingCities: boolean;
  savingPerson: boolean;
}

const PersonFisicaModal: React.FC<PersonFisicaModalProps> = ({
  show,
  onClose,
  onSubmit,
  cities,
  loadCities,
  loadingCities,
  savingPerson
}) => {
  const [activeTab, setActiveTab] = useState('dados');

  // Definir abas baseadas na documentação da API do Monde
  const tabs = [
    { id: 'dados', label: 'Dados Pessoais', icon: 'ri-user-line' },
    { id: 'endereco', label: 'Endereço', icon: 'ri-map-pin-line' },
    { id: 'contatos', label: 'Contatos', icon: 'ri-phone-line' },
    { id: 'profissionais', label: 'Dados Profissionais', icon: 'ri-briefcase-line' },
    { id: 'financeiros', label: 'Dados Financeiros', icon: 'ri-bank-card-line' },
    { id: 'relacionamentos', label: 'Relacionamentos', icon: 'ri-team-line' }
  ];

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    const formData = new FormData(e.target as HTMLFormElement);
    
    const personData = {
      // Dados Pessoais
      name: formData.get('name'),
      birthDate: formData.get('birthDate'),
      gender: formData.get('gender'),
      observations: formData.get('observations'),
      
      // Documentos
      cpf: formData.get('cpf'),
      rg: formData.get('rg'),
      passportNumber: formData.get('passportNumber'),
      passportExpiration: formData.get('passportExpiration'),
      
      // Endereço
      address: formData.get('address'),
      number: formData.get('number'),
      complement: formData.get('complement'),
      district: formData.get('district'),
      zip: formData.get('zip'),
      cityId: formData.get('cityId'),
      
      // Contatos
      email: formData.get('email'),
      phone: formData.get('phone'),
      mobilePhone: formData.get('mobilePhone'),
      businessPhone: formData.get('businessPhone'),
      website: formData.get('website'),
      
      // Dados Profissionais
      companyName: formData.get('companyName'),
      jobTitle: formData.get('jobTitle'),
      workAddress: formData.get('workAddress'),
      workPhone: formData.get('workPhone'),
      
      // Dados Financeiros
      salaryRange: formData.get('salaryRange'),
      creditCardNumber: formData.get('creditCardNumber'),
      creditCardHolder: formData.get('creditCardHolder'),
      creditCardExpiry: formData.get('creditCardExpiry'),
      creditCardBrand: formData.get('creditCardBrand'),
      
      // Relacionamentos
      familyMembers: formData.get('familyMembers'),
      
      kind: 'individual'
    };

    onSubmit(personData);
  };

  if (!show) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black bg-opacity-50">
      <div className="bg-white rounded-lg shadow-xl max-w-6xl w-full mx-4 max-h-[90vh] overflow-hidden">
        {/* Header */}
        <div className="p-4 border-b flex justify-between items-center">
          <h2 className="text-xl font-semibold">👤 Cadastrar Pessoa Física</h2>
          <button
            onClick={onClose}
            className="text-gray-500 hover:text-gray-700"
          >
            <i className="ri-close-line text-xl"></i>
          </button>
        </div>

        {/* Abas */}
        <div className="border-b">
          <div className="flex overflow-x-auto">
            {tabs.map((tab) => (
              <button
                key={tab.id}
                onClick={() => setActiveTab(tab.id)}
                className={`flex items-center px-4 py-3 text-sm font-medium whitespace-nowrap border-b-2 transition-colors ${
                  activeTab === tab.id
                    ? 'border-blue-500 text-blue-600 bg-blue-50'
                    : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'
                }`}
              >
                <i className={`${tab.icon} mr-2`}></i>
                {tab.label}
              </button>
            ))}
          </div>
        </div>

        {/* Conteúdo */}
        <form onSubmit={handleSubmit} className="overflow-y-auto max-h-[calc(90vh-160px)]">
          <div className="p-6">
            {/* Aba Dados Pessoais */}
            {activeTab === 'dados' && (
              <div className="space-y-6">
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                  <div className="lg:col-span-2">
                    <label className="block text-sm font-medium mb-2">Nome Completo *</label>
                    <input 
                      name="name" 
                      type="text" 
                      required 
                      className="w-full px-3 py-2 border rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500" 
                    />
                  </div>
                  
                  <div>
                    <label className="block text-sm font-medium mb-2">Data de Nascimento</label>
                    <input 
                      name="birthDate" 
                      type="date" 
                      className="w-full px-3 py-2 border rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500" 
                    />
                  </div>
                  
                  <div>
                    <label className="block text-sm font-medium mb-2">Sexo</label>
                    <select 
                      name="gender" 
                      className="w-full px-3 py-2 border rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                    >
                      <option value="">Selecione</option>
                      <option value="M">Masculino</option>
                      <option value="F">Feminino</option>
                    </select>
                  </div>
                  
                  <div>
                    <label className="block text-sm font-medium mb-2">CPF</label>
                    <input 
                      name="cpf" 
                      type="text" 
                      placeholder="000.000.000-00"
                      className="w-full px-3 py-2 border rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500" 
                    />
                  </div>
                  
                  <div>
                    <label className="block text-sm font-medium mb-2">RG</label>
                    <input 
                      name="rg" 
                      type="text" 
                      className="w-full px-3 py-2 border rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500" 
                    />
                  </div>
                  
                  <div>
                    <label className="block text-sm font-medium mb-2">Passaporte</label>
                    <input 
                      name="passportNumber" 
                      type="text" 
                      className="w-full px-3 py-2 border rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500" 
                    />
                  </div>
                  
                  <div>
                    <label className="block text-sm font-medium mb-2">Validade Passaporte</label>
                    <input 
                      name="passportExpiration" 
                      type="date" 
                      className="w-full px-3 py-2 border rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500" 
                    />
                  </div>
                </div>
                
                <div>
                  <label className="block text-sm font-medium mb-2">Observações</label>
                  <textarea 
                    name="observations" 
                    rows={3}
                    className="w-full px-3 py-2 border rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                  ></textarea>
                </div>
              </div>
            )}

            {/* Aba Endereço */}
            {activeTab === 'endereco' && (
              <div className="space-y-6">
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
                  <div>
                    <label className="block text-sm font-medium mb-2">CEP</label>
                    <input 
                      name="zip" 
                      type="text" 
                      placeholder="00000-000"
                      className="w-full px-3 py-2 border rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500" 
                    />
                  </div>
                  
                  <div className="lg:col-span-2">
                    <label className="block text-sm font-medium mb-2">Endereço</label>
                    <input 
                      name="address" 
                      type="text" 
                      className="w-full px-3 py-2 border rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500" 
                    />
                  </div>
                  
                  <div>
                    <label className="block text-sm font-medium mb-2">Número</label>
                    <input 
                      name="number" 
                      type="text" 
                      className="w-full px-3 py-2 border rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500" 
                    />
                  </div>
                  
                  <div>
                    <label className="block text-sm font-medium mb-2">Complemento</label>
                    <input 
                      name="complement" 
                      type="text" 
                      className="w-full px-3 py-2 border rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500" 
                    />
                  </div>
                  
                  <div>
                    <label className="block text-sm font-medium mb-2">Bairro</label>
                    <input 
                      name="district" 
                      type="text" 
                      className="w-full px-3 py-2 border rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500" 
                    />
                  </div>
                  
                  <div className="lg:col-span-2">
                    <label className="block text-sm font-medium mb-2">Cidade</label>
                    <select 
                      name="cityId" 
                      className="w-full px-3 py-2 border rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500" 
                      onClick={loadCities}
                    >
                      <option value="">Selecione uma cidade</option>
                      {cities.map(city => (
                        <option key={city.id} value={city.id}>{city.attributes.name}</option>
                      ))}
                    </select>
                    {loadingCities && <p className="text-xs text-gray-500 mt-1">Carregando cidades...</p>}
                  </div>
                </div>
              </div>
            )}

            {/* Aba Contatos */}
            {activeTab === 'contatos' && (
              <div className="space-y-6">
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div>
                    <label className="block text-sm font-medium mb-2">E-mail</label>
                    <input 
                      name="email" 
                      type="email" 
                      className="w-full px-3 py-2 border rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500" 
                    />
                  </div>
                  
                  <div>
                    <label className="block text-sm font-medium mb-2">Telefone Residencial</label>
                    <input 
                      name="phone" 
                      type="text" 
                      placeholder="(11) 3333-4444"
                      className="w-full px-3 py-2 border rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500" 
                    />
                  </div>
                  
                  <div>
                    <label className="block text-sm font-medium mb-2">Celular/WhatsApp</label>
                    <input 
                      name="mobilePhone" 
                      type="text" 
                      placeholder="(11) 99999-8888"
                      className="w-full px-3 py-2 border rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500" 
                    />
                  </div>
                  
                  <div>
                    <label className="block text-sm font-medium mb-2">Telefone Comercial</label>
                    <input 
                      name="businessPhone" 
                      type="text" 
                      placeholder="(11) 4444-5555"
                      className="w-full px-3 py-2 border rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500" 
                    />
                  </div>
                  
                  <div className="md:col-span-2">
                    <label className="block text-sm font-medium mb-2">Website Pessoal</label>
                    <input 
                      name="website" 
                      type="url" 
                      placeholder="https://..."
                      className="w-full px-3 py-2 border rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500" 
                    />
                  </div>
                </div>
              </div>
            )}

            {/* Aba Dados Profissionais */}
            {activeTab === 'profissionais' && (
              <div className="space-y-6">
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div>
                    <label className="block text-sm font-medium mb-2">Nome da Empresa</label>
                    <input 
                      name="companyName" 
                      type="text" 
                      className="w-full px-3 py-2 border rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500" 
                    />
                  </div>
                  
                  <div>
                    <label className="block text-sm font-medium mb-2">Cargo/Profissão</label>
                    <input 
                      name="jobTitle" 
                      type="text" 
                      className="w-full px-3 py-2 border rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500" 
                    />
                  </div>
                  
                  <div>
                    <label className="block text-sm font-medium mb-2">Endereço Comercial</label>
                    <input 
                      name="workAddress" 
                      type="text" 
                      className="w-full px-3 py-2 border rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500" 
                    />
                  </div>
                  
                  <div>
                    <label className="block text-sm font-medium mb-2">Telefone Comercial</label>
                    <input 
                      name="workPhone" 
                      type="text" 
                      className="w-full px-3 py-2 border rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500" 
                    />
                  </div>
                </div>
              </div>
            )}

            {/* Aba Dados Financeiros */}
            {activeTab === 'financeiros' && (
              <div className="space-y-6">
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div>
                    <label className="block text-sm font-medium mb-2">Faixa Salarial</label>
                    <select 
                      name="salaryRange" 
                      className="w-full px-3 py-2 border rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                    >
                      <option value="">Selecione</option>
                      <option value="até R$ 2.000">Até R$ 2.000</option>
                      <option value="R$ 2.001 a R$ 5.000">R$ 2.001 a R$ 5.000</option>
                      <option value="R$ 5.001 a R$ 10.000">R$ 5.001 a R$ 10.000</option>
                      <option value="acima de R$ 10.000">Acima de R$ 10.000</option>
                    </select>
                  </div>
                </div>
                
                <div className="border-t pt-4">
                  <h4 className="text-md font-medium mb-4">Dados do Cartão de Crédito</h4>
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <div>
                      <label className="block text-sm font-medium mb-2">Número do Cartão</label>
                      <input 
                        name="creditCardNumber" 
                        type="text" 
                        placeholder="**** **** **** ****"
                        className="w-full px-3 py-2 border rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500" 
                      />
                    </div>
                    
                    <div>
                      <label className="block text-sm font-medium mb-2">Nome do Portador</label>
                      <input 
                        name="creditCardHolder" 
                        type="text" 
                        className="w-full px-3 py-2 border rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500" 
                      />
                    </div>
                    
                    <div>
                      <label className="block text-sm font-medium mb-2">Validade</label>
                      <input 
                        name="creditCardExpiry" 
                        type="month" 
                        className="w-full px-3 py-2 border rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500" 
                      />
                    </div>
                    
                    <div>
                      <label className="block text-sm font-medium mb-2">Bandeira</label>
                      <select 
                        name="creditCardBrand" 
                        className="w-full px-3 py-2 border rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                      >
                        <option value="">Selecione</option>
                        <option value="Visa">Visa</option>
                        <option value="Mastercard">Mastercard</option>
                        <option value="American Express">American Express</option>
                        <option value="Elo">Elo</option>
                      </select>
                    </div>
                  </div>
                </div>
              </div>
            )}

            {/* Aba Relacionamentos */}
            {activeTab === 'relacionamentos' && (
              <div className="space-y-6">
                <div>
                  <label className="block text-sm font-medium mb-2">Membros da Família</label>
                  <textarea 
                    name="familyMembers" 
                    rows={4}
                    placeholder="Nome - Parentesco - Data de nascimento (um por linha)"
                    className="w-full px-3 py-2 border rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                  ></textarea>
                  <p className="text-xs text-gray-500 mt-1">
                    Exemplo: Maria Silva - Esposa - 1990-05-15
                  </p>
                </div>
              </div>
            )}
          </div>

          {/* Footer */}
          <div className="border-t p-4 flex justify-end space-x-3">
            <button
              type="button"
              onClick={onClose}
              className="px-4 py-2 border border-gray-300 rounded-lg hover:bg-gray-50 transition-colors"
            >
              Cancelar
            </button>
            <button 
              type="submit" 
              className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors" 
              disabled={savingPerson}
            >
              {savingPerson ? 'Salvando...' : 'Salvar Pessoa Física'}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};

export default PersonFisicaModal;