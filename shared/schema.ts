import { sqliteTable, text, integer, real, blob } from 'drizzle-orm/sqlite-core';
import { createInsertSchema, createSelectSchema } from 'drizzle-zod';
import { z } from 'zod';

// Sites - configurações e informações básicas
export const sites = sqliteTable('sites', {
  id: integer('id').primaryKey({ autoIncrement: true }),
  siteSlug: text('site_slug').notNull().unique(),
  email: text('email').notNull(),
  fullName: text('full_name'),
  company: text('company'),
  phone: text('phone'),
  document: text('document'), // CPF/CNPJ
  plan: text('plan').notNull().default('essential'), // 'essential' ou 'vip'
  status: text('status').notNull().default('active'), // 'active', 'blocked', 'pending'
  settings: text('settings', { mode: 'json' }).$type<Record<string, any>>().default({}),
  createdAt: integer('created_at', { mode: 'timestamp' }).notNull().$defaultFn(() => new Date()),
  updatedAt: integer('updated_at', { mode: 'timestamp' }).notNull().$defaultFn(() => new Date()),
});

// Leads - contatos capturados
export const leads = sqliteTable('leads', {
  id: integer('id').primaryKey({ autoIncrement: true }),
  siteSlug: text('site_slug').notNull(),
  name: text('name').notNull(),
  email: text('email').notNull(),
  phone: text('phone'),
  message: text('message'),
  source: text('source').default('website'), // origem do lead
  metadata: text('metadata', { mode: 'json' }).$type<Record<string, any>>().default({}),
  createdAt: integer('created_at', { mode: 'timestamp' }).notNull().$defaultFn(() => new Date()),
});

// Feedbacks/Depoimentos
export const feedbacks = sqliteTable('feedbacks', {
  id: integer('id').primaryKey({ autoIncrement: true }),
  siteSlug: text('site_slug').notNull(),
  name: text('name'),
  email: text('email'),
  rating: integer('rating').notNull(), // 1-5 estrelas
  comment: text('comment').notNull(),
  approved: integer('approved', { mode: 'boolean' }).default(false),
  isPublic: integer('is_public', { mode: 'boolean' }).default(false),
  createdAt: integer('created_at', { mode: 'timestamp' }).notNull().$defaultFn(() => new Date()),
});

// Hits de tráfego
export const trafficHits = sqliteTable('traffic_hits', {
  id: integer('id').primaryKey({ autoIncrement: true }),
  siteSlug: text('site_slug').notNull(),
  path: text('path').default('/'),
  userAgent: text('user_agent'),
  ip: text('ip'),
  referrer: text('referrer'),
  metadata: text('metadata', { mode: 'json' }).$type<Record<string, any>>().default({}),
  timestamp: integer('timestamp', { mode: 'timestamp' }).notNull().$defaultFn(() => new Date()),
});

// Assets/Arquivos (substitui Google Drive)
export const assets = sqliteTable('assets', {
  id: integer('id').primaryKey({ autoIncrement: true }),
  siteSlug: text('site_slug').notNull(),
  filename: text('filename').notNull(),
  originalName: text('original_name').notNull(),
  mimetype: text('mimetype').notNull(),
  size: integer('size').notNull(),
  path: text('path').notNull(), // caminho no sistema de arquivos
  category: text('category').default('general'), // 'logo', 'foto', 'general'
  isPublic: integer('is_public', { mode: 'boolean' }).default(true),
  uploadedAt: integer('uploaded_at', { mode: 'timestamp' }).notNull().$defaultFn(() => new Date()),
});

// Schemas para validação Zod
export const insertSiteSchema = createInsertSchema(sites);
export const selectSiteSchema = createSelectSchema(sites);
export const insertLeadSchema = createInsertSchema(leads);
export const selectLeadSchema = createSelectSchema(leads);
export const insertFeedbackSchema = createInsertSchema(feedbacks);
export const selectFeedbackSchema = createSelectSchema(feedbacks);
export const insertTrafficHitSchema = createInsertSchema(trafficHits);
export const selectTrafficHitSchema = createSelectSchema(trafficHits);
export const insertAssetSchema = createInsertSchema(assets);
export const selectAssetSchema = createSelectSchema(assets);

// Tipos TypeScript
export type Site = typeof sites.$inferSelect;
export type NewSite = typeof sites.$inferInsert;
export type Lead = typeof leads.$inferSelect;
export type NewLead = typeof leads.$inferInsert;
export type Feedback = typeof feedbacks.$inferSelect;
export type NewFeedback = typeof feedbacks.$inferInsert;
export type TrafficHit = typeof trafficHits.$inferSelect;
export type NewTrafficHit = typeof trafficHits.$inferInsert;
export type Asset = typeof assets.$inferSelect;
export type NewAsset = typeof assets.$inferInsert;

// Schemas para validação de API
export const createSiteSchema = z.object({
  siteSlug: z.string().min(3).max(30).regex(/^[a-z0-9-]+$/),
  email: z.string().email(),
  fullName: z.string().optional(),
  company: z.string().optional(),
  phone: z.string().optional(),
  document: z.string().optional(),
  plan: z.enum(['essential', 'vip']).default('essential'),
});

export const createLeadSchema = z.object({
  siteSlug: z.string(),
  name: z.string().min(2),
  email: z.string().email(),
  phone: z.string().optional(),
  message: z.string().optional(),
  source: z.string().optional(),
});

export const createFeedbackSchema = z.object({
  siteSlug: z.string(),
  name: z.string().optional(),
  email: z.string().email().optional(),
  rating: z.number().int().min(1).max(5),
  comment: z.string().min(5),
});

export const recordHitSchema = z.object({
  siteSlug: z.string(),
  path: z.string().optional(),
  metadata: z.record(z.any()).optional(),
});