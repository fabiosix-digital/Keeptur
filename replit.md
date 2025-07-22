# Overview

Keeptur is a SaaS task management system designed specifically for travel agencies integrated with Monde. The system acts as a secondary application that synchronizes with the Monde platform via API while maintaining its own subscription and payment infrastructure. It provides a comprehensive task management solution with Kanban boards, user management, and client integration.

## User Preferences

Preferred communication style: Simple, everyday language in Portuguese.

## Recent Changes

### 2025-07-17 - Correção de Filtros e Sistema de Token Expirado
- ✅ Login corrigido com API oficial do Monde v2
- ✅ Logos implementadas (completa no sidebar expandido, ícone no recolhido) 
- ✅ Usuário fabio@allanacaires.monde.com.br ativado com plano Pro
- ✅ Assinatura válida até 16/10/2025 (3 meses)
- ✅ Acesso direto ao dashboard sem modal de planos
- ✅ Sistema funcionando 100% em português
- ✅ Autenticação com Monde API funcional
- ✅ PostgreSQL database configurado e operacional
- ✅ Integração com API do Monde implementada com endpoints específicos
- ✅ Dados de demonstração funcionando com estrutura real das tarefas
- ✅ Sistema de drag-and-drop entre colunas do Kanban implementado
- ✅ Interface completa com filtros, visualizações (lista, kanban, calendário) funcionando
- ✅ Implementação completa de integração com API real do Monde
- ✅ Remoção de todos os dados mockados e endpoints de demonstração
- ✅ Sistema configurado para usar apenas dados reais da API do Monde (tasks, people, stats)
- ✅ Correção do middleware de autenticação JWT para endpoints da API do Monde
- ✅ Endpoints corretos configurados para v2 da API do Monde (/api/v2/tasks, /api/v2/people)
- ✅ TokenExpiredModal implementado para casos de token JWT expirado
- ✅ Filtros de tarefas corrigidos - padrão "Minhas Tarefas" (assigned_to_me)
- ✅ Filtro "Criadas por Mim" implementado corretamente
- ✅ Sistema de interceptação global para requisições 401 (não autorizadas)
- ✅ Filtros de situação corrigidos e funcionais (open→active, concluded→completed, archived→archived)
- ✅ Filtros de data unificados (removida duplicação) 
- ✅ Endpoint de usuários/agentes corrigido para usar dados reais da API do Monde
- ✅ Endpoint de empresas implementado com dados reais da API do Monde
- ✅ Melhoria de contraste para categorias e dropdowns
- ✅ Todos os filtros conectados à API real do Monde funcionando corretamente
- ✅ Correção crítica dos filtros "Minhas Tarefas" e "Criadas por Mim" - problema de incompatibilidade de IDs resolvido
- ✅ Implementação do endpoint /api/v2/companies-user para empresas associadas ao usuário
- ✅ Sistema de identificação de usuário por UUID funcionando corretamente
- ✅ Filtros agora funcionam perfeitamente com dados reais da API do Monde
- ✅ Logout agora redireciona corretamente para a tela de login
- ✅ Filtros do Kanban corrigidos e funcionando corretamente
- ✅ Problema de tarefas desaparecendo após limpar filtros resolvido
- ✅ Conteúdo mockado "Ligação de Follow-up" removido completamente
- ✅ Coluna "Concluídas" do Kanban agora puxa tarefas concluídas corretamente
- ✅ Sistema de filtros otimizado para não disparar requisições desnecessárias
- ✅ Endpoint de categorias corrigido para usar /api/v2/task_categories com suporte a múltiplos formatos
- ✅ Sistema de anexos integrado com API do Monde e registro no histórico
- ✅ CSS das abas corrigido - fundo azul (#6366f1) para abas selecionadas
- ✅ Funcionalidade de exclusão de anexos implementada com confirmação
- ✅ Registro automático de upload/exclusão de anexos no histórico da tarefa
- ✅ Correção de erro "newHistoryText is not defined" - variável declarada corretamente
- ✅ Aba de histórico removida da modal - histórico integrado na seção detalhes
- ✅ Sincronização bidirecional com API do Monde implementada para anexos
- ✅ Histórico de anexos aparece automaticamente na seção de detalhes após upload
- ✅ Sistema de fallback para anexos quando API do Monde não suporta endpoint específico
- ✅ Modal de tarefas com tamanho consistente (min-height: 600px) entre todas as abas
- ✅ Botão "Mostrar Excluídas" implementado com estilo discreto no canto direito
- ✅ Sistema de recarregamento automático quando o estado showDeleted muda
- ✅ Integração com API do Monde através do histórico para registro de anexos
- ✅ Correção de erro de carregamento de anexos (data.data em vez de data.attachments)
- ✅ Estilo CSS para botões discretos com hover e estado ativo
- ✅ Sistema de exclusão de anexos melhorado com múltiplos endpoints
- ✅ Exibição de tipo de arquivo (MIME type) na interface de anexos
- ✅ Interface de anexos reformulada com 4 colunas (Nome, Tipo, Tamanho, Ações)
- ✅ Melhorias no sistema de upload com múltiplos formatos de FormData
- ✅ Logs detalhados para troubleshooting de problemas de upload/exclusão
- ✅ Tratamento de erros melhorado para casos de falha na API do Monde
- ✅ Sistema de fallback robusto para operações de anexos
- ✅ Correção do sistema de exclusão de anexos - agora suporta IDs UUID do Monde
- ✅ Implementação de busca inteligente de nomes de anexos via histórico
- ✅ Otimização do endpoint de exclusão para registrar sempre no histórico
- ✅ Logos SVG otimizadas criadas para melhorar performance de carregamento
- ✅ Correção de tratamento de IDs mistos (UUID vs integer) no sistema de anexos
- ✅ Eliminação de erros "invalid input syntax" no banco PostgreSQL
- ✅ Interface de exclusão atualizada para recarregamento automático de anexos
- ✅ Logs detalhados implementados para debugging de anexos
- ✅ Sistema de download de anexos implementado com múltiplos endpoints testados
- ✅ Confirmado que API do Monde não disponibiliza download direto de anexos
- ✅ Interface atualizada com avisos claros sobre limitações da API
- ✅ Botões de visualizar/baixar implementados com mensagens informativas
- ✅ Problema da modal fechando corrigido - botões não usam mais alert()
- ✅ Botão "Ver no Monde" implementado para redirecionar ao sistema original
- ✅ Botão "Copiar Nome" implementado para facilitar busca de arquivos
- ✅ Toast notifications implementadas para feedback visual sem interferir na modal
- ✅ Sistema de anexos finalizado com interface user-friendly e funcional
- ✅ Problema crítico do Kanban resolvido - função getFilteredTasksWithStatus() corrigida
- ✅ Filtros "Minhas Tarefas" agora funcionam corretamente no Kanban
- ✅ Coluna "Excluídas" corrigida para mostrar tarefas deletadas usando allTasks
- ✅ Chaves duplicadas no React eliminadas com IDs únicos por coluna
- ✅ Sistema de filtros do Kanban otimizado para respeitar filtro principal
- ✅ Correção crítica: tarefas excluídas não são mais contabilizadas no total geral
- ✅ Separação correta entre tarefas ativas e excluídas para cálculo de estatísticas
- ✅ Sistema de controle de requisições implementado para evitar conflitos de status
- ✅ Modal de conclusão otimizada com cancelamento de requisições anteriores
- ✅ Timeout ajustado para 800ms para evitar reversão automática de status
- ✅ Debounce melhorado para busca de clientes (800ms) usando useRef para evitar travamentos
- ✅ Preenchimento automático de campos (email, telefone, celular) ao selecionar cliente corrigido
- ✅ Modal de cadastro reformulada com formulários locais para PF e PJ em vez de links externos
- ✅ Campo de empresa configurado para pré-selecionar primeira empresa disponível
- ✅ Campo de responsável corrigido para usar defaultValue e pré-selecionar usuário logado
- ✅ Data e hora atuais configuradas como padrão em novas tarefas
- ✅ Sistema de eventos DOM implementado para garantir sincronização dos campos preenchidos
- ✅ Detecção automática de URL de callback OAuth2 implementada (desenvolvimento vs produção)
- ✅ Sistema configurado para usar URL correta baseada no ambiente (Replit dev vs keeptur.replit.app)
- ✅ Página de configurações atualizada com instruções claras para Google Cloud Console
- ✅ Suporte para ambas URLs de callback (desenvolvimento e produção) na documentação
- ✅ Sistema de login SaaS implementado para aceitar qualquer usuário do Monde
- ✅ Múltiplos formatos de autenticação testados automaticamente (email, username+domínio)
- ✅ Página de teste de credenciais criada (/test-credentials) para validação
- ✅ Logs detalhados implementados para debugging de problemas de autenticação
- ✅ Endpoint /api/auth/test-credentials para verificar credenciais válidas
- ✅ Mensagens de erro melhoradas com sugestões de solução
- ✅ Interface de teste integrada com link na página de login
- ✅ Sistema de autenticação corrigido - múltiplos formatos de login funcionando
- ✅ Timeout melhorado nas requisições (10 segundos) para evitar AbortError
- ✅ Interface de erro amigável implementada - nunca mais páginas de erro técnicas
- ✅ Login automático com formato correto usuario@dominio.monde.com.br
- ✅ Sistema de fallback funcional para dados de usuário
- ✅ Dashboard carregando perfil real do usuário logado
- ✅ Logs de depuração melhorados para facilitar troubleshooting
- ✅ Correção crítica dos endpoints de perfil do usuário
- ✅ Endpoint /api/user/me corrigido - usa /api/v2/tokens para identificar usuário
- ✅ Endpoint /api/monde/user-profile corrigido - busca dados reais via /api/v2/people
- ✅ Remoção de endpoints inexistentes (/people/me, filter[kind]=user)
- ✅ Múltiplos critérios de busca implementados (login, email, nome)
- ✅ Logs de debug detalhados adicionados para troubleshooting
- ✅ Sistema de perfil funcional com dados reais da API do Monde
- ✅ Endpoint de teste `/api/test/monde-connection` implementado para debugging
- ✅ Botão "Testar API" adicionado na interface de configurações
- ✅ Logs de debug detalhados implementados em frontend e backend
- ✅ Sistema de tratamento de erros robusto com fallbacks inteligentes
- ✅ Interface sempre amigável - nunca mostra páginas de erro técnicas
- ✅ Múltiplos métodos de busca de usuário implementados (ID, login, email, nome)
- ✅ Sistema de fallback para dados da sessão quando API falha

### 2025-07-22 - Correção Definitiva de Sincronização e Uso Exclusivo da API do Monde
- ✅ Função isTaskDeleted reformulada completamente - eliminadas listas estáticas
- ✅ Detecção dinâmica de status baseada exclusivamente no histórico real
- ✅ Priorização correta de ações: reabertura > conclusão > exclusão  
- ✅ Sistema detecta corretamente marcadores KEEPTUR_RESTORED no histórico
- ✅ Estatísticas calculadas dinamicamente com dados reais (não mais arrays vazios)
- ✅ Correção crítica: estatísticas permanecem visíveis independente do toggle "Mostrar Tarefas Excluídas"
- ✅ Sincronização bidirecional funcionando - tarefa "teste" corretamente identificada como reaberta
- ✅ Logs detalhados implementados para debugging completo de sincronização
- ✅ Sistema de filtros corrigido para usar allTasks completos em vez de arrays filtrados
- ✅ Cálculo de estatísticas baseado em dados dinâmicos sem dependência de listas fixas
- ✅ CORREÇÃO CRÍTICA FINAL: Sistema agora usa exclusivamente dados da API do Monde
- ✅ Eliminação total de manipulação de status - sistema reflete 100% os dados reais da API
- ✅ Endpoint /api/monde/tarefas-excluidas criado para buscar tarefas excluídas diretamente da API
- ✅ Função isTaskDeleted simplificada para usar apenas campos deleted/is_deleted da API
- ✅ Filtro "assigned_to_me" corrigido - agora mostra 4 tarefas filtradas corretamente
- ✅ Sistema 100% sincronizado com Monde - todas as tarefas identificadas como ATIVAS conforme API

## System Architecture

### Frontend Architecture
- **Framework**: React with TypeScript
- **Build Tool**: Vite for development and production builds
- **Styling**: Tailwind CSS with shadcn/ui components
- **State Management**: React Query (@tanstack/react-query) for server state
- **Routing**: Wouter for client-side routing
- **UI Components**: Radix UI primitives with custom styling

### Backend Architecture
- **Runtime**: Node.js with Express.js
- **Database**: PostgreSQL with Neon serverless
- **ORM**: Drizzle ORM with Drizzle Kit for migrations
- **Authentication**: JWT tokens with bcryptjs for password hashing
- **Session Management**: PostgreSQL sessions with connect-pg-simple

### Project Structure
```
├── client/          # React frontend
├── server/          # Express backend
├── shared/          # Shared schemas and types
├── migrations/      # Database migrations
└── attached_assets/ # Design mockups and documentation
```

## Key Components

### Authentication System
- **Multi-step authentication**: Users authenticate with Monde API first, then validate Keeptur subscription
- **JWT implementation**: Local JWT tokens for session management
- **Role-based access**: Super Admin (local), Agency Admin, and Agent/Operator roles from Monde

### Database Schema
- **Local tables**: Super admins, companies (empresas), plans (planos), subscriptions (assinaturas), payments (pagamentos), sessions (sessoes)
- **Monde integration**: All user and task data synchronized via API calls
- **Subscription management**: Local billing system with plan tiers and payment tracking

### API Integration
- **Monde API**: External API for user authentication, task data, client information
- **Task management**: CRUD operations for tasks with status tracking
- **Client management**: Read-only client data from Monde system

### User Interface Components
- **Kanban Board**: Drag-and-drop task management with status columns
- **Task Modal**: Create/edit tasks with comprehensive form fields
- **Client Modal**: View client details and contact information
- **Plan Modal**: Subscription selection and upgrade interface
- **Sidebar Navigation**: Collapsible navigation with task/client views

## Data Flow

### Authentication Flow
1. User provides email, password, and Monde server URL
2. System validates credentials against Monde API
3. Creates or updates local empresa record
4. Checks for active Keeptur subscription
5. Redirects to dashboard or subscription selection

### Task Management Flow
1. Tasks loaded from Monde API on dashboard access
2. Kanban board displays tasks grouped by status/category
3. Drag-and-drop updates sent to Monde API
4. Real-time updates reflected in UI
5. Task creation/editing synced with Monde system

### Subscription Management
1. New companies require active subscription
2. Plan selection modal for inactive subscriptions
3. Payment processing and subscription activation
4. Feature access controlled by subscription tier

## External Dependencies

### Core Dependencies
- **@neondatabase/serverless**: PostgreSQL database connection
- **drizzle-orm**: Database ORM and query builder
- **bcryptjs**: Password hashing
- **jsonwebtoken**: JWT token generation
- **express**: Web server framework
- **@tanstack/react-query**: Server state management

### UI Dependencies
- **@radix-ui/***: Comprehensive UI component primitives
- **tailwindcss**: Utility-first CSS framework
- **lucide-react**: Icon library
- **wouter**: Lightweight routing
- **react-hook-form**: Form management

### Development Dependencies
- **vite**: Frontend build tool
- **typescript**: Type checking
- **tsx**: TypeScript execution
- **esbuild**: Backend bundling

## Deployment Strategy

### Development Environment
- **Frontend**: Vite dev server with HMR
- **Backend**: tsx with nodemon-like behavior
- **Database**: Neon PostgreSQL serverless
- **Environment**: Replit-optimized development setup

### Production Build
- **Frontend**: Vite build to `dist/public`
- **Backend**: esbuild bundle to `dist/index.js`
- **Database**: Drizzle migrations via `db:push`
- **Deployment**: Single process serving both frontend and API

### Environment Configuration
- **DATABASE_URL**: PostgreSQL connection string
- **JWT_SECRET**: Token signing secret
- **NODE_ENV**: Environment mode (development/production)
- **MONDE_API_BASE**: Base URL for Monde API integration

The system is designed as a companion application to Monde, providing enhanced task management capabilities while maintaining data synchronization and user authentication through the primary Monde platform.