// ==================================================
// SCRIPT DE DEBUG PARA KEEPTUR - COPIE E COLE NO CONSOLE
// ==================================================

console.clear();
console.log('%c🔍 INICIANDO DEBUG DO KEEPTUR', 'font-size: 20px; color: blue; font-weight: bold');
console.log('='.repeat(50));

// Função auxiliar para logging formatado
const log = (title, data, color = 'blue') => {
  console.group(`%c${title}`, `color: ${color}; font-weight: bold;`);
  console.log(data);
  console.groupEnd();
};

// 1. Verificar Token
const checkToken = () => {
  const token = localStorage.getItem('keeptur-token');
  if (token) {
    try {
      const parts = token.split('.');
      if (parts.length === 3) {
        const payload = JSON.parse(atob(parts[1]));
        log('✅ TOKEN ENCONTRADO', {
          token: token.substring(0, 20) + '...',
          payload,
          expiresAt: payload.exp ? new Date(payload.exp * 1000).toLocaleString() : 'Não definido',
          isExpired: payload.exp ? payload.exp * 1000 < Date.now() : false
        }, 'green');
      } else {
        log('❌ TOKEN INVÁLIDO', 'Token não está no formato JWT', 'red');
      }
    } catch (e) {
      log('❌ ERRO AO DECODIFICAR TOKEN', e.message, 'red');
    }
  } else {
    log('❌ TOKEN NÃO ENCONTRADO', 'Faça login novamente', 'red');
  }
  return token;
};

// 2. Testar API de Perfil
const testProfileAPI = async (token) => {
  if (!token) {
    log('⚠️ TESTE DE API PULADO', 'Token não disponível', 'orange');
    return;
  }
  
  console.log('\n' + '='.repeat(50));
  console.log('%c📡 TESTANDO API DE PERFIL', 'font-size: 16px; color: purple; font-weight: bold');
  
  try {
    const response = await fetch('/api/monde/user-profile', {
      headers: {
        'Authorization': `Bearer ${token}`,
      },
    });
    
    const responseData = await response.text();
    let parsedData;
    
    try {
      parsedData = JSON.parse(responseData);
    } catch (e) {
      parsedData = responseData;
    }
    
    log(`${response.ok ? '✅' : '❌'} RESPOSTA DA API`, {
      status: response.status,
      statusText: response.statusText,
      headers: Object.fromEntries(response.headers.entries()),
      body: parsedData
    }, response.ok ? 'green' : 'red');
    
    if (response.ok && parsedData) {
      // Analisar estrutura dos dados
      if (parsedData.data) {
        log('📊 ESTRUTURA: JSON:API Format', {
          hasData: true,
          hasAttributes: !!parsedData.data.attributes,
          attributeKeys: parsedData.data.attributes ? Object.keys(parsedData.data.attributes) : []
        }, 'blue');
      } else if (parsedData.attributes) {
        log('📊 ESTRUTURA: Direct Attributes', {
          hasAttributes: true,
          attributeKeys: Object.keys(parsedData.attributes)
        }, 'blue');
      } else {
        log('⚠️ ESTRUTURA DESCONHECIDA', parsedData, 'orange');
      }
    }
  } catch (error) {
    log('❌ ERRO NA REQUISIÇÃO', error.message, 'red');
  }
};

// 3. Testar Conexão com Monde
const testMondeConnection = async (token) => {
  if (!token) return;
  
  console.log('\n' + '='.repeat(50));
  console.log('%c🔌 TESTANDO CONEXÃO COM MONDE', 'font-size: 16px; color: purple; font-weight: bold');
  
  try {
    const response = await fetch('/api/test/monde-connection', {
      headers: {
        'Authorization': `Bearer ${token}`,
      },
    });
    
    const data = await response.json();
    
    if (data.success) {
      log('✅ CONEXÃO COM MONDE OK', data, 'green');
    } else {
      log('❌ FALHA NA CONEXÃO COM MONDE', data, 'red');
    }
  } catch (error) {
    log('⚠️ ENDPOINT DE TESTE NÃO DISPONÍVEL', 'Adicione o endpoint de teste no backend', 'orange');
  }
};

// 4. Verificar Estado do React
const checkReactState = () => {
  console.log('\n' + '='.repeat(50));
  console.log('%c⚛️ VERIFICANDO REACT', 'font-size: 16px; color: purple; font-weight: bold');
  
  const reactRoot = document.getElementById('root');
  if (reactRoot && reactRoot._reactRootContainer) {
    log('✅ REACT DETECTADO', 'Aplicação React está rodando', 'green');
  } else {
    log('⚠️ REACT NÃO DETECTADO', 'Pode ser normal dependendo da versão', 'orange');
  }
  
  // Verificar se estamos na página de Settings
  if (window.location.pathname.includes('settings')) {
    log('✅ PÁGINA DE SETTINGS', 'Estamos na página correta', 'green');
  } else {
    log('⚠️ PÁGINA INCORRETA', `Página atual: ${window.location.pathname}`, 'orange');
  }
};

// 5. Executar Debug Manual
const manualDebug = () => {
  console.log('\n' + '='.repeat(50));
  console.log('%c🛠️ COMANDOS DE DEBUG MANUAL', 'font-size: 16px; color: purple; font-weight: bold');
  
  console.log(`
%cCopie e cole estes comandos para testes manuais:

// 1. Forçar reload da página de perfil
window.location.reload();

// 2. Limpar cache e fazer novo login
localStorage.clear();
window.location.href = '/login';

// 3. Inspecionar dados do usuário no contexto React
const userElement = document.querySelector('[data-user]');
console.log(userElement?.__reactInternalInstance);

// 4. Testar API diretamente com curl
// Copie seu token e execute no terminal:
curl -X GET http://localhost:5000/api/monde/user-profile \\
  -H "Authorization: Bearer SEU_TOKEN_AQUI" \\
  -H "Content-Type: application/json"
`, 'color: gray; font-family: monospace;');
};

// Executar todos os testes
(async () => {
  const token = checkToken();
  await testProfileAPI(token);
  await testMondeConnection(token);
  checkReactState();
  manualDebug();
  
  console.log('\n' + '='.repeat(50));
  console.log('%c✅ DEBUG COMPLETO!', 'font-size: 20px; color: green; font-weight: bold');
  console.log('Verifique os resultados acima para identificar o problema.');
})();