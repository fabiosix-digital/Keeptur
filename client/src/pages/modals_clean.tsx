      {/* Modal de cadastro - Pessoa Física */}
      {showPersonFisicaModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black bg-opacity-50">
          <div className="bg-white rounded-lg shadow-xl max-w-5xl w-full mx-4 max-h-[85vh] overflow-hidden">
            <div className="p-4 border-b flex justify-between items-center">
              <h2 className="text-xl font-semibold">👤 Cadastrar Pessoa Física</h2>
              <button
                onClick={() => setShowPersonFisicaModal(false)}
                className="text-gray-500 hover:text-gray-700"
              >
                <i className="ri-close-line text-xl"></i>
              </button>
            </div>
            
            <form onSubmit={submitPersonFisica} className="overflow-y-auto max-h-[calc(85vh-120px)]">
              <div className="p-4 space-y-4">
                {/* Dados Pessoais - Layout compacto */}
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-3">
                  <div className="lg:col-span-3">
                    <label className="block text-xs font-medium mb-1">Nome: *</label>
                    <input name="name" type="text" required className="w-full px-2 py-1.5 text-sm border rounded" />
                  </div>
                  
                  <div>
                    <label className="block text-xs font-medium mb-1">Sexo:</label>
                    <select name="sex" className="w-full px-2 py-1.5 text-sm border rounded">
                      <option value="">Selecione</option>
                      <option value="M">Masculino</option>
                      <option value="F">Feminino</option>
                    </select>
                  </div>
                  
                  <div className="flex items-center mt-5">
                    <input name="foreign" type="checkbox" id="estrangeiro-pf" className="mr-2" />
                    <label htmlFor="estrangeiro-pf" className="text-xs">Estrangeiro</label>
                  </div>
                  
                  <div>
                    <label className="block text-xs font-medium mb-1">Código:</label>
                    <input name="code" type="number" disabled className="w-full px-2 py-1.5 text-sm border rounded bg-gray-100" placeholder="Automático" />
                  </div>
                </div>

                {/* Documentos */}
                <div className="border-t pt-3">
                  <h4 className="text-sm font-medium mb-2">Documentos</h4>
                  <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-3">
                    <div>
                      <label className="block text-xs font-medium mb-1">CPF:</label>
                      <input name="cpf" type="text" placeholder="000.000.000-00" className="w-full px-2 py-1.5 text-sm border rounded" />
                    </div>
                    
                    <div>
                      <label className="block text-xs font-medium mb-1">RG:</label>
                      <input name="rg" type="text" className="w-full px-2 py-1.5 text-sm border rounded" />
                    </div>
                    
                    <div>
                      <label className="block text-xs font-medium mb-1">Passport:</label>
                      <input name="passport" type="text" className="w-full px-2 py-1.5 text-sm border rounded" />
                    </div>
                    
                    <div>
                      <label className="block text-xs font-medium mb-1">Data Nascimento:</label>
                      <input name="birthDate" type="date" className="w-full px-2 py-1.5 text-sm border rounded" />
                    </div>
                  </div>
                </div>

                {/* Endereço */}
                <div className="border-t pt-3">
                  <h4 className="text-sm font-medium mb-2">Endereço</h4>
                  <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-3">
                    <div>
                      <label className="block text-xs font-medium mb-1">CEP:</label>
                      <input name="zip" type="text" placeholder="00000-000" className="w-full px-2 py-1.5 text-sm border rounded" />
                    </div>
                    
                    <div className="lg:col-span-2">
                      <label className="block text-xs font-medium mb-1">Endereço:</label>
                      <input name="address" type="text" className="w-full px-2 py-1.5 text-sm border rounded" />
                    </div>
                    
                    <div>
                      <label className="block text-xs font-medium mb-1">Número:</label>
                      <input name="number" type="text" className="w-full px-2 py-1.5 text-sm border rounded" />
                    </div>
                    
                    <div>
                      <label className="block text-xs font-medium mb-1">Complemento:</label>
                      <input name="complement" type="text" className="w-full px-2 py-1.5 text-sm border rounded" />
                    </div>
                    
                    <div>
                      <label className="block text-xs font-medium mb-1">Bairro:</label>
                      <input name="district" type="text" className="w-full px-2 py-1.5 text-sm border rounded" />
                    </div>
                    
                    <div className="lg:col-span-2">
                      <label className="block text-xs font-medium mb-1">Cidade:</label>
                      <select name="cityId" className="w-full px-2 py-1.5 text-sm border rounded" onClick={loadCities}>
                        <option value="">Selecione uma cidade</option>
                        {cities.map(city => (
                          <option key={city.id} value={city.id}>{city.attributes.name}</option>
                        ))}
                      </select>
                      {loadingCities && <p className="text-xs text-gray-500 mt-1">Carregando...</p>}
                    </div>
                  </div>
                </div>

                {/* Contato */}
                <div className="border-t pt-3">
                  <h4 className="text-sm font-medium mb-2">Contato</h4>
                  <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-3">
                    <div>
                      <label className="block text-xs font-medium mb-1">Telefone:</label>
                      <input name="phone" type="text" placeholder="(11) 3333-4444" className="w-full px-2 py-1.5 text-sm border rounded" />
                    </div>
                    
                    <div>
                      <label className="block text-xs font-medium mb-1">Celular:</label>
                      <input name="mobilePhone" type="text" placeholder="(11) 99999-8888" className="w-full px-2 py-1.5 text-sm border rounded" />
                    </div>
                    
                    <div>
                      <label className="block text-xs font-medium mb-1">Telefone Comercial:</label>
                      <input name="businessPhone" type="text" placeholder="(11) 2222-3333" className="w-full px-2 py-1.5 text-sm border rounded" />
                    </div>
                    
                    <div className="lg:col-span-2">
                      <label className="block text-xs font-medium mb-1">E-mail:</label>
                      <input name="email" type="email" className="w-full px-2 py-1.5 text-sm border rounded" />
                    </div>
                    
                    <div>
                      <label className="block text-xs font-medium mb-1">Website:</label>
                      <input name="website" type="url" className="w-full px-2 py-1.5 text-sm border rounded" />
                    </div>
                  </div>
                </div>

                {/* Informações Profissionais */}
                <div className="border-t pt-3">
                  <h4 className="text-sm font-medium mb-2">Informações Profissionais</h4>
                  <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-3">
                    <div>
                      <label className="block text-xs font-medium mb-1">Estado Civil:</label>
                      <select name="maritalStatus" className="w-full px-2 py-1.5 text-sm border rounded">
                        <option value="">Selecione</option>
                        <option value="single">Solteiro(a)</option>
                        <option value="married">Casado(a)</option>
                        <option value="divorced">Divorciado(a)</option>
                        <option value="widowed">Viúvo(a)</option>
                      </select>
                    </div>
                    
                    <div>
                      <label className="block text-xs font-medium mb-1">Profissão:</label>
                      <input name="profession" type="text" className="w-full px-2 py-1.5 text-sm border rounded" />
                    </div>
                    
                    <div>
                      <label className="block text-xs font-medium mb-1">Nacionalidade:</label>
                      <input name="nationality" type="text" className="w-full px-2 py-1.5 text-sm border rounded" />
                    </div>
                  </div>
                </div>

                {/* Outros */}
                <div className="border-t pt-3">
                  <h4 className="text-sm font-medium mb-2">Outros</h4>
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                    <div>
                      <label className="block text-xs font-medium mb-1">Observações:</label>
                      <textarea name="observations" rows={3} className="w-full px-2 py-1.5 text-sm border rounded"></textarea>
                    </div>
                    
                    <div>
                      <label className="block text-xs font-medium mb-1">Vendedor:</label>
                      <select name="vendorId" className="w-full px-2 py-1.5 text-sm border rounded">
                        <option value="">Selecione um vendedor</option>
                        {users.map((user: any) => (
                          <option key={user.id} value={user.id}>{user.attributes.name}</option>
                        ))}
                      </select>
                    </div>
                  </div>
                </div>
              </div>
              
              <div className="flex justify-end space-x-3 mt-6 pt-6 border-t">
                <button
                  type="button"
                  onClick={() => setShowPersonFisicaModal(false)}
                  className="px-4 py-2 border border-gray-300 rounded hover:bg-gray-50"
                >
                  Cancelar
                </button>
                <button type="submit" className="px-4 py-2 bg-blue-600 text-white rounded hover:bg-blue-700" disabled={savingPerson}>
                  {savingPerson ? 'Salvando...' : 'Salvar'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}