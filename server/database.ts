import Database from 'better-sqlite3';
import { drizzle } from 'drizzle-orm/better-sqlite3';
import { migrate } from 'drizzle-orm/better-sqlite3/migrator';
import * as schema from '../shared/schema';
import { eq, desc, asc, count, sql, and, or } from 'drizzle-orm';
import { promises as fs } from 'fs';
import path from 'path';

// Inicializar banco de dados
const dbPath = path.join(process.cwd(), 'data', 'elevea.db');

// Garantir que o diretório existe
async function ensureDataDir() {
  const dataDir = path.dirname(dbPath);
  try {
    await fs.access(dataDir);
  } catch {
    await fs.mkdir(dataDir, { recursive: true });
  }
}

// Configurar banco
export async function initDatabase() {
  await ensureDataDir();
  
  const sqlite = new Database(dbPath);
  sqlite.pragma('journal_mode = WAL');
  
  const db = drizzle(sqlite, { schema });
  
  // Criar tabelas manualmente (já que não posso usar drizzle-kit)
  await createTables(sqlite);
  
  return { db, sqlite };
}

// Criar tabelas manualmente
async function createTables(sqlite: Database.Database) {
  // Sites
  sqlite.exec(`
    CREATE TABLE IF NOT EXISTS sites (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      site_slug TEXT NOT NULL UNIQUE,
      email TEXT NOT NULL,
      full_name TEXT,
      company TEXT,
      phone TEXT,
      document TEXT,
      plan TEXT NOT NULL DEFAULT 'essential',
      status TEXT NOT NULL DEFAULT 'active',
      settings TEXT DEFAULT '{}',
      created_at INTEGER NOT NULL,
      updated_at INTEGER NOT NULL
    );
  `);

  // Leads
  sqlite.exec(`
    CREATE TABLE IF NOT EXISTS leads (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      site_slug TEXT NOT NULL,
      name TEXT NOT NULL,
      email TEXT NOT NULL,
      phone TEXT,
      message TEXT,
      source TEXT DEFAULT 'website',
      metadata TEXT DEFAULT '{}',
      created_at INTEGER NOT NULL
    );
  `);

  // Feedbacks
  sqlite.exec(`
    CREATE TABLE IF NOT EXISTS feedbacks (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      site_slug TEXT NOT NULL,
      name TEXT,
      email TEXT,
      rating INTEGER NOT NULL,
      comment TEXT NOT NULL,
      approved INTEGER DEFAULT 0,
      is_public INTEGER DEFAULT 0,
      created_at INTEGER NOT NULL
    );
  `);

  // Traffic hits
  sqlite.exec(`
    CREATE TABLE IF NOT EXISTS traffic_hits (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      site_slug TEXT NOT NULL,
      path TEXT DEFAULT '/',
      user_agent TEXT,
      ip TEXT,
      referrer TEXT,
      metadata TEXT DEFAULT '{}',
      timestamp INTEGER NOT NULL
    );
  `);

  // Assets
  sqlite.exec(`
    CREATE TABLE IF NOT EXISTS assets (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      site_slug TEXT NOT NULL,
      filename TEXT NOT NULL,
      original_name TEXT NOT NULL,
      mimetype TEXT NOT NULL,
      size INTEGER NOT NULL,
      path TEXT NOT NULL,
      category TEXT DEFAULT 'general',
      is_public INTEGER DEFAULT 1,
      uploaded_at INTEGER NOT NULL
    );
  `);
}

// Interface de Storage para facilitar testes e troca de implementação
export interface IStorage {
  // Sites
  getSite(siteSlug: string): Promise<schema.Site | null>;
  createSite(data: schema.NewSite): Promise<schema.Site>;
  updateSiteSettings(siteSlug: string, settings: Record<string, any>): Promise<void>;
  listSites(): Promise<string[]>;

  // Leads
  createLead(data: schema.NewLead): Promise<schema.Lead>;
  listLeads(siteSlug: string, page: number, pageSize: number): Promise<{
    leads: schema.Lead[];
    total: number;
    page: number;
    pageSize: number;
  }>;

  // Feedbacks
  createFeedback(data: schema.NewFeedback): Promise<schema.Feedback>;
  listFeedbacks(siteSlug: string, page: number, pageSize: number, onlyPublic?: boolean): Promise<{
    feedbacks: schema.Feedback[];
    total: number;
    page: number;
    pageSize: number;
  }>;
  updateFeedbackApproval(id: number, approved: boolean, isPublic?: boolean): Promise<void>;

  // Traffic
  recordHit(data: schema.NewTrafficHit): Promise<void>;
  getTrafficStats(siteSlug: string, days: number): Promise<{
    totalHits: number;
    uniqueVisitors: number;
    topPages: { path: string; hits: number }[];
    dailyHits: { date: string; hits: number }[];
  }>;

  // Assets
  createAsset(data: schema.NewAsset): Promise<schema.Asset>;
  listAssets(siteSlug: string): Promise<schema.Asset[]>;
  deleteAsset(id: number): Promise<void>;
}

// Implementação SQLite
export class SqliteStorage implements IStorage {
  constructor(private db: ReturnType<typeof drizzle<typeof schema>>) {}

  async getSite(siteSlug: string): Promise<schema.Site | null> {
    const result = await this.db.select().from(schema.sites)
      .where(eq(schema.sites.siteSlug, siteSlug))
      .limit(1);
    return result[0] || null;
  }

