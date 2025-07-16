import { 
  superAdmins, 
  empresas, 
  planos, 
  assinaturas, 
  pagamentos, 
  sessoes,
  type SuperAdmin,
  type Empresa,
  type Plano,
  type Assinatura,
  type Pagamento,
  type Sessao,
  type InsertSuperAdmin,
  type InsertEmpresa,
  type InsertPlano,
  type InsertAssinatura,
  type InsertPagamento,
  type InsertSessao
} from "@shared/schema";
import { db } from "./db";
import { eq, and, gte, desc } from "drizzle-orm";

export interface IStorage {
  // Super Admin operations
  getSuperAdmin(id: number): Promise<SuperAdmin | undefined>;
  getSuperAdminByEmail(email: string): Promise<SuperAdmin | undefined>;
  createSuperAdmin(data: InsertSuperAdmin): Promise<SuperAdmin>;
  
  // Empresa operations
  getEmpresa(id: number): Promise<Empresa | undefined>;
  getEmpresaByMondeUrl(url: string): Promise<Empresa | undefined>;
  createEmpresa(data: InsertEmpresa): Promise<Empresa>;
  updateEmpresa(id: number, data: Partial<InsertEmpresa>): Promise<Empresa>;
  
  // Plano operations
  getPlano(id: number): Promise<Plano | undefined>;
  getPlanos(): Promise<Plano[]>;
  createPlano(data: InsertPlano): Promise<Plano>;
  
  // Assinatura operations
  getAssinatura(id: number): Promise<Assinatura | undefined>;
  getAssinaturaByEmpresa(empresaId: number): Promise<Assinatura | undefined>;
  createAssinatura(data: InsertAssinatura): Promise<Assinatura>;
  updateAssinatura(id: number, data: Partial<InsertAssinatura>): Promise<Assinatura>;
  
  // Pagamento operations
  createPagamento(data: InsertPagamento): Promise<Pagamento>;
  getPagamentosByAssinatura(assinaturaId: number): Promise<Pagamento[]>;
  
  // Sessao operations
  createSessao(data: InsertSessao): Promise<Sessao>;
  getSessaoByToken(token: string): Promise<Sessao | undefined>;
  updateSessao(id: number, data: Partial<InsertSessao>): Promise<Sessao>;
  deleteSessao(id: number): Promise<void>;
  
  // Plan validation
  isEmpresaPlanActive(empresaId: number): Promise<boolean>;
}

export class DatabaseStorage implements IStorage {
  async getSuperAdmin(id: number): Promise<SuperAdmin | undefined> {
    const [admin] = await db.select().from(superAdmins).where(eq(superAdmins.id, id));
    return admin || undefined;
  }

  async getSuperAdminByEmail(email: string): Promise<SuperAdmin | undefined> {
    const [admin] = await db.select().from(superAdmins).where(eq(superAdmins.email, email));
    return admin || undefined;
  }

  async createSuperAdmin(data: InsertSuperAdmin): Promise<SuperAdmin> {
    const [admin] = await db.insert(superAdmins).values(data).returning();
    return admin;
  }

  async getEmpresa(id: number): Promise<Empresa | undefined> {
    const [empresa] = await db.select().from(empresas).where(eq(empresas.id, id));
    return empresa || undefined;
  }

  async getEmpresaByMondeUrl(url: string): Promise<Empresa | undefined> {
    const [empresa] = await db.select().from(empresas).where(eq(empresas.servidor_monde_url, url));
    return empresa || undefined;
  }

  async createEmpresa(data: InsertEmpresa): Promise<Empresa> {
    const [empresa] = await db.insert(empresas).values(data).returning();
    return empresa;
  }

  async updateEmpresa(id: number, data: Partial<InsertEmpresa>): Promise<Empresa> {
    const [empresa] = await db.update(empresas).set(data).where(eq(empresas.id, id)).returning();
    return empresa;
  }

  async getPlano(id: number): Promise<Plano | undefined> {
    const [plano] = await db.select().from(planos).where(eq(planos.id, id));
    return plano || undefined;
  }

  async getPlanos(): Promise<Plano[]> {
    return await db.select().from(planos).where(eq(planos.ativo, true));
  }

  async createPlano(data: InsertPlano): Promise<Plano> {
    const [plano] = await db.insert(planos).values(data).returning();
    return plano;
  }

  async getAssinatura(id: number): Promise<Assinatura | undefined> {
    const [assinatura] = await db.select().from(assinaturas).where(eq(assinaturas.id, id));
    return assinatura || undefined;
  }

  async getAssinaturaByEmpresa(empresaId: number): Promise<Assinatura | undefined> {
    const [assinatura] = await db.select()
      .from(assinaturas)
      .where(
        and(
          eq(assinaturas.empresa_id, empresaId),
          eq(assinaturas.ativo, true),
          gte(assinaturas.data_fim, new Date())
        )
      )
      .orderBy(desc(assinaturas.data_fim));
    return assinatura || undefined;
  }

  async createAssinatura(data: InsertAssinatura): Promise<Assinatura> {
    const [assinatura] = await db.insert(assinaturas).values(data).returning();
    return assinatura;
  }

  async updateAssinatura(id: number, data: Partial<InsertAssinatura>): Promise<Assinatura> {
    const [assinatura] = await db.update(assinaturas).set(data).where(eq(assinaturas.id, id)).returning();
    return assinatura;
  }

  async createPagamento(data: InsertPagamento): Promise<Pagamento> {
    const [pagamento] = await db.insert(pagamentos).values(data).returning();
    return pagamento;
  }

  async getPagamentosByAssinatura(assinaturaId: number): Promise<Pagamento[]> {
    return await db.select().from(pagamentos).where(eq(pagamentos.assinatura_id, assinaturaId));
  }

  async createSessao(data: InsertSessao): Promise<Sessao> {
    const [sessao] = await db.insert(sessoes).values(data).returning();
    return sessao;
  }

  async getSessaoByToken(token: string): Promise<Sessao | undefined> {
    const [sessao] = await db.select().from(sessoes).where(eq(sessoes.access_token, token));
    return sessao || undefined;
  }

  async updateSessao(id: number, data: Partial<InsertSessao>): Promise<Sessao> {
    const [sessao] = await db.update(sessoes).set(data).where(eq(sessoes.id, id)).returning();
    return sessao;
  }

  async deleteSessao(id: number): Promise<void> {
    await db.delete(sessoes).where(eq(sessoes.id, id));
  }

  async isEmpresaPlanActive(empresaId: number): Promise<boolean> {
    const assinatura = await this.getAssinaturaByEmpresa(empresaId);
    return assinatura ? assinatura.data_fim > new Date() : false;
  }
}

export const storage = new DatabaseStorage();
