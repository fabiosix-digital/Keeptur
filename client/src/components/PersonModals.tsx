interface PersonModalProps {
  showPersonFisicaModal: boolean;
  setShowPersonFisicaModal: (show: boolean) => void;
  showPersonJuridicaModal: boolean;
  setShowPersonJuridicaModal: (show: boolean) => void;
  submitPersonFisica: (e: React.FormEvent) => void;
  submitPersonJuridica: (e: React.FormEvent) => void;
  savingPerson: boolean;
  cities: any[];
  companies: any[];
  users: any[];
}

export const PersonModals = ({
  showPersonFisicaModal,
  setShowPersonFisicaModal,
  showPersonJuridicaModal,
  setShowPersonJuridicaModal,
  submitPersonFisica,
  submitPersonJuridica,
  savingPerson,
  cities,
  companies,
  users
}: PersonModalProps) => {
  return (
    <>
      {/* Modal Pessoa Física - Layout Ultra Compacto */}
      {showPersonFisicaModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black bg-opacity-50 p-4">
          <div className="bg-white rounded-lg shadow-xl max-w-6xl w-full max-h-[90vh] overflow-hidden">
            <div className="p-3 border-b flex justify-between items-center">
              <h2 className="text-lg font-semibold">👤 Cadastrar Pessoa Física</h2>
              <button
                onClick={() => setShowPersonFisicaModal(false)}
                className="text-gray-500 hover:text-gray-700"
              >
                <i className="ri-close-line text-xl"></i>
              </button>
            </div>
            
            <form onSubmit={submitPersonFisica} className="overflow-y-auto max-h-[calc(90vh-100px)]">
              <div className="p-3 space-y-3">
                {/* Dados Pessoais */}
                <div className="grid grid-cols-8 gap-2">
                  <div className="col-span-4">
                    <label className="block text-xs font-medium mb-1">Nome: *</label>
                    <input name="name" type="text" required className="w-full px-2 py-1 text-xs border rounded" />
                  </div>
                  <div>
                    <label className="block text-xs font-medium mb-1">Sexo:</label>
                    <select name="sex" className="w-full px-2 py-1 text-xs border rounded">
                      <option value="">Selecione</option>
                      <option value="M">Masculino</option>
                      <option value="F">Feminino</option>
                    </select>
                  </div>
                  <div>
                    <label className="block text-xs font-medium mb-1">CPF: *</label>
                    <input name="cpf" type="text" required className="w-full px-2 py-1 text-xs border rounded" />
                  </div>
                  <div>
                    <label className="block text-xs font-medium mb-1">RG:</label>
                    <input name="rg" type="text" className="w-full px-2 py-1 text-xs border rounded" />
                  </div>
                  <div className="flex items-center mt-5">
                    <input name="foreign" type="checkbox" id="estrangeiro-pf" className="mr-1" />
                    <label htmlFor="estrangeiro-pf" className="text-xs">Estrangeiro</label>
                  </div>
                </div>

                {/* Documentos e Datas */}
                <div className="grid grid-cols-6 gap-2">
                  <div>
                    <label className="block text-xs font-medium mb-1">Data Nascimento:</label>
                    <input name="birthDate" type="date" className="w-full px-2 py-1 text-xs border rounded" />
                  </div>
                  <div>
                    <label className="block text-xs font-medium mb-1">Passaporte:</label>
                    <input name="passportNumber" type="text" className="w-full px-2 py-1 text-xs border rounded" />
                  </div>
                  <div>
                    <label className="block text-xs font-medium mb-1">Validade Pass.:</label>
                    <input name="passportExpiration" type="date" className="w-full px-2 py-1 text-xs border rounded" />
                  </div>
                  <div className="col-span-2">
                    <label className="block text-xs font-medium mb-1">Website:</label>
                    <input name="website" type="url" className="w-full px-2 py-1 text-xs border rounded" />
                  </div>
                  <div>
                    <label className="block text-xs font-medium mb-1">UF:</label>
                    <select name="state" className="w-full px-2 py-1 text-xs border rounded">
                      <option value="">UF</option>
                      <option value="SP">SP</option>
                      <option value="RJ">RJ</option>
                      <option value="MG">MG</option>
                      <option value="RS">RS</option>
                    </select>
                  </div>
                </div>

                {/* Endereço */}
                <div className="grid grid-cols-8 gap-2">
                  <div className="col-span-3">
                    <label className="block text-xs font-medium mb-1">Endereço:</label>
                    <input name="address" type="text" className="w-full px-2 py-1 text-xs border rounded" />
                  </div>
                  <div>
                    <label className="block text-xs font-medium mb-1">Número:</label>
                    <input name="number" type="text" className="w-full px-2 py-1 text-xs border rounded" />
                  </div>
                  <div>
                    <label className="block text-xs font-medium mb-1">CEP:</label>
                    <input name="zip" type="text" className="w-full px-2 py-1 text-xs border rounded" />
                  </div>
                  <div className="col-span-2">
                    <label className="block text-xs font-medium mb-1">Complemento:</label>
                    <input name="complement" type="text" className="w-full px-2 py-1 text-xs border rounded" />
                  </div>
                  <div>
                    <label className="block text-xs font-medium mb-1">Bairro:</label>
                    <input name="district" type="text" className="w-full px-2 py-1 text-xs border rounded" />
                  </div>
                  <div className="col-span-2">
                    <label className="block text-xs font-medium mb-1">Cidade:</label>
                    <select name="cityId" className="w-full px-2 py-1 text-xs border rounded">
                      <option value="">Selecione</option>
                      {cities.map((city: any) => (
                        <option key={city.id} value={city.id}>{city.attributes.name}</option>
                      ))}
                    </select>
                  </div>
                </div>

                {/* Contato */}
                <div className="grid grid-cols-6 gap-2">
                  <div>
                    <label className="block text-xs font-medium mb-1">Telefone:</label>
                    <input name="phone" type="text" className="w-full px-2 py-1 text-xs border rounded" />
                  </div>
                  <div>
                    <label className="block text-xs font-medium mb-1">Celular:</label>
                    <input name="mobilePhone" type="text" className="w-full px-2 py-1 text-xs border rounded" />
                  </div>
                  <div>
                    <label className="block text-xs font-medium mb-1">Tel. Comercial:</label>
                    <input name="businessPhone" type="text" className="w-full px-2 py-1 text-xs border rounded" />
                  </div>
                  <div className="col-span-3">
                    <label className="block text-xs font-medium mb-1">E-mail:</label>
                    <input name="email" type="email" className="w-full px-2 py-1 text-xs border rounded" />
                  </div>
                </div>

                {/* Dados Profissionais */}
                <div className="grid grid-cols-3 gap-2">
                  <div>
                    <label className="block text-xs font-medium mb-1">Empresa:</label>
                    <select name="companyId" className="w-full px-2 py-1 text-xs border rounded">
                      <option value="">Selecione</option>
                      {companies.map((company: any) => (
                        <option key={company.id} value={company.id}>{company.attributes.name}</option>
                      ))}
                    </select>
                  </div>
                  <div>
                    <label className="block text-xs font-medium mb-1">Vendedor:</label>
                    <select name="vendorId" className="w-full px-2 py-1 text-xs border rounded">
                      <option value="">Selecione</option>
                      {users.map((user: any) => (
                        <option key={user.id} value={user.id}>{user.attributes.name}</option>
                      ))}
                    </select>
                  </div>
                  <div>
                    <label className="block text-xs font-medium mb-1">Observações:</label>
                    <textarea name="observations" rows={2} className="w-full px-2 py-1 text-xs border rounded"></textarea>
                  </div>
                </div>
              </div>
              
              <div className="flex justify-end space-x-2 mt-3 p-3 border-t">
                <button
                  type="button"
                  onClick={() => setShowPersonFisicaModal(false)}
                  className="px-3 py-1.5 text-xs border border-gray-300 rounded hover:bg-gray-50"
                >
                  Cancelar
                </button>
                <button type="submit" className="px-3 py-1.5 text-xs bg-blue-600 text-white rounded hover:bg-blue-700" disabled={savingPerson}>
                  {savingPerson ? 'Salvando...' : 'Salvar'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Modal Pessoa Jurídica - Layout Ultra Compacto */}
      {showPersonJuridicaModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black bg-opacity-50 p-4">
          <div className="bg-white rounded-lg shadow-xl max-w-6xl w-full max-h-[90vh] overflow-hidden">
            <div className="p-3 border-b flex justify-between items-center">
              <h2 className="text-lg font-semibold">🏢 Cadastrar Pessoa Jurídica</h2>
              <button
                onClick={() => setShowPersonJuridicaModal(false)}
                className="text-gray-500 hover:text-gray-700"
              >
                <i className="ri-close-line text-xl"></i>
              </button>
            </div>
            
            <form onSubmit={submitPersonJuridica} className="overflow-y-auto max-h-[calc(90vh-100px)]">
              <div className="p-3 space-y-3">
                {/* Dados da Empresa */}
                <div className="grid grid-cols-6 gap-2">
                  <div className="col-span-3">
                    <label className="block text-xs font-medium mb-1">Razão Social: *</label>
                    <input name="companyName" type="text" required className="w-full px-2 py-1 text-xs border rounded" />
                  </div>
                  <div className="col-span-2">
                    <label className="block text-xs font-medium mb-1">Nome Fantasia:</label>
                    <input name="tradeName" type="text" className="w-full px-2 py-1 text-xs border rounded" />
                  </div>
                  <div>
                    <label className="block text-xs font-medium mb-1">CNPJ: *</label>
                    <input name="cnpj" type="text" required className="w-full px-2 py-1 text-xs border rounded" />
                  </div>
                </div>

                {/* Documentos e Inscrições */}
                <div className="grid grid-cols-6 gap-2">
                  <div>
                    <label className="block text-xs font-medium mb-1">Insc. Estadual:</label>
                    <input name="stateInscription" type="text" className="w-full px-2 py-1 text-xs border rounded" />
                  </div>
                  <div>
                    <label className="block text-xs font-medium mb-1">Insc. Municipal:</label>
                    <input name="cityInscription" type="text" className="w-full px-2 py-1 text-xs border rounded" />
                  </div>
                  <div className="col-span-2">
                    <label className="block text-xs font-medium mb-1">Website:</label>
                    <input name="website" type="url" className="w-full px-2 py-1 text-xs border rounded" />
                  </div>
                  <div>
                    <label className="block text-xs font-medium mb-1">UF:</label>
                    <select name="state" className="w-full px-2 py-1 text-xs border rounded">
                      <option value="">UF</option>
                      <option value="SP">SP</option>
                      <option value="RJ">RJ</option>
                      <option value="MG">MG</option>
                      <option value="RS">RS</option>
                    </select>
                  </div>
                  <div className="flex items-center mt-5">
                    <input name="foreign" type="checkbox" id="estrangeiro-pj" className="mr-1" />
                    <label htmlFor="estrangeiro-pj" className="text-xs">Estrangeiro</label>
                  </div>
                </div>

                {/* Endereço */}
                <div className="grid grid-cols-8 gap-2">
                  <div className="col-span-3">
                    <label className="block text-xs font-medium mb-1">Endereço:</label>
                    <input name="address" type="text" className="w-full px-2 py-1 text-xs border rounded" />
                  </div>
                  <div>
                    <label className="block text-xs font-medium mb-1">Número:</label>
                    <input name="number" type="text" className="w-full px-2 py-1 text-xs border rounded" />
                  </div>
                  <div>
                    <label className="block text-xs font-medium mb-1">CEP:</label>
                    <input name="zip" type="text" className="w-full px-2 py-1 text-xs border rounded" />
                  </div>
                  <div className="col-span-2">
                    <label className="block text-xs font-medium mb-1">Complemento:</label>
                    <input name="complement" type="text" className="w-full px-2 py-1 text-xs border rounded" />
                  </div>
                  <div>
                    <label className="block text-xs font-medium mb-1">Bairro:</label>
                    <input name="district" type="text" className="w-full px-2 py-1 text-xs border rounded" />
                  </div>
                  <div className="col-span-2">
                    <label className="block text-xs font-medium mb-1">Cidade:</label>
                    <select name="cityId" className="w-full px-2 py-1 text-xs border rounded">
                      <option value="">Selecione</option>
                      {cities.map((city: any) => (
                        <option key={city.id} value={city.id}>{city.attributes.name}</option>
                      ))}
                    </select>
                  </div>
                </div>

                {/* Contato */}
                <div className="grid grid-cols-6 gap-2">
                  <div>
                    <label className="block text-xs font-medium mb-1">Telefone:</label>
                    <input name="phone" type="text" className="w-full px-2 py-1 text-xs border rounded" />
                  </div>
                  <div>
                    <label className="block text-xs font-medium mb-1">Celular:</label>
                    <input name="mobilePhone" type="text" className="w-full px-2 py-1 text-xs border rounded" />
                  </div>
                  <div>
                    <label className="block text-xs font-medium mb-1">Tel. Comercial:</label>
                    <input name="businessPhone" type="text" className="w-full px-2 py-1 text-xs border rounded" />
                  </div>
                  <div className="col-span-3">
                    <label className="block text-xs font-medium mb-1">E-mail:</label>
                    <input name="email" type="email" className="w-full px-2 py-1 text-xs border rounded" />
                  </div>
                </div>

                {/* Dados Administrativos */}
                <div className="grid grid-cols-3 gap-2">
                  <div>
                    <label className="block text-xs font-medium mb-1">Empresa:</label>
                    <select name="companyId" className="w-full px-2 py-1 text-xs border rounded">
                      <option value="">Selecione</option>
                      {companies.map((company: any) => (
                        <option key={company.id} value={company.id}>{company.attributes.name}</option>
                      ))}
                    </select>
                  </div>
                  <div>
                    <label className="block text-xs font-medium mb-1">Vendedor:</label>
                    <select name="vendorId" className="w-full px-2 py-1 text-xs border rounded">
                      <option value="">Selecione</option>
                      {users.map((user: any) => (
                        <option key={user.id} value={user.id}>{user.attributes.name}</option>
                      ))}
                    </select>
                  </div>
                  <div>
                    <label className="block text-xs font-medium mb-1">Observações:</label>
                    <textarea name="observations" rows={2} className="w-full px-2 py-1 text-xs border rounded"></textarea>
                  </div>
                </div>
              </div>
              
              <div className="flex justify-end space-x-2 mt-3 p-3 border-t">
                <button
                  type="button"
                  onClick={() => setShowPersonJuridicaModal(false)}
                  className="px-3 py-1.5 text-xs border border-gray-300 rounded hover:bg-gray-50"
                >
                  Cancelar
                </button>
                <button type="submit" className="px-3 py-1.5 text-xs bg-blue-600 text-white rounded hover:bg-blue-700" disabled={savingPerson}>
                  {savingPerson ? 'Salvando...' : 'Salvar'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </>
  );
};