  async createSite(data: schema.NewSite): Promise<schema.Site> {
    const now = new Date();
    const result = await this.db.insert(schema.sites)
      .values({
        ...data,
        createdAt: now,
        updatedAt: now,
      })
      .returning();
    return result[0];
  }

  async updateSiteSettings(siteSlug: string, settings: Record<string, any>): Promise<void> {
    await this.db.update(schema.sites)
      .set({ 
        settings: settings,
        updatedAt: new Date(),
      })
      .where(eq(schema.sites.siteSlug, siteSlug));
  }

  async listSites(): Promise<string[]> {
    const result = await this.db.select({ siteSlug: schema.sites.siteSlug })
      .from(schema.sites);
    return result.map(r => r.siteSlug);
  }

  async createLead(data: schema.NewLead): Promise<schema.Lead> {
    const result = await this.db.insert(schema.leads)
      .values({
        ...data,
        createdAt: new Date(),
      })
      .returning();
    return result[0];
  }

  async listLeads(siteSlug: string, page: number, pageSize: number) {
    const offset = (page - 1) * pageSize;
    
    const [leads, [{ count: total }]] = await Promise.all([
      this.db.select().from(schema.leads)
        .where(eq(schema.leads.siteSlug, siteSlug))
        .orderBy(desc(schema.leads.createdAt))
        .limit(pageSize)
        .offset(offset),
      this.db.select({ count: count() }).from(schema.leads)
        .where(eq(schema.leads.siteSlug, siteSlug))
    ]);

    return { leads, total: Number(total), page, pageSize };
  }

  async createFeedback(data: schema.NewFeedback): Promise<schema.Feedback> {
    const result = await this.db.insert(schema.feedbacks)
      .values({
        ...data,
        createdAt: new Date(),
      })
      .returning();
    return result[0];
  }

  async listFeedbacks(siteSlug: string, page: number, pageSize: number, onlyPublic = false) {
    const offset = (page - 1) * pageSize;
    
    const whereConditions = [eq(schema.feedbacks.siteSlug, siteSlug)];
    if (onlyPublic) {
      whereConditions.push(eq(schema.feedbacks.isPublic, true));
    }

    const [feedbacks, [{ count: total }]] = await Promise.all([
      this.db.select().from(schema.feedbacks)
        .where(and(...whereConditions))
        .orderBy(desc(schema.feedbacks.createdAt))
        .limit(pageSize)
        .offset(offset),
      this.db.select({ count: count() }).from(schema.feedbacks)
        .where(and(...whereConditions))
    ]);

    return { feedbacks, total: Number(total), page, pageSize };
  }

  async updateFeedbackApproval(id: number, approved: boolean, isPublic = false): Promise<void> {
    await this.db.update(schema.feedbacks)
      .set({ approved, isPublic })
      .where(eq(schema.feedbacks.id, id));
  }

  async recordHit(data: schema.NewTrafficHit): Promise<void> {
    await this.db.insert(schema.trafficHits)
      .values({
        ...data,
        timestamp: new Date(),
      });
  }

  async getTrafficStats(siteSlug: string, days: number) {
    const startDate = new Date();
    startDate.setDate(startDate.getDate() - days);
    
    const [totalResult, dailyHitsResult, topPagesResult] = await Promise.all([
      this.db.select({ count: count() })
        .from(schema.trafficHits)
        .where(
          and(
            eq(schema.trafficHits.siteSlug, siteSlug),
            sql`${schema.trafficHits.timestamp} >= ${startDate.getTime()}`
          )
        ),
      this.db.select({
        date: sql<string>`date(${schema.trafficHits.timestamp} / 1000, 'unixepoch')`,
        hits: count()
      })
        .from(schema.trafficHits)
        .where(
          and(
            eq(schema.trafficHits.siteSlug, siteSlug),
            sql`${schema.trafficHits.timestamp} >= ${startDate.getTime()}`
          )
        )
        .groupBy(sql`date(${schema.trafficHits.timestamp} / 1000, 'unixepoch')`)
        .orderBy(sql`date(${schema.trafficHits.timestamp} / 1000, 'unixepoch')`),
      this.db.select({
        path: schema.trafficHits.path,
        hits: count()
      })
        .from(schema.trafficHits)
        .where(
          and(
            eq(schema.trafficHits.siteSlug, siteSlug),
            sql`${schema.trafficHits.timestamp} >= ${startDate.getTime()}`
          )
        )
        .groupBy(schema.trafficHits.path)
        .orderBy(desc(count()))
        .limit(10)
    ]);

    return {
      totalHits: Number(totalResult[0]?.count || 0),
      uniqueVisitors: 0, // Simplificado - seria necessário contagem por IP
      topPages: topPagesResult.map(p => ({ path: p.path || '/', hits: Number(p.hits) })),
      dailyHits: dailyHitsResult.map(d => ({ date: d.date, hits: Number(d.hits) }))
    };
  }

  async createAsset(data: schema.NewAsset): Promise<schema.Asset> {
    const result = await this.db.insert(schema.assets)
      .values({
        ...data,
        uploadedAt: new Date(),
      })
      .returning();
    return result[0];
  }

  async listAssets(siteSlug: string): Promise<schema.Asset[]> {
    return this.db.select().from(schema.assets)
      .where(eq(schema.assets.siteSlug, siteSlug))
      .orderBy(desc(schema.assets.uploadedAt));
  }

  async deleteAsset(id: number): Promise<void> {
    await this.db.delete(schema.assets)
      .where(eq(schema.assets.id, id));
  }
}