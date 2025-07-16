import { pgTable, text, serial, integer, boolean, timestamp, varchar, jsonb } from "drizzle-orm/pg-core";
import { relations } from "drizzle-orm";
import { createInsertSchema } from "drizzle-zod";
import { z } from "zod";

// Local system tables
export const superAdmins = pgTable("super_admins", {
  id: serial("id").primaryKey(),
  email: varchar("email", { length: 255 }).notNull().unique(),
  senha: text("senha").notNull(),
  nome: varchar("nome", { length: 255 }).notNull(),
  ativo: boolean("ativo").default(true),
  created_at: timestamp("created_at").defaultNow(),
  updated_at: timestamp("updated_at").defaultNow(),
});

export const empresas = pgTable("empresas", {
  id: serial("id").primaryKey(),
  nome: varchar("nome", { length: 255 }).notNull(),
  servidor_monde_url: text("servidor_monde_url").notNull(),
  empresa_id_monde: varchar("empresa_id_monde", { length: 100 }).notNull(),
  ativo: boolean("ativo").default(true),
  created_at: timestamp("created_at").defaultNow(),
  updated_at: timestamp("updated_at").defaultNow(),
});

export const planos = pgTable("planos", {
  id: serial("id").primaryKey(),
  nome: varchar("nome", { length: 100 }).notNull(),
  valor_mensal: integer("valor_mensal").notNull(), // in cents
  max_usuarios: integer("max_usuarios").notNull(),
  recursos: jsonb("recursos").notNull(),
  ativo: boolean("ativo").default(true),
  created_at: timestamp("created_at").defaultNow(),
});

export const assinaturas = pgTable("assinaturas", {
  id: serial("id").primaryKey(),
  empresa_id: integer("empresa_id").references(() => empresas.id).notNull(),
  plano_id: integer("plano_id").references(() => planos.id).notNull(),
  data_inicio: timestamp("data_inicio").notNull(),
  data_fim: timestamp("data_fim").notNull(),
  ativo: boolean("ativo").default(true),
  created_at: timestamp("created_at").defaultNow(),
  updated_at: timestamp("updated_at").defaultNow(),
});

export const pagamentos = pgTable("pagamentos", {
  id: serial("id").primaryKey(),
  assinatura_id: integer("assinatura_id").references(() => assinaturas.id).notNull(),
  valor: integer("valor").notNull(), // in cents
  data_pagamento: timestamp("data_pagamento").notNull(),
  status: varchar("status", { length: 50 }).notNull(),
  gateway_transaction_id: varchar("gateway_transaction_id", { length: 255 }),
  created_at: timestamp("created_at").defaultNow(),
});

export const sessoes = pgTable("sessoes", {
  id: serial("id").primaryKey(),
  empresa_id: integer("empresa_id").references(() => empresas.id).notNull(),
  access_token: text("access_token").notNull(),
  refresh_token: text("refresh_token"),
  expires_at: timestamp("expires_at").notNull(),
  user_data: jsonb("user_data").notNull(),
  created_at: timestamp("created_at").defaultNow(),
  updated_at: timestamp("updated_at").defaultNow(),
});

// Relations
export const empresasRelations = relations(empresas, ({ many, one }) => ({
  assinaturas: many(assinaturas),
  sessoes: many(sessoes),
}));

export const planosRelations = relations(planos, ({ many }) => ({
  assinaturas: many(assinaturas),
}));

export const assinaturasRelations = relations(assinaturas, ({ one, many }) => ({
  empresa: one(empresas, {
    fields: [assinaturas.empresa_id],
    references: [empresas.id],
  }),
  plano: one(planos, {
    fields: [assinaturas.plano_id],
    references: [planos.id],
  }),
  pagamentos: many(pagamentos),
}));

export const pagamentosRelations = relations(pagamentos, ({ one }) => ({
  assinatura: one(assinaturas, {
    fields: [pagamentos.assinatura_id],
    references: [assinaturas.id],
  }),
}));

export const sessoesRelations = relations(sessoes, ({ one }) => ({
  empresa: one(empresas, {
    fields: [sessoes.empresa_id],
    references: [empresas.id],
  }),
}));

// Insert schemas
export const insertSuperAdminSchema = createInsertSchema(superAdmins).omit({
  id: true,
  created_at: true,
  updated_at: true,
});

export const insertEmpresaSchema = createInsertSchema(empresas).omit({
  id: true,
  created_at: true,
  updated_at: true,
});

export const insertPlanoSchema = createInsertSchema(planos).omit({
  id: true,
  created_at: true,
});

export const insertAssinaturaSchema = createInsertSchema(assinaturas).omit({
  id: true,
  created_at: true,
  updated_at: true,
});

export const insertPagamentoSchema = createInsertSchema(pagamentos).omit({
  id: true,
  created_at: true,
});

export const insertSessaoSchema = createInsertSchema(sessoes).omit({
  id: true,
  created_at: true,
  updated_at: true,
});

// Types
export type SuperAdmin = typeof superAdmins.$inferSelect;
export type InsertSuperAdmin = z.infer<typeof insertSuperAdminSchema>;

export type Empresa = typeof empresas.$inferSelect;
export type InsertEmpresa = z.infer<typeof insertEmpresaSchema>;

export type Plano = typeof planos.$inferSelect;
export type InsertPlano = z.infer<typeof insertPlanoSchema>;

export type Assinatura = typeof assinaturas.$inferSelect;
export type InsertAssinatura = z.infer<typeof insertAssinaturaSchema>;

export type Pagamento = typeof pagamentos.$inferSelect;
export type InsertPagamento = z.infer<typeof insertPagamentoSchema>;

export type Sessao = typeof sessoes.$inferSelect;
export type InsertSessao = z.infer<typeof insertSessaoSchema>;
