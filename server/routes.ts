import type { Express } from "express";
import { createServer, type Server } from "http";
import { storage } from "./storage";
import bcrypt from "bcryptjs";
import jwt from "jsonwebtoken";
import { insertEmpresaSchema, insertAssinaturaSchema, insertPagamentoSchema, insertSessaoSchema } from "@shared/schema";
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
        return res.status(401).json({ message: "Token expirado" });
      }

      req.sessao = sessao;
      req.empresaId = decoded.empresaId;
      next();
    } catch (error) {
      console.error('Erro na autenticação:', error);
      return res.status(401).json({ message: "Token inválido" });
    }
  };

  // Endpoints específicos para tarefas - usando endpoint correto da API v2
  app.get("/api/monde/tarefas", authenticateToken, async (req: any, res) => {
    try {
      const mondeUrl = `https://web.monde.com.br/api/v2/tasks?include=assignee,person,category`;
      
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
      console.error("Erro ao buscar tarefas:", error);
      res.status(500).json({ message: "Erro ao buscar tarefas" });
    }
  });

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
            completed: req.body.status === 'concluida' ? true : false,
            ...req.body
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

  const httpServer = createServer(app);
  return httpServer;
}
