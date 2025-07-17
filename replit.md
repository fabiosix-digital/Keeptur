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