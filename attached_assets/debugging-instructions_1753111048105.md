# Instruções de Debug e Solução Passo a Passo

## 1. Verificações Iniciais

### A. Verifique o Console do Navegador
Abra o console (F12) e procure por:
- Erros de rede (404, 401, 500)
- Erros de JavaScript
- Logs de debug que adicionamos

### B. Verifique o Network Tab
1. Abra a aba Network (F12)
2. Recarregue a página de Settings
3. Procure pela requisição `/api/monde/user-profile`
4. Verifique:
   - Status da resposta
   - Headers enviados (especialmente Authorization)
   - Response body

### C. Verifique o Token
No console do navegador, execute:
```javascript
console.log('Token:', localStorage.getItem('keeptur-token'));
```

## 2. Teste Manual da API

### A. Teste o endpoint de perfil diretamente
```bash
# Substitua YOUR_TOKEN pelo token real
curl -X GET http://localhost:5000/api/monde/user-profile \
  -H "Authorization: Bearer YOUR_TOKEN" \
  -H "Content-Type: application/json"
```

### B. Teste a conexão com Monde
```bash
curl -X GET http://localhost:5000/api/test/monde-connection \
  -H "Authorization: Bearer YOUR_TOKEN" \
  -H "Content-Type: application/json"
```

## 3. Possíveis Problemas e Soluções

### Problema 1: Token Expirado
**Sintoma**: Status 401 nas requisições

**Solução**:
1. Faça logout
2. Faça login novamente
3. Verifique se o novo token está sendo salvo

### Problema 2: Dados Vazios
**Sintoma**: Resposta 200 mas sem dados

**Solução**: Verifique se o usuário existe na API do Monde:
```typescript
// Adicione este endpoint temporário em routes.ts
app.get('/api/debug/user-data', authenticateToken, async (req: any, res) => {
  res.json({
    sessionData: req.sessao?.user_data,
    token: req.mondeToken ? 'Present' : 'Missing',
    empresaId: req.empresaId
  });
});
```

### Problema 3: CORS
**Sintoma**: Erro de CORS no console

**Solução**: Adicione no início do seu servidor Express:
```typescript
import cors from 'cors';

app.use(cors({
  origin: true,
  credentials: true,
  methods: ['GET', 'POST', 'PUT', 'DELETE', 'OPTIONS'],
  allowedHeaders: ['Content-Type', 'Authorization']
}));
```

### Problema 4: Formato de Dados Incorreto
**Sintoma**: Dados aparecem no console mas não na tela

**Solução**: Verifique o mapeamento no frontend:
```typescript
// Debug no Settings.tsx
console.log('Raw data:', data);
console.log('Attributes:', data.data?.attributes || data.attributes);
console.log('Final profileData:', profileData);
```

## 4. Código de Teste Completo

Crie um componente de teste temporário:

```typescript
// TestProfile.tsx
import { useState, useEffect } from 'react';

export default function TestProfile() {
  const [data, setData] = useState<any>(null);
  const [error, setError] = useState<string>('');
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    testAPI();
  }, []);

  const testAPI = async () => {
    try {
      const token = localStorage.getItem('keeptur-token');
      console.log('Testing with token:', token);

      const response = await fetch('/api/monde/user-profile', {
        headers: {
          'Authorization': `Bearer ${token}`,
        },
      });

      console.log('Response status:', response.status);
      
      const responseData = await response.json();
      console.log('Response data:', responseData);
      
      setData(responseData);
    } catch (err) {
      console.error('Error:', err);
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };

  if (loading) return <div>Loading...</div>;
  if (error) return <div>Error: {error}</div>;

  return (
    <div>
      <h1>Test Profile Data</h1>
      <pre>{JSON.stringify(data, null, 2)}</pre>
    </div>
  );
}
```

## 5. Verificar Estrutura de Dados do Monde

A API do Monde pode retornar dados em diferentes formatos:

### Formato 1 (JSON:API):
```json
{
  "data": {
    "type": "people",
    "id": "123",
    "attributes": {
      "name": "Nome",
      "email": "email@example.com"
    }
  }
}
```

### Formato 2 (Direto):
```json
{
  "attributes": {
    "name": "Nome",
    "email": "email@example.com"
  }
}
```

### Formato 3 (Array):
```json
{
  "data": [{
    "attributes": {
      "name": "Nome",
      "email": "email@example.com"
    }
  }]
}
```

## 6. Script de Debug Completo

Execute este script no console do navegador:

```javascript
// Debug completo
async function debugProfile() {
  const token = localStorage.getItem('keeptur-token');
  
  console.group('🔍 Debug Profile API');
  console.log('Token:', token ? '✓ Present' : '✗ Missing');
  
  if (!token) {
    console.error('No token found!');
    console.groupEnd();
    return;
  }
  
  try {
    const response = await fetch('/api/monde/user-profile', {
      headers: {
        'Authorization': `Bearer ${token}`,
      },
    });
    
    console.log('Status:', response.status);
    console.log('Headers:', response.headers);
    
    const data = await response.json();
    console.log('Raw Response:', data);
    
    if (data.data) {
      console.log('Data structure: JSON:API format');
      console.log('Attributes:', data.data.attributes);
    } else if (data.attributes) {
      console.log('Data structure: Direct attributes');
      console.log('Attributes:', data.attributes);
    } else {
      console.warn('Unknown data structure');
    }
    
  } catch (error) {
    console.error('Fetch error:', error);
  }
  
  console.groupEnd();
}

debugProfile();
```

## 7. Solução Definitiva

Se nada funcionar, implemente um fallback local:

```typescript
// No Settings.tsx
const loadUserProfile = async () => {
  try {
    // ... código existente ...
  } catch (error) {
    console.error('Erro ao carregar perfil:', error);
    
    // Fallback: usar dados mock para teste
    setProfileData({
      name: 'Usuário Teste',
      email: 'teste@example.com',
      phone: '(11) 1234-5678',
      // ... outros campos
    });
    
    showToast('⚠️ Usando dados de teste (API indisponível)', 'error');
  }
};
```

## 8. Checklist Final

- [ ] Token está sendo salvo no localStorage após login
- [ ] Token está sendo enviado no header Authorization
- [ ] Endpoint `/api/monde/user-profile` está retornando 200
- [ ] Dados estão no formato esperado
- [ ] Console não mostra erros de JavaScript
- [ ] Mapeamento de campos está correto (hífen vs camelCase)
- [ ] Sessão no backend tem os dados do usuário
- [ ] Token do Monde não está expirado

## Próximos Passos

1. Execute os testes na ordem apresentada
2. Identifique em qual ponto o processo falha
3. Aplique a correção específica
4. Se persistir, compartilhe os logs do console e network tab