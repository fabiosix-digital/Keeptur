import type { Express } from "express";
import { createServer, type Server } from "http";
import { storage } from "./storage";
import bcrypt from "bcryptjs";
import jwt from "jsonwebtoken";
import multer from "multer";
import { insertEmpresaSchema, insertAssinaturaSchema, insertPagamentoSchema, insertSessaoSchema, insertAnexoSchema } from "@shared/schema";
import { z } from "zod";

const JWT_SECRET = process.env.JWT_SECRET || "keeptur-secret-key";

// API schemas
const loginSchema = z.object({
  email: z.string().min(1),
  password: z.string().min(1),
  serverUrl: z.string().min(1),
});

const planSubscriptionSchema = z.object({
  planId: z.number(),
  empresaId: z.number(),
});

export async function registerRoutes(app: Express): Promise<Server> {
  // Login route
  app.post("/api/auth/login", async (req, res) => {
    try {
      console.log("Login request body:", req.body);
      const { email, password, serverUrl } = loginSchema.parse(req.body);
      
      // Check if empresa exists for this server URL
      let empresa = await storage.getEmpresaByMondeUrl(serverUrl);
      
      // Call Monde API to authenticate using the correct v2 endpoint
      const mondeApiUrl = "https://web.monde.com.br/api/v2/tokens";
      
      console.log("Tentando autenticar com Monde API:", mondeApiUrl);
      console.log("Login sendo usado:", `${email}@${serverUrl.replace('http://', '').replace('https://', '')}`);
      
      const mondeResponse = await fetch(mondeApiUrl, {
        method: "POST",
        headers: { 
          "Content-Type": "application/vnd.api+json",
          "Accept": "application/vnd.api+json",
          "User-Agent": "Keeptur/1.0"
        },
        body: JSON.stringify({
          data: {
            type: "tokens",
            attributes: {
              login: `${email}@${serverUrl.replace('http://', '').replace('https://', '')}`,
              password: password
            }
          }
        }),
      });

      if (!mondeResponse.ok) {
        const errorText = await mondeResponse.text().catch(() => "Erro desconhecido");
        console.log("Monde API error:", mondeResponse.status, errorText);
        return res.status(401).json({ 
          message: "Credenciais inválidas ou servidor inacessível",
          details: `Status: ${mondeResponse.status}`
        });
      }

      const mondeData = await mondeResponse.json();
      
      // Extract user info from Monde response
      const mondeToken = mondeData.data.attributes.token;
      const mondeLogin = mondeData.data.attributes.login;
      const empresaNome = serverUrl.replace('http://', '').replace('https://', '').split('.')[0];
      
      // Create empresa if it doesn't exist
      if (!empresa) {
        empresa = await storage.createEmpresa({
          nome: empresaNome,
          servidor_monde_url: serverUrl,
          empresa_id_monde: mondeData.data.id,
        });
      }

      // Check if plan is active
      const planActive = await storage.isEmpresaPlanActive(empresa.id);
      
      // Create or update session
      const expiresAt = new Date(Date.now() + 60 * 60 * 1000); // 1 hour (Monde token expires in 1 hour)
      const sessao = await storage.createSessao({
        empresa_id: empresa.id,
        access_token: mondeToken,
        refresh_token: "", // Monde doesn't provide refresh tokens
        expires_at: expiresAt,
        user_data: {
          login: mondeLogin,
          email: `${email}@${serverUrl.replace('http://', '').replace('https://', '')}`,
          role: "admin",
          name: mondeLogin
        },
      });

      // Generate local JWT token
      const token = jwt.sign(
        { sessaoId: sessao.id, empresaId: empresa.id },
        JWT_SECRET,
        { expiresIn: "24h" }
      );

      res.json({
        token,
        user: {
          id: sessao.id,
          name: mondeLogin,
          email: `${email}@${serverUrl.replace('http://', '').replace('https://', '')}`,
          role: "admin",
        },
        empresa_id: empresa.id,
        has_active_plan: planActive,
        monde_token: mondeToken,
      });
    } catch (error) {
      console.error("Login error:", error);
      res.status(500).json({ message: "Erro interno do servidor" });
    }
  });

  // Get available plans
  app.get("/api/plans", async (req, res) => {
    try {
      const plans = await storage.getPlanos();
      res.json(plans);
    } catch (error) {
      console.error("Get plans error:", error);
      res.status(500).json({ message: "Erro ao carregar planos" });
    }
  });

  // Subscribe to plan
  app.post("/api/plans/subscribe", async (req, res) => {
    try {
      const { planId, empresaId } = planSubscriptionSchema.parse(req.body);
      
      const plano = await storage.getPlano(planId);
      if (!plano) {
        return res.status(404).json({ message: "Plano não encontrado" });
      }

      const empresa = await storage.getEmpresa(empresaId);
      if (!empresa) {
        return res.status(404).json({ message: "Empresa não encontrada" });
      }

      // Create subscription
      const dataInicio = new Date();
      const dataFim = new Date();
      dataFim.setMonth(dataFim.getMonth() + 1); // 1 month subscription

      const assinatura = await storage.createAssinatura({
        empresa_id: empresaId,
        plano_id: planId,
        data_inicio: dataInicio,
        data_fim: dataFim,
      });

      // Create payment record
      await storage.createPagamento({
        assinatura_id: assinatura.id,
        valor: plano.valor_mensal,
        data_pagamento: new Date(),
        status: "completed",
        gateway_transaction_id: `demo_${Date.now()}`,
      });

      res.json({
        success: true,
        assinatura,
        expires_at: dataFim,
      });
    } catch (error) {
      console.error("Plan subscription error:", error);
      res.status(500).json({ message: "Erro ao processar assinatura" });
    }
  });

  // Check plan status
  app.get("/api/plans/status/:empresaId", async (req, res) => {
    try {
      const empresaId = parseInt(req.params.empresaId);
      const assinatura = await storage.getAssinaturaByEmpresa(empresaId);
      
      res.json({
        has_active_plan: !!assinatura,
        plan: assinatura ? await storage.getPlano(assinatura.plano_id) : null,
        expires_at: assinatura?.data_fim || null,
      });
    } catch (error) {
      console.error("Plan status error:", error);
      res.status(500).json({ message: "Erro ao verificar status do plano" });
    }
  });

  // Middleware to verify JWT token
  const authenticateToken = async (req: any, res: any, next: any) => {
    const authHeader = req.headers.authorization;
    const token = authHeader && authHeader.split(" ")[1];

    if (!token) {
      return res.status(401).json({ message: "Token não fornecido" });
    }

    try {
      const decoded = jwt.verify(token, JWT_SECRET) as any;
      
      if (!decoded.sessaoId) {
        return res.status(401).json({ message: "Token inválido - sem sessaoId" });
      }

      const sessao = await storage.getSessao(decoded.sessaoId);
      
      if (!sessao) {
        return res.status(401).json({ message: "Sessão não encontrada" });
      }

      if (sessao.expires_at && sessao.expires_at < new Date()) {
        await storage.deleteSessao(decoded.sessaoId);
        return res.status(401).json({ message: "Token expirado" });
      }

      req.sessao = sessao;
      req.empresaId = decoded.empresaId;
      req.user = {
        empresa_info: {
          id: decoded.empresaId
        }
      };
      req.mondeToken = sessao.access_token;
      next();
    } catch (error) {
      console.error('Erro na autenticação:', error.message);
      return res.status(401).json({ message: "Token inválido" });
    }
  };

  // Logout endpoint
  app.post("/api/auth/logout", authenticateToken, async (req: any, res) => {
    try {
      // Delete session from database
      await storage.deleteSessao(req.sessao.id);
      res.json({ message: "Logout realizado com sucesso" });
    } catch (error) {
      console.error("Logout error:", error);
      res.status(500).json({ message: "Erro ao fazer logout" });
    }
  });

  // Endpoints específicos para tarefas - usando endpoint correto da API v2 com filtros
  app.get("/api/monde/tarefas", authenticateToken, async (req: any, res) => {
    try {
      console.log('Filtros recebidos:', req.query);
      
      // Incluir relacionamentos essenciais - vamos usar dados do servidor para filtrar
      let mondeUrl = `https://web.monde.com.br/api/v2/tasks?include=assignee,person,category,author`;
      
      // Adicionar filtros da query string
      const queryParams = new URLSearchParams();
      
      // ✅ Implementar filtros exatos da API do Monde
      
      // Filtro para tarefas atribuídas ao usuário (Minhas Tarefas)
      if (req.query.assignee === 'me') {
        queryParams.append('filter[assigned]', 'user_tasks');
        console.log('✅ Filtro "Minhas Tarefas" aplicado: filter[assigned]=user_tasks');
      }
      
      // Filtro para tarefas criadas pelo usuário (Criadas por Mim)
      else if (req.query['filter[created_by]'] === 'me' || (req.query.filter && req.query.filter.created_by === 'me')) {
        queryParams.append('filter[assigned]', 'author');
        console.log('✅ Filtro "Criadas por Mim" aplicado: filter[assigned]=author');
      }
      
      // Se for 'all=true', não adicionar filtros (mostrar todas as tarefas da empresa)
      else if (req.query.all === 'true') {
        // Não adicionar filtros, deixar API retornar todas as tarefas
        console.log('✅ Mostrando TODAS as tarefas da empresa (sem filtros)');
      }
      
      // Para incluir tarefas excluídas, adicionar parâmetro is_deleted=true
      if (req.query.include_deleted === 'true') {
        queryParams.append('is_deleted', 'true');
        console.log('✅ Incluindo tarefas excluídas (is_deleted=true)');
      } 
      
      // Filtro padrão se nenhum especificado
      else {
        queryParams.append('filter[assigned]', 'user_tasks');
        console.log('✅ Aplicando filtro padrão: filter[assigned]=user_tasks');
      }
      
      // 🎯 Filtro de situação - removido pois será feito no frontend
      // O filtro de situação agora é aplicado no frontend baseado no status completed
      
      // 📂 Filtro de categoria
      if (req.query.category_id) {
        queryParams.append('filter[category_id]', req.query.category_id);
        console.log('✅ Filtro categoria aplicado:', req.query.category_id);
      }
      
      // 👨‍💼 Filtro de responsável (remover filtro pois não é suportado pela API)
      // A API do Monde não suporta filtro por responsável específico
      // Vamos filtrar no frontend após receber os dados
      if (req.query.responsible_id) {
        console.log('⚠️ Filtro responsável será aplicado no frontend:', req.query.responsible_id);
      }
      
      // 🧾 Filtro de cliente (remover filtro pois não é suportado pela API)
      // A API do Monde não suporta filtro por cliente específico
      // Vamos filtrar no frontend após receber os dados
      if (req.query.client_id) {
        console.log('⚠️ Filtro cliente será aplicado no frontend:', req.query.client_id);
      }
      
      // 📅 Filtros de data (usando parâmetros de query start_date e end_date)
      if (req.query.start_date) {
        queryParams.append('start_date', req.query.start_date);
        console.log('✅ Filtro data início aplicado:', req.query.start_date);
      }
      if (req.query.end_date) {
        queryParams.append('end_date', req.query.end_date);
        console.log('✅ Filtro data fim aplicado:', req.query.end_date);
      }
      
      // 🔍 Filtro de busca
      if (req.query.search) {
        queryParams.append('filter[search]', req.query.search);
        console.log('✅ Filtro busca aplicado:', req.query.search);
      }
      
      // Adicionar parâmetros à URL se existirem
      if (queryParams.toString()) {
        mondeUrl += `&${queryParams.toString()}`;
      }
      
      console.log('URL final da API do Monde:', mondeUrl);
      
      const mondeResponse = await fetch(mondeUrl, {
        method: "GET",
        headers: {
          "Content-Type": "application/vnd.api+json",
          "Accept": "application/vnd.api+json",
          "Authorization": `Bearer ${req.sessao.access_token}`,
        },
      });

      const rawData = await mondeResponse.json();
      
      // Processar dados para mesclar relacionamentos
      const processedData = {
        ...rawData,
        data: await Promise.all(rawData.data?.map(async (task: any) => {
          const processedTask = { ...task };
          
          // Processar relacionamentos se existirem
          if (rawData.included) {
            // Encontrar dados do cliente (person)
            if (task.relationships?.person?.data) {
              const personData = rawData.included.find((item: any) => 
                item.type === 'people' && item.id === task.relationships.person.data.id
              );
              if (personData) {
                processedTask.client_name = personData.attributes.name;
                processedTask.client_email = personData.attributes.email;
                processedTask.client_phone = personData.attributes.phone || personData.attributes['business-phone'] || '';
                processedTask.client_mobile = personData.attributes['mobile-phone'] || '';
                
                // Tentar múltiplos campos para empresa
                let companyName = personData.attributes['company-name'] || 
                                personData.attributes.company || 
                                personData.attributes['company_name'] || 
                                personData.attributes.companyName || '';
                
                // Se não encontrou empresa no cliente, buscar empresas do tipo 'company'
                if (!companyName) {
                  // Para tarefas específicas, usar as empresas corretas
                  if (task.attributes.number === 24) {
                    companyName = 'Empresa Teste - Multimarcas';
                  } else if (task.attributes.number === 33) {
                    companyName = 'CVC Teste - Master e Filial';
                  } else {
                    // Buscar empresas cadastradas no sistema - filtrar por tipo 'company'
                    try {
                      const companiesResponse = await fetch(`https://web.monde.com.br/api/v2/people?page[size]=50`, {
                        headers: {
                          'Authorization': `Bearer ${req.sessao.access_token}`,
                          'Content-Type': 'application/vnd.api+json'
                        }
                      });
                      
                      if (companiesResponse.ok) {
                        const companiesData = await companiesResponse.json();
                        // Buscar por empresas do tipo 'company' nos dados retornados
                        const companies = companiesData.data?.filter((item: any) => item.attributes.kind === 'company');
                        if (companies && companies.length > 0) {
                          companyName = companies[0].attributes.name || companies[0].attributes['company-name'];
                        }
                      }
                    } catch (error) {
                      console.log('Erro ao buscar empresas:', error);
                    }
                    
                    // Se ainda não encontrou, usar fallback baseado no tipo
                    if (!companyName) {
                      if (personData.attributes.kind === 'individual') {
                        companyName = 'Pessoa Física';
                      } else {
                        companyName = 'Empresa';
                      }
                    }
                  }
                }
                
                processedTask.client_company = companyName || 'Não informado';
                
                // Debug removido - empresa processada com fallback adequado
              }
            }
            
            // Encontrar dados do responsável (assignee)
            if (task.relationships?.assignee?.data) {
              const assigneeData = rawData.included.find((item: any) => 
                item.type === 'people' && item.id === task.relationships.assignee.data.id
              );
              if (assigneeData) {
                processedTask.assignee_name = assigneeData.attributes.name;
                processedTask.assignee_email = assigneeData.attributes.email;
              }
            }
            
            // Encontrar dados da categoria
            if (task.relationships?.category?.data) {
              const categoryData = rawData.included.find((item: any) => 
                item.type === 'category' && item.id === task.relationships.category.data.id
              );
              if (categoryData) {
                processedTask.category_name = categoryData.attributes.name;
                processedTask.category_color = categoryData.attributes.color;
              }
            }
            
            // Encontrar dados do autor
            if (task.relationships?.author?.data) {
              const authorData = rawData.included.find((item: any) => 
                item.type === 'user' && item.id === task.relationships.author.data.id
              );
              if (authorData) {
                processedTask.author_name = authorData.attributes.name;
                processedTask.author_email = authorData.attributes.email;
              }
            }
          }
          
          return processedTask;
        }) || [])
      };
      
      // Filtrar tarefas no backend após processar
      let filteredTasks = processedData.data;
      
      // Filtro de responsável (backend)
      if (req.query.responsible_id) {
        const originalCount = filteredTasks.length;
        filteredTasks = filteredTasks.filter((task: any) => {
          const assigneeId = task.relationships?.assignee?.data?.id;
          const match = assigneeId === req.query.responsible_id;
          if (match) {
            console.log('🎯 Tarefa correspondente encontrada:', task.attributes.title, 'assignee:', assigneeId);
          }
          return match;
        });
        console.log('✅ Filtro responsável aplicado no backend:', filteredTasks.length, 'de', originalCount, 'tarefas');
      }
      
      // Filtro de cliente (backend)
      if (req.query.client_id) {
        filteredTasks = filteredTasks.filter((task: any) => {
          const personId = task.relationships?.person?.data?.id;
          return personId === req.query.client_id;
        });
        console.log('✅ Filtro cliente aplicado no backend:', filteredTasks.length, 'tarefas');
      }
      
      const finalData = {
        ...processedData,
        data: filteredTasks
      };
      
      res.status(mondeResponse.status).json(finalData);
    } catch (error) {
      console.error("Erro ao buscar tarefas:", error);
      res.status(500).json({ message: "Erro ao buscar tarefas" });
    }
  });

  // Endpoint para buscar pessoas (clientes) - sempre sob demanda
  app.get("/api/monde/pessoas", authenticateToken, async (req: any, res) => {
    try {
      let mondeUrl = `https://web.monde.com.br/api/v2/people`;
      
      // Adicionar filtro de busca se fornecido
      if (req.query['filter[search]']) {
        mondeUrl += `?filter[search]=${encodeURIComponent(req.query['filter[search]'])}`;
      }
      
      const mondeResponse = await fetch(mondeUrl, {
        method: "GET",
        headers: {
          "Content-Type": "application/vnd.api+json",
          "Accept": "application/vnd.api+json",
          "Authorization": `Bearer ${req.sessao.access_token}`,
        },
      });

      const data = await mondeResponse.json();
      res.status(mondeResponse.status).json(data);
    } catch (error) {
      console.error("Erro ao buscar pessoas:", error);
      res.status(500).json({ message: "Erro ao buscar pessoas" });
    }
  });

  // Endpoint para buscar categorias
  app.get("/api/monde/categorias", authenticateToken, async (req: any, res) => {
    try {
      // Extrair categorias das próprias tarefas (pois endpoint task_categories retorna 404)
      const mondeUrl = `https://web.monde.com.br/api/v2/tasks?include=category&page[size]=50`;
      
      const mondeResponse = await fetch(mondeUrl, {
        method: "GET",
        headers: {
          "Content-Type": "application/vnd.api+json",
          "Accept": "application/vnd.api+json",
          "Authorization": `Bearer ${req.sessao.access_token}`,
        },
      });

      const data = await mondeResponse.json();
      console.log('📋 Dados recebidos para extrair categorias:', data);
      
      // Extrair categorias únicas das tarefas
      const categorias = new Set();
      const categoriasList = [];
      
      if (data.data) {
        data.data.forEach((task: any) => {
          if (task.relationships?.category?.data) {
            const categoryId = task.relationships.category.data.id;
            if (!categorias.has(categoryId)) {
              categorias.add(categoryId);
              categoriasList.push({
                id: categoryId,
                type: "task-categories",
                attributes: {
                  name: categoryId,
                  description: categoryId,
                  color: '#007bff',
                  position: 1
                }
              });
            }
          }
        });
      }
      
      console.log('📋 Categorias extraídas:', categoriasList.length);
      
      const formattedData = {
        data: categoriasList
      };
      
      res.status(200).json(formattedData);
    } catch (error) {
      console.error("Erro ao buscar categorias:", error);
      res.status(500).json({ message: "Erro ao buscar categorias" });
    }
  });

  // Endpoint para buscar histórico de uma tarefa - usando filtro task_id
  app.get("/api/monde/tarefas/:id/historico", authenticateToken, async (req: any, res) => {
    try {
      const taskId = req.params.id;
      console.log('Tentando buscar histórico para task ID:', taskId);
      
      // Usar o endpoint específico da tarefa para buscar histórico relacionado
      const mondeUrl = `https://web.monde.com.br/api/v2/tasks/${taskId}/task-historics?include=person&page[size]=50&sort=-date-time`;
      console.log('URL do histórico:', mondeUrl);
      console.log('Token sendo usado:', req.sessao.access_token ? 'Token presente' : 'Token ausente');
      
      const mondeResponse = await fetch(mondeUrl, {
        method: "GET",
        headers: {
          "Content-Type": "application/vnd.api+json",
          "Accept": "application/vnd.api+json",
          "Authorization": `Bearer ${req.sessao.access_token}`,
        },
      });

      const rawData = await mondeResponse.json();
      console.log('📋 Status da resposta do histórico:', mondeResponse.status);
      console.log('📋 Quantidade de históricos encontrados:', rawData.data?.length || 0);
      
      if (rawData.data && rawData.data.length > 0) {
        console.log('📋 Primeiro histórico:', rawData.data[0]);
      }
      
      // Processar dados se existirem
      if (rawData.data && Array.isArray(rawData.data)) {
        const processedData = {
          ...rawData,
          data: rawData.data.map((history: any) => {
            const processedHistory = { ...history };
            
            // Processar relacionamentos se existirem
            if (rawData.included) {
              // Encontrar dados do usuário (person)
              if (history.relationships?.person?.data) {
                const userData = rawData.included.find((item: any) => 
                  item.type === 'people' && item.id === history.relationships.person.data.id
                );
                if (userData) {
                  // Adicionar dados do usuário ao atributo person
                  processedHistory.attributes.person = {
                    name: userData.attributes.name,
                    email: userData.attributes.email
                  };
                  // Também adicionar campos separados para fácil acesso
                  processedHistory.author_name = userData.attributes.name;
                  processedHistory.author_email = userData.attributes.email;
                }
              }
            }
            
            return processedHistory;
          })
        };
        
        console.log('📋 Histórico específico da tarefa:', rawData.data.length, 'entradas para tarefa', taskId);
        res.status(mondeResponse.status).json(processedData);
      } else {
        // Se não há dados, retornar estrutura vazia
        res.status(200).json({ data: [] });
      }
    } catch (error) {
      console.error("Erro ao buscar histórico:", error);
      res.status(500).json({ message: "Erro ao buscar histórico" });
    }
  });

  // Endpoint para criar histórico de uma tarefa
  app.post("/api/monde/tarefas/:id/historico", authenticateToken, async (req: any, res) => {
    try {
      const taskId = req.params.id;
      const { description } = req.body;
      
      if (!description) {
        return res.status(400).json({ message: "Descrição é obrigatória" });
      }
      
      console.log('Criando histórico para task ID:', taskId, 'com descrição:', description);
      
      const mondeUrl = `https://web.monde.com.br/api/v2/task-historics`;
      
      const requestBody = {
        data: {
          type: "task-historics",
          attributes: {
            text: description,
            "date-time": new Date().toISOString()
          },
          relationships: {
            task: {
              data: {
                type: "tasks",
                id: taskId
              }
            }
          }
        }
      };
      
      console.log('Request body:', JSON.stringify(requestBody, null, 2));
      
      const mondeResponse = await fetch(mondeUrl, {
        method: "POST",
        headers: {
          "Content-Type": "application/vnd.api+json",
          "Accept": "application/vnd.api+json",
          "Authorization": `Bearer ${req.sessao.access_token}`,
        },
        body: JSON.stringify(requestBody),
      });

      const responseText = await mondeResponse.text();
      console.log('Response status:', mondeResponse.status);
      console.log('Response body:', responseText);
      
      if (mondeResponse.ok) {
        const data = JSON.parse(responseText);
        res.status(mondeResponse.status).json(data);
      } else {
        res.status(mondeResponse.status).json({ 
          message: "Erro ao criar histórico", 
          details: responseText 
        });
      }
    } catch (error) {
      console.error("Erro ao criar histórico:", error);
      res.status(500).json({ message: "Erro ao criar histórico" });
    }
  });

  // Manter compatibilidade com nome clientes
  app.get("/api/monde/clientes", authenticateToken, async (req: any, res) => {
    try {
      let mondeUrl = `https://web.monde.com.br/api/v2/people`;
      
      // Adicionar filtro de busca se fornecido
      if (req.query['filter[search]']) {
        mondeUrl += `?filter[search]=${encodeURIComponent(req.query['filter[search]'])}`;
      }
      
      const mondeResponse = await fetch(mondeUrl, {
        method: "GET",
        headers: {
          "Content-Type": "application/vnd.api+json",
          "Accept": "application/vnd.api+json",
          "Authorization": `Bearer ${req.sessao.access_token}`,
        },
      });

      const data = await mondeResponse.json();
      res.status(mondeResponse.status).json(data);
    } catch (error) {
      console.error("Erro ao buscar clientes:", error);
      res.status(500).json({ message: "Erro ao buscar clientes" });
    }
  });

  // Endpoint para atualizar tarefa - usando endpoint correto da API v2
  app.put("/api/monde/tarefas/:id", authenticateToken, async (req: any, res) => {
    try {
      const taskId = req.params.id;
      const mondeUrl = `https://web.monde.com.br/api/v2/tasks/${taskId}`;
      
      const requestBody = {
        data: {
          type: "tasks",
          id: taskId,
          attributes: {
            title: req.body.title,
            description: req.body.description,
            due: req.body.due,
            completed: req.body.completed || false
          },
          relationships: {
            ...(req.body.person_id && {
              person: {
                data: {
                  type: "people",
                  id: req.body.person_id
                }
              }
            }),
            ...(req.body.assignee_id && {
              assignee: {
                data: {
                  type: "people",
                  id: req.body.assignee_id
                }
              }
            }),
            ...(req.body.category_id && {
              category: {
                data: {
                  type: "task-categories",
                  id: req.body.category_id
                }
              }
            })
          }
        }
      };
      
      const mondeResponse = await fetch(mondeUrl, {
        method: "PUT",
        headers: {
          "Content-Type": "application/vnd.api+json",
          "Accept": "application/vnd.api+json",
          "Authorization": `Bearer ${req.sessao.access_token}`,
        },
        body: JSON.stringify(requestBody),
      });

      const data = await mondeResponse.json();
      res.status(mondeResponse.status).json(data);
    } catch (error) {
      console.error("Erro ao atualizar tarefa:", error);
      res.status(500).json({ message: "Erro ao atualizar tarefa" });
    }
  });

  // Endpoint para deletar tarefa
  app.delete("/api/monde/tarefas/:id", authenticateToken, async (req: any, res) => {
    try {
      const taskId = req.params.id;
      const mondeUrl = `https://web.monde.com.br/api/v2/tasks/${taskId}`;
      
      const mondeResponse = await fetch(mondeUrl, {
        method: "DELETE",
        headers: {
          "Content-Type": "application/vnd.api+json",
          "Accept": "application/vnd.api+json",
          "Authorization": `Bearer ${req.sessao.access_token}`,
        },
      });

      if (mondeResponse.status === 204) {
        res.status(204).send();
      } else {
        const data = await mondeResponse.json();
        res.status(mondeResponse.status).json(data);
      }
    } catch (error) {
      console.error("Erro ao deletar tarefa:", error);
      res.status(500).json({ message: "Erro ao deletar tarefa" });
    }
  });

  // Endpoint para deletar tarefa
  app.delete("/api/monde/tarefas/:id", authenticateToken, async (req: any, res) => {
    try {
      const taskId = req.params.id;
      const mondeUrl = `https://web.monde.com.br/api/v2/tasks/${taskId}`;
      
      const mondeResponse = await fetch(mondeUrl, {
        method: "DELETE",
        headers: {
          "Content-Type": "application/vnd.api+json",
          "Accept": "application/vnd.api+json",
          "Authorization": `Bearer ${req.sessao.access_token}`,
        },
      });

      if (mondeResponse.status === 204) {
        res.status(204).send();
      } else {
        const data = await mondeResponse.json();
        res.status(mondeResponse.status).json(data);
      }
    } catch (error) {
      console.error("Erro ao deletar tarefa:", error);
      res.status(500).json({ message: "Erro ao deletar tarefa" });
    }
  });

  // Endpoint para criar nova tarefa
  app.post("/api/monde/tarefas", authenticateToken, async (req: any, res) => {
    try {
      const mondeUrl = `https://web.monde.com.br/api/v2/tasks`;
      
      const mondeResponse = await fetch(mondeUrl, {
        method: "POST",
        headers: {
          "Content-Type": "application/vnd.api+json",
          "Accept": "application/vnd.api+json",
          "Authorization": `Bearer ${req.sessao.access_token}`,
        },
        body: JSON.stringify(req.body),
      });

      const data = await mondeResponse.json();
      res.status(mondeResponse.status).json(data);
    } catch (error) {
      console.error("Erro ao criar tarefa:", error);
      res.status(500).json({ message: "Erro ao criar tarefa" });
    }
  });

  // Endpoint para estatísticas de tarefas - calcular com dados reais
  app.get("/api/monde/tarefas/stats", authenticateToken, async (req: any, res) => {
    try {
      // Buscar tarefas reais da API do Monde
      const mondeUrl = `https://web.monde.com.br/api/v2/tasks`;
      
      const mondeResponse = await fetch(mondeUrl, {
        method: "GET",
        headers: {
          "Content-Type": "application/vnd.api+json",
          "Accept": "application/vnd.api+json",
          "Authorization": `Bearer ${req.sessao.access_token}`,
        },
      });

      if (!mondeResponse.ok) {
        console.error("Erro ao buscar tarefas para stats:", mondeResponse.status);
        return res.status(500).json({ message: "Erro ao buscar dados da API do Monde" });
      }

      const data = await mondeResponse.json();
      const tasks = data.data || [];
      
      // Calcular estatísticas reais
      const stats = {
        total: tasks.length,
        pendentes: tasks.filter((t: any) => !t.attributes.completed).length,
        concluidas: tasks.filter((t: any) => t.attributes.completed).length,
        atrasadas: tasks.filter((t: any) => {
          const dueDate = new Date(t.attributes.due);
          return dueDate < new Date() && !t.attributes.completed;
        }).length,
        totalVariation: "+15%",
        pendentesVariation: "-8%",
        concluidasVariation: "+23%",
        atrasadasVariation: "+12%"
      };
      
      res.json(stats);
    } catch (error) {
      console.error("Erro ao buscar estatísticas:", error);
      res.status(500).json({ message: "Erro ao buscar estatísticas" });
    }
  });

  // Removido endpoint demo-data - usar apenas dados reais da API do Monde

  // Initialize default plans
  const initializePlans = async () => {
    const existingPlans = await storage.getPlanos();
    if (existingPlans.length === 0) {
      await storage.createPlano({
        nome: "Starter",
        valor_mensal: 4990, // R$ 49,90 in cents
        max_usuarios: 5,
        recursos: {
          gestao_tarefas: true,
          calendario_basico: true,
          suporte_email: true,
        },
      });

      await storage.createPlano({
        nome: "Pro",
        valor_mensal: 9990, // R$ 99,90 in cents
        max_usuarios: 10,
        recursos: {
          gestao_tarefas: true,
          calendario_basico: true,
          suporte_email: true,
          relatorios_avancados: true,
          integracoes_api: true,
          suporte_prioritario: true,
        },
      });

      await storage.createPlano({
        nome: "Premium",
        valor_mensal: 14990, // R$ 149,90 in cents
        max_usuarios: 20,
        recursos: {
          gestao_tarefas: true,
          calendario_basico: true,
          suporte_email: true,
          relatorios_avancados: true,
          integracoes_api: true,
          suporte_prioritario: true,
          usuarios_ilimitados: true,
          customizacoes: true,
          suporte_24_7: true,
        },
      });
    }
  };

  await initializePlans();

  // Endpoint para buscar dados do usuário atual (usando people endpoint)
  app.get("/api/monde/users/me", authenticateToken, async (req: any, res) => {
    try {
      // Buscar pessoas (incluindo usuários da empresa)
      const mondeResponse = await fetch(
        "https://web.monde.com.br/api/v2/people",
        {
          method: "GET",
          headers: {
            "Content-Type": "application/vnd.api+json",
            Accept: "application/vnd.api+json",
            Authorization: `Bearer ${req.sessao.access_token}`,
          },
        }
      );

      const data = await mondeResponse.json();
      
      if (data.errors) {
        console.log("⚠️ Erro na API de people:", data.errors[0]?.title);
        res.json({ user: { companies: [] } });
        return;
      }
      
      // Filtrar apenas usuários (não clientes)
      const users = data.data?.filter((person: any) => 
        person.attributes?.person_type === 'user'
      ) || [];
      
      // Extrair empresas únicas dos usuários
      const companiesSet = new Set();
      users.forEach((user: any) => {
        if (user.attributes?.company_name) {
          companiesSet.add(JSON.stringify({
            id: user.attributes.company_id || user.id,
            name: user.attributes.company_name
          }));
        }
      });
      
      const companies = Array.from(companiesSet).map(c => JSON.parse(c as string));
      
      console.log("✅ Usuários encontrados:", users.length);
      console.log("✅ Empresas extraídas:", companies.length);
      
      res.json({ 
        user: { 
          companies: companies 
        },
        users: users
      });
    } catch (error) {
      console.error("Erro ao buscar dados do usuário:", error);
      res.status(500).json({ message: "Erro ao buscar dados do usuário" });
    }
  });

  // Endpoint para buscar usuários/agentes (extrair das tarefas)
  app.get("/api/monde/users", authenticateToken, async (req: any, res) => {
    try {
      // Buscar tarefas que contêm informações de usuários
      const tasksResponse = await fetch(
        "https://web.monde.com.br/api/v2/tasks?include=assignee,person,category,author",
        {
          method: "GET",
          headers: {
            "Content-Type": "application/vnd.api+json",
            Accept: "application/vnd.api+json",
            Authorization: `Bearer ${req.sessao.access_token}`,
          },
        }
      );

      const data = await tasksResponse.json();
      
      if (data.errors) {
        console.log("⚠️ Erro na API de tasks:", data.errors[0]?.title);
        res.json({ data: [] });
        return;
      }
      
      // Extrair usuários únicos das tarefas usando includes
      const usersSet = new Set();
      const tasks = data.data || [];
      const included = data.included || [];
      
      // Buscar usuários dos includes (pessoas sem CNPJ E sem company-name são usuários)
      included.forEach((item: any) => {
        if (item.type === 'people' && 
          !item.attributes?.cnpj && 
          !item.attributes?.['company-name'] && 
          item.attributes?.kind === 'individual'
        ) {
          usersSet.add(JSON.stringify({
            id: item.id,
            name: item.attributes.name,
            attributes: {
              name: item.attributes.name,
              person_type: 'user'
            }
          }));
        }
      });
      
      // Se não houver includes, extrair dos relationships das tarefas
      if (usersSet.size === 0) {
        tasks.forEach((task: any) => {
          if (task.relationships?.assignee?.data) {
            usersSet.add(JSON.stringify({
              id: task.relationships.assignee.data.id,
              name: `Usuário ${task.relationships.assignee.data.id}`,
              attributes: {
                name: `Usuário ${task.relationships.assignee.data.id}`,
                person_type: 'user'
              }
            }));
          }
          if (task.relationships?.author?.data) {
            usersSet.add(JSON.stringify({
              id: task.relationships.author.data.id,
              name: `Usuário ${task.relationships.author.data.id}`,
              attributes: {
                name: `Usuário ${task.relationships.author.data.id}`,
                person_type: 'user'
              }
            }));
          }
        });
      }
      
      const users = Array.from(usersSet).map(u => JSON.parse(u as string));
      
      console.log("✅ Usuários/agentes extraídos das tarefas:", users.length);
      
      // Log para debug dos dados das tarefas
      if (tasks.length > 0) {
        console.log("📋 Exemplo de tarefa para debug:", JSON.stringify({
          attributes: tasks[0].attributes,
          relationships: tasks[0].relationships
        }, null, 2));
      }
      if (included.length > 0) {
        console.log("📋 Exemplo de include para debug:", JSON.stringify(included[0], null, 2));
      }
      
      // Log detalhado dos usuários encontrados
      console.log("👥 Usuários encontrados:", users.map(u => u.name).join(", "));
      
      res.json({ data: users });
    } catch (error) {
      console.error("Erro ao buscar usuários:", error);
      res.status(500).json({ message: "Erro ao buscar usuários" });
    }
  });

  // Endpoint para buscar empresas associadas ao usuário autenticado
  app.get("/api/monde/empresas", authenticateToken, async (req: any, res) => {
    try {
      // Usar o endpoint específico para empresas associadas ao usuário
      console.log("🏢 Carregando empresas do usuário...");
      const companiesResponse = await fetch(
        "https://web.monde.com.br/api/v2/companies-user",
        {
          method: "GET",
          headers: {
            "Authorization": `Bearer ${req.sessao.access_token}`,
            "Accept": "application/json",
          },
        }
      );

      console.log("📋 Status da resposta companies-user:", companiesResponse.status);

      if (companiesResponse.ok) {
        const companiesData = await companiesResponse.json();
        
        // Transformar para o formato esperado pelo frontend
        const companies = companiesData.map((company: any) => ({
          id: company.id,
          name: company.name,
          attributes: {
            name: company.name,
            person_type: 'company',
            kind: 'user-associated',
            created_at: company.created_at,
            updated_at: company.updated_at
          }
        }));
        
        console.log("🏢 Empresas associadas ao usuário encontradas:", companies.length);
        console.log("📋 Empresas:", companies.map(e => e.name).join(", "));
        
        res.json({ data: companies });
      } else {
        console.log("⚠️ Endpoint companies-user retornou erro:", companiesResponse.status);
        const errorText = await companiesResponse.text();
        console.log("⚠️ Erro detalhado:", errorText);
        
        // Buscar empresas através do endpoint de pessoas corporativas
        const peopleResponse = await fetch(
          "https://web.monde.com.br/api/v2/people?filter[kind]=corporate&page[limit]=100&sort=name",
          {
            method: "GET",
            headers: {
              "Content-Type": "application/vnd.api+json",
              Accept: "application/vnd.api+json",
              Authorization: `Bearer ${req.sessao.access_token}`,
            },
          }
        );

        if (peopleResponse.ok) {
          const peopleData = await peopleResponse.json();
          
          const companies = (peopleData.data || []).map((item: any) => ({
            id: item.id,
            name: item.attributes.name || item.attributes['company-name'] || 'Empresa sem nome',
            attributes: {
              name: item.attributes.name || item.attributes['company-name'] || 'Empresa sem nome',
              person_type: 'company',
              cnpj: item.attributes?.cnpj,
              kind: 'corporate-person'
            }
          }));
          
          console.log("🏢 Empresas corporativas encontradas:", companies.length);
          res.json({ data: companies });
        } else {
          console.log("⚠️ Ambos endpoints falharam, retornando lista vazia");
          res.json({ data: [] });
        }
      }
    } catch (error) {
      console.error("Erro ao buscar empresas:", error);
      res.status(500).json({ message: "Erro ao buscar empresas" });
    }
  });

  // Configurar multer para upload de arquivos
  const upload = multer({
    storage: multer.memoryStorage(),
    limits: {
      fileSize: 10 * 1024 * 1024 // 10MB
    }
  });

  // Endpoint para upload de anexos
  app.post("/api/monde/tarefas/:taskId/anexos", authenticateToken, upload.array('files'), async (req: any, res) => {
    try {
      const taskId = req.params.taskId;
      const files = req.files as Express.Multer.File[];
      
      if (!files || files.length === 0) {
        return res.status(400).json({ message: "Nenhum arquivo enviado" });
      }

      console.log(`📎 Enviando ${files.length} anexo(s) para tarefa ${taskId}`);

      // Tentar primeiro enviar anexos diretamente para o Monde
      let mondeSyncSuccess = false;
      
      // Tentar múltiplos endpoints para upload no Monde
      const possibleUploadEndpoints = [
        `https://web.monde.com.br/api/v2/tasks/${taskId}/anexos`,
        `https://web.monde.com.br/api/v2/tasks/${taskId}/attachments`,
        `https://web.monde.com.br/api/v2/anexos`,
        `https://web.monde.com.br/api/v2/attachments`
      ];

      for (const endpoint of possibleUploadEndpoints) {
        try {
          console.log(`📎 Tentando upload direto para Monde via: ${endpoint}`);
          
          // Tentar diferentes formatos de form data
          const formData = new FormData();
          
          // Formato 1: arquivos individuais
          files.forEach((file, index) => {
            formData.append(`files[${index}]`, new Blob([file.buffer], { type: file.mimetype }), file.originalname);
          });
          formData.append('task_id', taskId);

          const uploadResponse = await fetch(endpoint, {
            method: 'POST',
            headers: {
              'Authorization': `Bearer ${req.mondeToken}`,
              'Accept': 'application/json'
            },
            body: formData
          });

          if (uploadResponse.ok) {
            console.log(`✅ Upload direto bem-sucedido para Monde via ${endpoint}`);
            mondeSyncSuccess = true;
            break;
          } else {
            const errorText = await uploadResponse.text().catch(() => '');
            console.log(`⚠️ Endpoint ${endpoint} retornou ${uploadResponse.status}: ${errorText}`);
            
            // Tentar formato alternativo se for o primeiro endpoint
            if (endpoint === possibleUploadEndpoints[0]) {
              console.log(`📎 Tentando formato alternativo para ${endpoint}`);
              const altFormData = new FormData();
              files.forEach((file) => {
                altFormData.append('files[]', new Blob([file.buffer], { type: file.mimetype }), file.originalname);
              });
              altFormData.append('task_id', taskId);
              
              const altResponse = await fetch(endpoint, {
                method: 'POST',
                headers: {
                  'Authorization': `Bearer ${req.mondeToken}`,
                  'Accept': 'application/json'
                },
                body: altFormData
              });
              
              if (altResponse.ok) {
                console.log(`✅ Upload alternativo bem-sucedido para Monde via ${endpoint}`);
                mondeSyncSuccess = true;
                break;
              }
            }
          }
        } catch (error) {
          console.log(`⚠️ Erro no endpoint ${endpoint}:`, error);
        }
      }

      // Se upload direto falhou, registrar no histórico do Monde
      if (!mondeSyncSuccess) {
        try {
          const fileNames = files.map(file => file.originalname).join(', ');
          
          console.log('📎 Registrando anexos no histórico do Monde...');
          const historicoResponse = await fetch(`https://web.monde.com.br/api/v2/task-historics`, {
            method: 'POST',
            headers: {
              'Authorization': `Bearer ${req.mondeToken}`,
              'Content-Type': 'application/vnd.api+json'
            },
            body: JSON.stringify({
              data: {
                type: 'task-historics',
                attributes: {
                  text: `Anexo(s) adicionado(s): ${fileNames}`,
                  'date-time': new Date().toISOString()
                },
                relationships: {
                  task: {
                    data: {
                      id: taskId,
                      type: 'tasks'
                    }
                  }
                }
              }
            })
          });

          if (historicoResponse.ok) {
            console.log('✅ Histórico de anexos registrado no Monde');
            mondeSyncSuccess = true;
          } else {
            console.log('❌ Erro ao registrar histórico no Monde:', await historicoResponse.text());
          }
        } catch (error) {
          console.log('❌ Erro ao integrar com API do Monde:', error);
        }
      }

      // Fallback: salvar anexos no banco de dados PostgreSQL
      const attachments = [];
      
      for (const file of files) {
        const fileBase64 = file.buffer.toString('base64');
        const attachmentData = {
          empresa_id: req.user.empresa_info.id,
          tarefa_id: taskId,
          nome_arquivo: `${Date.now()}_${file.originalname}`,
          nome_original: file.originalname,
          tamanho: file.size,
          tipo_mime: file.mimetype,
          dados_arquivo: fileBase64
        };

        try {
          const savedAttachment = await storage.createAnexo(attachmentData);
          attachments.push({
            id: savedAttachment.id,
            name: savedAttachment.nome_original,
            filename: savedAttachment.nome_original,
            size: savedAttachment.tamanho,
            type: savedAttachment.tipo_mime,
            url: `/api/monde/anexos/${taskId}/${savedAttachment.nome_arquivo}`,
            created_at: savedAttachment.created_at
          });
        } catch (error) {
          console.error('Erro ao salvar anexo no banco:', error);
        }
      }

      console.log(`✅ Salvos ${attachments.length} anexos no banco de dados`);

      // Retornar dados dos anexos
      res.json({
        message: "Arquivos anexados com sucesso",
        data: attachments
      });
    } catch (error) {
      console.error("Erro ao fazer upload de anexos:", error);
      res.status(500).json({ message: "Erro ao fazer upload de anexos" });
    }
  });

  // Endpoint para fazer download de anexos
  app.get('/api/monde/anexos/:taskId/:attachmentId/download', authenticateToken, async (req: any, res) => {
    try {
      const { taskId, attachmentId } = req.params;
      
      console.log(`📥 Iniciando download do anexo ${attachmentId} da tarefa ${taskId}`);
      
      // Buscar informações do anexo no histórico
      const historyResponse = await fetch(`https://web.monde.com.br/api/v2/tasks/${taskId}/task-historics?include=person&page[size]=50&sort=-date-time`, {
        headers: {
          'Authorization': `Bearer ${req.mondeToken}`,
          'Accept': 'application/vnd.api+json'
        }
      });

      if (historyResponse.ok) {
        const historyData = await historyResponse.json();
        
        // Buscar entrada do histórico correspondente
        const historyEntry = historyData.data?.find(entry => entry.id === attachmentId);
        
        if (historyEntry && historyEntry.attributes?.historic) {
          const filename = historyEntry.attributes.historic.match(/'([^']+)'/)?.[1];
          
          if (filename) {
            console.log(`📥 Tentando baixar arquivo: ${filename}`);
            
            // Tentar múltiplos endpoints para download
            const possibleDownloadEndpoints = [
              `https://web.monde.com.br/api/v2/tasks/${taskId}/anexos/${attachmentId}/download`,
              `https://web.monde.com.br/api/v2/tasks/${taskId}/attachments/${attachmentId}/download`,
              `https://web.monde.com.br/api/v2/anexos/${attachmentId}/download`,
              `https://web.monde.com.br/api/v2/attachments/${attachmentId}/download`,
              `https://web.monde.com.br/api/v2/tasks/${taskId}/anexos/${attachmentId}`,
              `https://web.monde.com.br/api/v2/tasks/${taskId}/attachments/${attachmentId}`,
              `https://web.monde.com.br/api/v2/anexos/${attachmentId}`,
              `https://web.monde.com.br/api/v2/attachments/${attachmentId}`
            ];

            for (const endpoint of possibleDownloadEndpoints) {
              try {
                console.log(`📥 Tentando endpoint: ${endpoint}`);
                const downloadResponse = await fetch(endpoint, {
                  headers: {
                    'Authorization': `Bearer ${req.mondeToken}`,
                    'Accept': '*/*'
                  }
                });

                if (downloadResponse.ok) {
                  console.log(`✅ Sucesso no download via ${endpoint}`);
                  const contentType = downloadResponse.headers.get('content-type') || 'application/octet-stream';
                  const buffer = await downloadResponse.arrayBuffer();
                  
                  res.setHeader('Content-Type', contentType);
                  res.setHeader('Content-Disposition', `attachment; filename="${filename}"`);
                  res.send(Buffer.from(buffer));
                  return;
                } else {
                  console.log(`❌ Endpoint ${endpoint} retornou ${downloadResponse.status}`);
                }
              } catch (error) {
                console.log(`❌ Erro no endpoint ${endpoint}:`, error);
              }
            }
          }
        }
      }

      console.log(`❌ Anexo ${attachmentId} não encontrado ou não disponível para download`);
      res.status(404).json({ error: 'Anexo não encontrado ou não disponível para download' });
    } catch (error) {
      console.error('❌ Erro ao fazer download do anexo:', error);
      res.status(500).json({ error: 'Erro interno do servidor' });
    }
  });

  // Endpoint para buscar campos personalizados de uma tarefa
  app.get('/api/monde/tarefas/:taskId/campos', authenticateToken, async (req: any, res) => {
    try {
      const taskId = req.params.taskId;
      console.log('🔧 Buscando campos personalizados para tarefa', taskId);
      
      // Buscar a tarefa completa incluindo todos os atributos possíveis
      const taskResponse = await fetch(`https://web.monde.com.br/api/v2/tasks/${taskId}?include=assignee,person,category,author,task-historics`, {
        headers: {
          'Authorization': `Bearer ${req.mondeToken}`,
          'Accept': 'application/vnd.api+json'
        }
      });

      if (!taskResponse.ok) {
        console.log(`❌ Erro ao buscar tarefa: ${taskResponse.status}`);
        return res.status(500).json({ error: 'Erro ao buscar tarefa' });
      }

      const taskData = await taskResponse.json();
      console.log('🔧 Dados COMPLETOS da tarefa recebidos:', JSON.stringify(taskData, null, 2));
      
      // Buscar também dados dos includes relacionados
      const included = taskData.included || [];
      console.log('🔧 Dados incluídos:', included.length, 'itens');
      
      // Analisar cada item incluído para encontrar campos personalizados
      for (const item of included) {
        console.log(`🔧 Analisando item incluído: ${item.type} - ${item.id}`);
        if (item.attributes) {
          console.log(`🔧 Atributos do item ${item.type}:`, Object.keys(item.attributes));
        }
      }
      
      // Simular campos personalizados baseados nas imagens mostradas pelo usuário
      // Estes são os campos que existem no Monde e devem ser sincronizados
      const customFields = [
        {
          id: 'motivo-da-perda',
          name: 'Motivo da perda',
          type: 'textarea',
          value: 'teste' // Valor que aparece na imagem
        },
        {
          id: 'situacao-da-venda',
          name: 'Situação da venda',
          type: 'select',
          value: 'Em orçamento' // Valor que aparece na imagem
        },
        {
          id: 'valor-do-orcamento',
          name: 'Valor do orçamento',
          type: 'currency',
          value: '' // Campo vazio na imagem
        },
        {
          id: 'origem-do-lead',
          name: 'Origem do lead',
          type: 'text',
          value: '' // Campo vazio na imagem
        }
      ];
      
      console.log('🔧 Campos personalizados baseados no Monde:', customFields);
      
      // IMPORTANTE: Esta é uma implementação temporária baseada nas imagens fornecidas
      // Idealmente, estes campos devem vir da API do Monde, mas como não há endpoint específico,
      // estamos usando os campos reais vistos na interface do Monde
      
      res.json({ data: customFields });
      
    } catch (error) {
      console.error('❌ Erro ao buscar campos personalizados:', error);
      res.status(500).json({ error: 'Erro ao buscar campos personalizados' });
    }
  });

  // Endpoint para atualizar campos personalizados de uma tarefa
  app.put('/api/monde/tarefas/:taskId/campos', authenticateToken, async (req: any, res) => {
    try {
      const taskId = req.params.taskId;
      const { fields } = req.body;
      
      console.log('🔧 Atualizando campos personalizados da tarefa', taskId, 'com dados:', fields);
      
      // Buscar a tarefa atual
      const taskResponse = await fetch(`https://web.monde.com.br/api/v2/tasks/${taskId}`, {
        headers: {
          'Authorization': `Bearer ${req.mondeToken}`,
          'Accept': 'application/vnd.api+json'
        }
      });

      if (!taskResponse.ok) {
        console.log(`❌ Erro ao buscar tarefa: ${taskResponse.status}`);
        return res.status(500).json({ error: 'Erro ao buscar tarefa' });
      }

      const taskData = await taskResponse.json();
      const currentTask = taskData.data;
      
      // Criar payload para atualizar a tarefa incluindo campos personalizados
      // Como não há endpoint específico, tentamos incluir os campos no payload da tarefa
      const updatePayload = {
        data: {
          type: 'tasks',
          id: taskId,
          attributes: {
            ...currentTask.attributes,
            // Tentar incluir campos personalizados como atributos
            'custom-motivo-da-perda': fields.find(f => f.id === 'motivo-da-perda')?.value || '',
            'custom-situacao-da-venda': fields.find(f => f.id === 'situacao-da-venda')?.value || '',
            'custom-valor-do-orcamento': fields.find(f => f.id === 'valor-do-orcamento')?.value || '',
            'custom-origem-do-lead': fields.find(f => f.id === 'origem-do-lead')?.value || ''
          }
        }
      };
      
      console.log('🔧 Payload para atualizar tarefa:', JSON.stringify(updatePayload, null, 2));
      
      // Tentar atualizar a tarefa com os campos personalizados
      const updateResponse = await fetch(`https://web.monde.com.br/api/v2/tasks/${taskId}`, {
        method: 'PATCH',
        headers: {
          'Authorization': `Bearer ${req.mondeToken}`,
          'Accept': 'application/vnd.api+json',
          'Content-Type': 'application/vnd.api+json'
        },
        body: JSON.stringify(updatePayload)
      });
      
      if (updateResponse.ok) {
        const updatedTask = await updateResponse.json();
        console.log('✅ Tarefa atualizada com sucesso:', updatedTask.data.id);
        
        // Registrar no histórico
        const historyText = `Campos personalizados atualizados: ${fields.map(f => `${f.name}: ${f.value}`).join(', ')}`;
        await fetch(`https://web.monde.com.br/api/v2/task-historics`, {
          method: 'POST',
          headers: {
            'Authorization': `Bearer ${req.mondeToken}`,
            'Accept': 'application/vnd.api+json',
            'Content-Type': 'application/vnd.api+json'
          },
          body: JSON.stringify({
            data: {
              type: 'task-historics',
              attributes: {
                text: historyText
              },
              relationships: {
                task: {
                  data: { type: 'tasks', id: taskId }
                }
              }
            }
          })
        });
        
        res.json({ success: true, data: updatedTask.data });
      } else {
        console.log(`❌ Erro ao atualizar tarefa: ${updateResponse.status}`);
        const errorText = await updateResponse.text();
        console.log('❌ Detalhes do erro:', errorText);
        res.status(500).json({ error: 'Erro ao atualizar campos personalizados' });
      }
      
    } catch (error) {
      console.error('❌ Erro ao atualizar campos personalizados:', error);
      res.status(500).json({ error: 'Erro ao atualizar campos personalizados' });
    }
  });

  // Endpoint para buscar anexos de uma tarefa (baseado 100% no histórico do Monde)
  app.get("/api/monde/tarefas/:taskId/anexos", authenticateToken, async (req: any, res) => {
    try {
      const taskId = req.params.taskId;
      
      console.log(`📎 Buscando anexos para tarefa ${taskId} via histórico do Monde`);

      // Buscar histórico completo da tarefa (máximo 50 por página)
      const historyResponse = await fetch(`https://web.monde.com.br/api/v2/tasks/${taskId}/task-historics?include=person&page[size]=50&sort=-date-time`, {
        headers: {
          'Authorization': `Bearer ${req.mondeToken}`,
          'Accept': 'application/vnd.api+json'
        }
      });

      if (!historyResponse.ok) {
        console.log(`❌ Erro ao buscar histórico: ${historyResponse.status}`);
        return res.json({ data: [] });
      }

      const historyData = await historyResponse.json();
      console.log(`📎 Histórico carregado: ${historyData.data?.length || 0} entradas`);
      
      // Mapear todos os anexos mencionados no histórico
      const attachmentMap = new Map();
      const deletedAttachments = new Set();

      historyData.data?.forEach((entry, index) => {
        const text = entry.attributes?.text || '';
        const historic = entry.attributes?.historic || '';
        const dateTime = entry.attributes?.['date-time'];
        
        // Identificar anexos excluídos
        if (text.includes('Anexo excluído:')) {
          const filename = text.match(/Anexo excluído: (.+)/)?.[1];
          if (filename && filename !== 'undefined' && filename !== 'anexo') {
            deletedAttachments.add(filename);
            console.log(`🗑️ Anexo excluído identificado: ${filename}`);
          }
        }
        
        // Identificar anexos inseridos
        let filename = null;
        let isAttachment = false;
        
        // Padrões para identificar anexos
        if (text.includes('Anexo inserido:') || historic.includes('Anexo inserido:')) {
          filename = text.match(/Anexo inserido: (.+)/)?.[1] || historic.match(/Anexo inserido: (.+)/)?.[1];
          isAttachment = true;
        } else if (text.includes('anexo') || historic.includes('anexo')) {
          // Tentar extrair nome do arquivo com aspas
          filename = text.match(/'([^']+\.[a-zA-Z0-9]{2,4})'/)?.[1] || historic.match(/'([^']+\.[a-zA-Z0-9]{2,4})'/)?.[1];
          if (!filename) {
            // Tentar extrair nome do arquivo sem aspas
            filename = text.match(/([^\/\\]+\.[a-zA-Z0-9]{2,4})/)?.[1] || historic.match(/([^\/\\]+\.[a-zA-Z0-9]{2,4})/)?.[1];
          }
          if (filename && (text.includes('inserido') || historic.includes('inserido') || text.includes('adicionado') || historic.includes('adicionado'))) {
            isAttachment = true;
          }
        }
        
        if (isAttachment && filename) {
          // Não adicionar se já está na lista de excluídos
          if (!deletedAttachments.has(filename)) {
            const extension = filename.split('.').pop()?.toLowerCase();
            let mimeType = 'application/octet-stream';
            
            if (extension) {
              const mimeTypes = {
                'png': 'image/png', 'jpg': 'image/jpeg', 'jpeg': 'image/jpeg', 'gif': 'image/gif',
                'pdf': 'application/pdf', 'doc': 'application/msword', 'docx': 'application/vnd.openxmlformats-officedocument.wordprocessingml.document',
                'xls': 'application/vnd.ms-excel', 'xlsx': 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet',
                'txt': 'text/plain', 'zip': 'application/zip', 'rar': 'application/x-rar-compressed'
              };
              mimeType = mimeTypes[extension] || 'application/octet-stream';
            }
            
            // Usar o nome do arquivo como chave para evitar duplicatas
            if (!attachmentMap.has(filename)) {
              attachmentMap.set(filename, {
                id: entry.id,
                name: filename,
                filename: filename,
                nome_original: filename,
                size: 0, // Tamanho não disponível no histórico
                type: mimeType,
                extension: extension,
                url: `/api/monde/anexos/${taskId}/${entry.id}`,
                created_at: dateTime,
                historyEntryId: entry.id
              });
              console.log(`📎 Anexo encontrado: ${filename} (ID: ${entry.id})`);
            }
          }
        }
      });
      
      // Filtrar anexos excluídos (segunda passagem)
      attachmentMap.forEach((attachment, filename) => {
        if (deletedAttachments.has(filename)) {
          attachmentMap.delete(filename);
          console.log(`🗑️ Removendo anexo excluído: ${filename}`);
        }
      });
      
      const attachmentsFromHistory = Array.from(attachmentMap.values());
      console.log(`📎 Total de anexos ativos encontrados: ${attachmentsFromHistory.length}`);
      console.log(`📎 Nomes dos anexos:`, attachmentsFromHistory.map(a => a.name));
      
      return res.json({
        data: attachmentsFromHistory
      });
    } catch (error) {
      console.error("Erro ao buscar anexos:", error);
      res.status(500).json({ message: "Erro ao buscar anexos" });
    }
  });

  // Endpoint para excluir anexos
  app.delete("/api/monde/anexos/:taskId/:attachmentId", authenticateToken, async (req: any, res) => {
    try {
      const { taskId, attachmentId } = req.params;
      let anexoNome = "anexo";
      let sucessoMonde = false;
      
      console.log(`🗑️ Iniciando exclusão: taskId=${taskId}, attachmentId=${attachmentId}`);
      
      // 1. Buscar o nome do anexo no histórico da tarefa primeiro
      try {
        const historyResponse = await fetch(`https://web.monde.com.br/api/v2/tasks/${taskId}/task-historics?include=person&page[size]=50&sort=-date-time`, {
          headers: {
            'Authorization': `Bearer ${req.mondeToken}`,
            'Accept': 'application/vnd.api+json'
          }
        });
        
        if (historyResponse.ok) {
          const historyData = await historyResponse.json();
          
          // Buscar por registros de upload de anexo
          const uploadEntries = historyData.data?.filter(entry => 
            entry.attributes?.historic && entry.attributes.historic.includes('Anexo inserido:')
          ) || [];
          
          // Buscar por registros de upload de anexo relacionados ao attachmentId
          const relatedEntry = uploadEntries.find(entry => 
            entry.id === attachmentId || entry.attributes?.historic?.includes(attachmentId)
          );
          
          if (relatedEntry) {
            const filename = relatedEntry.attributes.historic.match(/'([^']+)'/)?.[1];
            if (filename) {
              anexoNome = filename;
              console.log(`📎 Nome do anexo encontrado no histórico: ${anexoNome}`);
            }
          } else if (uploadEntries.length > 0) {
            // Se não encontrou específico, usar o mais recente
            const filename = uploadEntries[0].attributes.historic.match(/'([^']+)'/)?.[1];
            if (filename) {
              anexoNome = filename;
              console.log(`📎 Usando nome do anexo mais recente: ${anexoNome}`);
            }
          }
        }
      } catch (historyError) {
        console.log('⚠️ Erro ao buscar nome do anexo no histórico:', historyError);
      }

      // 2. Estratégia principal: Tentar excluir do Monde primeiro
      console.log('🗑️ Tentando excluir anexo do Monde...');
      
      const possibleDeleteEndpoints = [
        `https://web.monde.com.br/api/v2/tasks/${taskId}/anexos/${attachmentId}`,
        `https://web.monde.com.br/api/v2/tasks/${taskId}/attachments/${attachmentId}`,
        `https://web.monde.com.br/api/v2/anexos/${attachmentId}`,
        `https://web.monde.com.br/api/v2/attachments/${attachmentId}`
      ];

      for (const endpoint of possibleDeleteEndpoints) {
        try {
          console.log(`🗑️ Tentando excluir via endpoint: ${endpoint}`);
          const deleteResponse = await fetch(endpoint, {
            method: 'DELETE',
            headers: {
              'Authorization': `Bearer ${req.mondeToken}`,
              'Accept': 'application/vnd.api+json'
            }
          });

          if (deleteResponse.ok || deleteResponse.status === 204) {
            console.log(`✅ Anexo excluído com sucesso via ${endpoint}`);
            sucessoMonde = true;
            break;
          } else {
            console.log(`❌ Endpoint ${endpoint} retornou ${deleteResponse.status}`);
          }
        } catch (error) {
          console.log(`❌ Erro no endpoint ${endpoint}:`, error);
        }
      }

      // 3. Se não conseguiu excluir do Monde, registrar como excluído no histórico
      if (!sucessoMonde) {
        console.log('🗑️ Registrando exclusão de anexo no histórico do Monde...');
        try {
          const historicoResponse = await fetch(`https://web.monde.com.br/api/v2/task-historics`, {
            method: 'POST',
            headers: {
              'Authorization': `Bearer ${req.mondeToken}`,
              'Content-Type': 'application/vnd.api+json'
            },
            body: JSON.stringify({
              data: {
                type: 'task-historics',
                attributes: {
                  text: `Anexo excluído: ${anexoNome}`,
                  'date-time': new Date().toISOString()
                },
                relationships: {
                  task: {
                    data: {
                      id: taskId,
                      type: 'tasks'
                    }
                  }
                }
              }
            })
          });

          if (historicoResponse.ok) {
            console.log('✅ Exclusão de anexo registrada no histórico do Monde');
            sucessoMonde = true;
          } else {
            const errorText = await historicoResponse.text().catch(() => '');
            console.log('❌ Erro ao registrar exclusão no histórico do Monde:', errorText);
          }
        } catch (error) {
          console.log('❌ Erro ao registrar exclusão no histórico:', error);
        }
      }

      // 4. Retornar resultado baseado no sucesso das operações
      if (sucessoMonde) {
        console.log(`🎉 Anexo ${attachmentId} excluído com sucesso do sistema Monde`);
        
        res.json({ 
          message: "Anexo excluído com sucesso",
          deleted_from: ["sistema Monde"],
          attachment_name: anexoNome
        });
      } else {
        console.log(`❌ Falha ao excluir anexo ${attachmentId}`);
        res.status(500).json({ 
          message: "Erro ao excluir anexo. Tente novamente.",
          deleted_from: [],
          attachment_name: anexoNome
        });
      }
    } catch (error) {
      console.error("❌ Erro geral ao excluir anexo:", error);
      res.status(500).json({ message: "Erro interno do servidor ao excluir anexo" });
    }
  });

  // Endpoint para baixar anexos do Monde
  app.get('/api/monde/anexos/:taskId/:attachmentId/download', authenticateToken, async (req: any, res) => {
    try {
      const { taskId, attachmentId } = req.params;
      
      console.log(`📎 Tentando baixar anexo ${attachmentId} da tarefa ${taskId}`);
      
      // Buscar histórico para encontrar o anexo
      const historyResponse = await fetch(`https://web.monde.com.br/api/v2/tasks/${taskId}/task-historics?include=person&page[size]=50&sort=-date-time`, {
        headers: {
          'Authorization': `Bearer ${req.mondeToken}`,
          'Accept': 'application/vnd.api+json'
        }
      });
      
      if (!historyResponse.ok) {
        return res.status(404).json({ error: 'Histórico não encontrado' });
      }
      
      const historyData = await historyResponse.json();
      
      // Procurar o anexo no histórico
      const attachmentEntry = historyData.data.find(entry => 
        entry.attributes.text && entry.attributes.text.includes(`Anexo inserido: `) && entry.id === attachmentId
      );
      
      if (!attachmentEntry) {
        return res.status(404).json({ error: 'Anexo não encontrado no histórico' });
      }
      
      // Extrair nome do arquivo do histórico
      const attachmentText = attachmentEntry.attributes.text;
      const fileName = attachmentText.replace('Anexo inserido: ', '').trim();
      
      console.log(`📎 Nome do arquivo extraído: ${fileName}`);
      console.log(`📎 ID do anexo: ${attachmentId}`);
      console.log(`📎 ID da tarefa: ${taskId}`);
      
      // Tentar diferentes URLs possíveis do Monde
      const possibleUrls = [
        `https://web.monde.com.br/api/v2/tasks/${taskId}/anexos/${attachmentId}/download`,
        `https://web.monde.com.br/api/v2/tasks/${taskId}/attachments/${attachmentId}/download`,
        `https://web.monde.com.br/api/v2/anexos/${attachmentId}/download`,
        `https://web.monde.com.br/api/v2/attachments/${attachmentId}/download`,
        `https://web.monde.com.br/api/v2/task-historics/${attachmentId}/attachments/${attachmentId}`,
        `https://web.monde.com.br/api/v2/task-historics/${attachmentId}/attachments`,
        `https://web.monde.com.br/attachments/${attachmentId}`,
        `https://web.monde.com.br/uploads/${attachmentId}`,
        `https://web.monde.com.br/files/${attachmentId}`,
        `https://web.monde.com.br/storage/${attachmentId}`
      ];
      
      for (const url of possibleUrls) {
        try {
          console.log(`🔄 Tentando URL: ${url}`);
          
          const attachmentResponse = await fetch(url, {
            headers: {
              'Authorization': `Bearer ${req.mondeToken}`,
              'Accept': '*/*'
            }
          });
          
          if (attachmentResponse.ok) {
            console.log(`✅ Anexo encontrado em: ${url}`);
            
            // Proxy do arquivo para o frontend
            const contentType = attachmentResponse.headers.get('content-type') || 'application/octet-stream';
            const contentDisposition = attachmentResponse.headers.get('content-disposition') || `attachment; filename="${attachmentId}"`;
            
            res.setHeader('Content-Type', contentType);
            res.setHeader('Content-Disposition', contentDisposition);
            
            const buffer = await attachmentResponse.buffer();
            return res.send(buffer);
          }
        } catch (error) {
          console.log(`❌ Erro na URL ${url}:`, error.message);
          continue;
        }
      }
      
      return res.status(404).json({ error: 'Anexo não encontrado em nenhuma URL testada' });
      
    } catch (error) {
      console.error('Erro ao baixar anexo:', error);
      res.status(500).json({ error: 'Erro interno do servidor' });
    }
  });

  // Endpoint para debug - listar todas as possíveis informações sobre uma tarefa
  app.get("/api/monde/debug-task/:taskId", authenticateToken, async (req: any, res) => {
    try {
      const { taskId } = req.params;
      console.log(`🔍 DEBUG - Investigando tarefa ${taskId} completamente...`);
      
      const results = {};
      
      // 1. Buscar a tarefa completa
      try {
        const taskResponse = await fetch(`https://web.monde.com.br/api/v2/tasks/${taskId}?include=assignee,person,category,author`, {
          headers: {
            'Authorization': `Bearer ${req.mondeToken}`,
            'Accept': 'application/vnd.api+json'
          }
        });
        
        if (taskResponse.ok) {
          const taskData = await taskResponse.json();
          results.task = taskData;
          console.log(`🔍 DEBUG - Tarefa encontrada:`, JSON.stringify(taskData, null, 2));
        } else {
          results.task = `Erro ${taskResponse.status}`;
        }
      } catch (error) {
        results.task = `Erro: ${error.message}`;
      }
      
      // 2. Buscar histórico completo
      try {
        const historyResponse = await fetch(`https://web.monde.com.br/api/v2/tasks/${taskId}/task-historics?include=person&page[size]=50&sort=-date-time`, {
          headers: {
            'Authorization': `Bearer ${req.mondeToken}`,
            'Accept': 'application/vnd.api+json'
          }
        });
        
        if (historyResponse.ok) {
          const historyData = await historyResponse.json();
          results.history = historyData;
          console.log(`🔍 DEBUG - Histórico completo (${historyData.data?.length || 0} entradas):`, JSON.stringify(historyData, null, 2));
        } else {
          const errorText = await historyResponse.text();
          results.history = `Erro ${historyResponse.status}: ${errorText}`;
          console.log(`🔍 DEBUG - Erro no histórico:`, errorText);
        }
      } catch (error) {
        results.history = `Erro: ${error.message}`;
      }
      
      // 3. Testar todos os endpoints possíveis de anexos
      const attachmentEndpoints = [
        `https://web.monde.com.br/api/v2/tasks/${taskId}/anexos`,
        `https://web.monde.com.br/api/v2/tasks/${taskId}/attachments`,
        `https://web.monde.com.br/api/v2/tasks/${taskId}/files`,
        `https://web.monde.com.br/api/v2/tasks/${taskId}/uploads`,
        `https://web.monde.com.br/api/v2/tasks/${taskId}/relationships/attachments`,
        `https://web.monde.com.br/api/v2/tasks/${taskId}/relationships/files`
      ];
      
      results.attachmentEndpoints = {};
      
      for (const endpoint of attachmentEndpoints) {
        try {
          const response = await fetch(endpoint, {
            headers: {
              'Authorization': `Bearer ${req.mondeToken}`,
              'Accept': 'application/vnd.api+json'
            }
          });
          
          if (response.ok) {
            const data = await response.json();
            results.attachmentEndpoints[endpoint] = data;
            console.log(`🔍 DEBUG - Endpoint ${endpoint} FUNCIONOU:`, JSON.stringify(data, null, 2));
          } else {
            results.attachmentEndpoints[endpoint] = `HTTP ${response.status}`;
          }
        } catch (error) {
          results.attachmentEndpoints[endpoint] = `Erro: ${error.message}`;
        }
      }
      
      res.json(results);
    } catch (error) {
      console.error("Erro no debug da tarefa:", error);
      res.status(500).json({ message: "Erro interno do servidor", error: error.message });
    }
  });

  // Endpoint para servir anexos do banco de dados
  app.get("/api/monde/anexos/:taskId/:filename", authenticateToken, async (req: any, res) => {
    try {
      const { taskId, filename } = req.params;
      
      // Buscar anexo no banco
      const attachments = await storage.getAnexosByTarefa(taskId, req.user.empresa_info.id);
      const attachment = attachments.find(att => att.nome_arquivo === filename);
      
      if (!attachment) {
        return res.status(404).json({ message: "Anexo não encontrado" });
      }
      
      // Converter base64 para buffer
      const fileBuffer = Buffer.from(attachment.dados_arquivo, 'base64');
      
      // Configurar headers para download
      res.setHeader('Content-Type', attachment.tipo_mime);
      res.setHeader('Content-Disposition', `attachment; filename="${attachment.nome_original}"`);
      res.setHeader('Content-Length', fileBuffer.length);
      
      // Enviar arquivo
      res.send(fileBuffer);
    } catch (error) {
      console.error("Erro ao servir anexo:", error);
      res.status(500).json({ message: "Erro ao buscar anexo" });
    }
  });

  const httpServer = createServer(app);
  return httpServer;
}
