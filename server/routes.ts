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
  email: z.string().email(),
  password: z.string().min(1),
  serverUrl: z.string().url(),
});

const planSubscriptionSchema = z.object({
  planId: z.number(),
  empresaId: z.number(),
});

export async function registerRoutes(app: Express): Promise<Server> {
  // Login route
  app.post("/api/auth/login", async (req, res) => {
    try {
      const { email, password, serverUrl } = loginSchema.parse(req.body);
      
      // Check if empresa exists for this server URL
      let empresa = await storage.getEmpresaByMondeUrl(serverUrl);
      
      // Call Monde API to authenticate
      const mondeResponse = await fetch(`${serverUrl}/api/login`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ email, password }),
      });

      if (!mondeResponse.ok) {
        return res.status(401).json({ message: "Credenciais inválidas" });
      }

      const mondeData = await mondeResponse.json();
      
      // Create empresa if it doesn't exist
      if (!empresa) {
        empresa = await storage.createEmpresa({
          nome: mondeData.empresa_nome || "Empresa",
          servidor_monde_url: serverUrl,
          empresa_id_monde: mondeData.empresa_id,
        });
      }

      // Check if plan is active
      const planActive = await storage.isEmpresaPlanActive(empresa.id);
      
      // Create or update session
      const expiresAt = new Date(Date.now() + 24 * 60 * 60 * 1000); // 24 hours
      const sessao = await storage.createSessao({
        empresa_id: empresa.id,
        access_token: mondeData.access_token,
        refresh_token: mondeData.refresh_token,
        expires_at: expiresAt,
        user_data: mondeData.user,
      });

      // Generate local JWT token
      const token = jwt.sign(
        { sessaoId: sessao.id, empresaId: empresa.id },
        JWT_SECRET,
        { expiresIn: "24h" }
      );

      res.json({
        token,
        user: mondeData.user,
        empresa_id: empresa.id,
        has_active_plan: planActive,
        monde_token: mondeData.access_token,
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
      const sessao = await storage.getSessaoByToken(decoded.sessaoId);
      
      if (!sessao || sessao.expires_at < new Date()) {
        return res.status(401).json({ message: "Token expirado" });
      }

      req.sessao = sessao;
      req.empresaId = decoded.empresaId;
      next();
    } catch (error) {
      return res.status(401).json({ message: "Token inválido" });
    }
  };

  // Proxy routes to Monde API
  app.use("/api/monde/*", authenticateToken, async (req: any, res) => {
    try {
      const empresa = await storage.getEmpresa(req.empresaId);
      if (!empresa) {
        return res.status(404).json({ message: "Empresa não encontrada" });
      }

      const mondePath = req.path.replace("/api/monde", "");
      const mondeUrl = `${empresa.servidor_monde_url}${mondePath}`;

      const mondeResponse = await fetch(mondeUrl, {
        method: req.method,
        headers: {
          "Content-Type": "application/json",
          "Authorization": `Bearer ${req.sessao.access_token}`,
        },
        body: req.method !== "GET" ? JSON.stringify(req.body) : undefined,
      });

      const data = await mondeResponse.json();
      res.status(mondeResponse.status).json(data);
    } catch (error) {
      console.error("Monde API proxy error:", error);
      res.status(500).json({ message: "Erro ao acessar API do Monde" });
    }
  });

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
