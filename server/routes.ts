import { Router } from 'express';
import { IStorage } from './database';
import * as schema from '../shared/schema';
import { z } from 'zod';
import { createUploadHandler } from './uploads';

export function createApiRoutes(storage: IStorage): Router {
  const router = Router();

  // Middleware para validação de siteSlug
  const validateSiteSlug = (req: any, res: any, next: any) => {
    const siteSlug = req.query.site || req.body.siteSlug;
    if (!siteSlug || typeof siteSlug !== 'string') {
      return res.status(400).json({ ok: false, error: 'siteSlug_obrigatorio' });
    }
    req.siteSlug = siteSlug;
    next();
  };

  // === SITES & SETTINGS ===
  
  // GET /api/sites - Listar todos os sites
  router.get('/sites', async (req, res) => {
    try {
      const siteSlugs = await storage.listSites();
      res.json({ ok: true, siteSlugs });
    } catch (error) {
      console.error('Erro ao listar sites:', error);
      res.status(500).json({ ok: false, error: 'erro_interno' });
    }
  });

  // POST /api/sites - Criar novo site (cadastro)
  router.post('/sites', async (req, res) => {
    try {
      const data = schema.createSiteSchema.parse(req.body);
      
      // Verificar se slug já existe
      const existing = await storage.getSite(data.siteSlug);
      if (existing) {
        return res.status(400).json({ ok: false, error: 'siteSlug_ja_usado' });
      }

      const site = await storage.createSite(data);
      res.json({ ok: true, site });
    } catch (error) {
      if (error instanceof z.ZodError) {
        return res.status(400).json({ 
          ok: false, 
          error: 'dados_invalidos',
          errors: error.errors.map(e => `${e.path.join('.')}: ${e.message}`)
        });
      }
      console.error('Erro ao criar site:', error);
      res.status(500).json({ ok: false, error: 'erro_interno' });
    }
  });

  // GET /api/settings?site=SLUG - Obter configurações do site
  router.get('/settings', validateSiteSlug, async (req: any, res: any) => {
    try {
      const site = await storage.getSite(req.siteSlug);
      if (!site) {
        return res.status(404).json({ ok: false, error: 'site_nao_encontrado' });
      }

      res.json({
        ok: true,
        siteSlug: site.siteSlug,
        settings: site.settings || {},
        plan: site.plan,
        status: site.status
      });
    } catch (error) {
      console.error('Erro ao obter settings:', error);
      res.status(500).json({ ok: false, error: 'erro_interno' });
    }
  });

  // POST /api/settings - Salvar configurações
  router.post('/settings', async (req, res) => {
    try {
      const { siteSlug, settings } = req.body;
      
      if (!siteSlug || !settings) {
        return res.status(400).json({ ok: false, error: 'dados_obrigatorios' });
      }

      await storage.updateSiteSettings(siteSlug, settings);
      res.json({ ok: true });
    } catch (error) {
      console.error('Erro ao salvar settings:', error);
      res.status(500).json({ ok: false, error: 'erro_interno' });
    }
  });

  // === LEADS ===

  // GET /api/leads?site=SLUG&page=1&pageSize=20
  router.get('/leads', validateSiteSlug, async (req: any, res: any) => {
    try {
      const page = parseInt(String(req.query.page || '1'), 10);
      const pageSize = parseInt(String(req.query.pageSize || '20'), 10);

      const result = await storage.listLeads(req.siteSlug, page, pageSize);
      res.json({ ok: true, ...result });
    } catch (error) {
      console.error('Erro ao listar leads:', error);
      res.status(500).json({ ok: false, error: 'erro_interno' });
    }
  });

  // POST /api/leads - Criar novo lead
  router.post('/leads', async (req, res) => {
    try {
      const data = schema.createLeadSchema.parse(req.body);
      const lead = await storage.createLead(data);
      
      res.json({ ok: true, lead });
    } catch (error) {
      if (error instanceof z.ZodError) {
        return res.status(400).json({
          ok: false,
          error: 'dados_invalidos',
          errors: error.errors.map(e => `${e.path.join('.')}: ${e.message}`)
        });
      }
      console.error('Erro ao criar lead:', error);
      res.status(500).json({ ok: false, error: 'erro_interno' });
    }
  });

  // === FEEDBACKS ===

  // GET /api/feedbacks?site=SLUG&page=1&pageSize=20&public=0
  router.get('/feedbacks', validateSiteSlug, async (req: any, res: any) => {
    try {
      const page = parseInt(String(req.query.page || '1'), 10);
      const pageSize = parseInt(String(req.query.pageSize || '20'), 10);
      const onlyPublic = String(req.query.public || '0') === '1';

      const result = await storage.listFeedbacks(req.siteSlug, page, pageSize, onlyPublic);
      res.json({ ok: true, ...result });
    } catch (error) {
      console.error('Erro ao listar feedbacks:', error);
      res.status(500).json({ ok: false, error: 'erro_interno' });
    }
  });

  // POST /api/feedbacks - Criar novo feedback
  router.post('/feedbacks', async (req, res) => {
    try {
      const data = schema.createFeedbackSchema.parse(req.body);
      const feedback = await storage.createFeedback(data);
      
      res.json({ ok: true, feedback });
    } catch (error) {
      if (error instanceof z.ZodError) {
        return res.status(400).json({
          ok: false,
          error: 'dados_invalidos', 
          errors: error.errors.map(e => `${e.path.join('.')}: ${e.message}`)
        });
      }
      console.error('Erro ao criar feedback:', error);
      res.status(500).json({ ok: false, error: 'erro_interno' });
    }
  });

  // PATCH /api/feedbacks/:id/approval - Aprovar/rejeitar feedback
  router.patch('/feedbacks/:id/approval', async (req, res) => {
    try {
      const id = parseInt(req.params.id, 10);
      const { approved, isPublic = false } = req.body;

      if (typeof approved !== 'boolean') {
        return res.status(400).json({ ok: false, error: 'approved_obrigatorio' });
      }

      await storage.updateFeedbackApproval(id, approved, isPublic);
      res.json({ ok: true });
    } catch (error) {
      console.error('Erro ao aprovar feedback:', error);
      res.status(500).json({ ok: false, error: 'erro_interno' });
    }
  });

  // === TRAFFIC ===

  // POST /api/hit - Registrar hit de tráfego
  router.post('/hit', async (req, res) => {
    try {
      const data = schema.recordHitSchema.parse({
        siteSlug: req.body.siteSlug,
        path: req.body.path || '/',
        metadata: {
          userAgent: req.get('User-Agent'),
          ip: req.ip,
          referrer: req.get('Referer'),
          ...(req.body.metadata || {})
        }
      });

      await storage.recordHit(data);
      res.json({ ok: true });
    } catch (error) {
      if (error instanceof z.ZodError) {
        return res.status(400).json({ ok: false, error: 'dados_invalidos' });
      }
      console.error('Erro ao registrar hit:', error);
      res.status(500).json({ ok: false, error: 'erro_interno' });
    }
  });

  // GET /api/traffic?site=SLUG&range=30d - Estatísticas de tráfego
  router.get('/traffic', validateSiteSlug, async (req: any, res: any) => {
    try {
      const range = String(req.query.range || '30d');
      let days = 30;
      
      if (range.endsWith('d')) {
        days = parseInt(range.slice(0, -1), 10) || 30;
      }

      const stats = await storage.getTrafficStats(req.siteSlug, days);
      res.json({ ok: true, ...stats });
    } catch (error) {
      console.error('Erro ao obter tráfego:', error);
      res.status(500).json({ ok: false, error: 'erro_interno' });
    }
  });

  // === ASSETS ===

  // GET /api/assets?site=SLUG - Listar assets
  router.get('/assets', validateSiteSlug, async (req: any, res: any) => {
    try {
      const assets = await storage.listAssets(req.siteSlug);
      res.json({ ok: true, assets });
    } catch (error) {
      console.error('Erro ao listar assets:', error);
      res.status(500).json({ ok: false, error: 'erro_interno' });
    }
  });

  // POST /api/assets - Upload de arquivos
  const uploadHandler = createUploadHandler(storage);
  router.post('/assets', uploadHandler);

  // DELETE /api/assets/:id - Deletar asset
  router.delete('/assets/:id', async (req, res) => {
    try {
      const id = parseInt(req.params.id, 10);
      await storage.deleteAsset(id);
      res.json({ ok: true });
    } catch (error) {
      console.error('Erro ao deletar asset:', error);
      res.status(500).json({ ok: false, error: 'erro_interno' });
    }
  });

  // === CLIENT INFO (compatibilidade com sistema antigo) ===

  // GET /api/client-plan?email=EMAIL - Status consolidado do cliente
  router.get('/client-plan', async (req, res) => {
    try {
      const email = String(req.query.email || '');
      if (!email) {
        return res.status(400).json({ ok: false, error: 'email_obrigatorio' });
      }

      // Buscar site por email (simplificado)
      const siteSlugs = await storage.listSites();
      // Por enquanto, retornar dados mockados para compatibilidade
      res.json({
        ok: true,
        plan: 'essential',
        status: 'active',
        siteSlug: siteSlugs[0] || 'demo',
        features: {
          leads: true,
          feedbacks: true,
          traffic: true,
          assets: true
        }
      });
    } catch (error) {
      console.error('Erro client-plan:', error);
      res.status(500).json({ ok: false, error: 'erro_interno' });
    }
  });

  // GET /api/client-billing?email=EMAIL - Dados de cobrança
  router.get('/client-billing', async (req, res) => {
    try {
      const email = String(req.query.email || '');
      if (!email) {
        return res.status(400).json({ ok: false, error: 'email_obrigatorio' });
      }

      // Dados mockados para compatibilidade
      res.json({
        ok: true,
        plan: 'essential',
        status: 'active',
        provider: 'local',
        next_renewal: new Date(Date.now() + 30*24*60*60*1000).toISOString(),
        amount: 97,
        currency: 'BRL'
      });
    } catch (error) {
      console.error('Erro client-billing:', error);
      res.status(500).json({ ok: false, error: 'erro_interno' });
    }
  });

  // GET /api/status?site=SLUG - Status do site
  router.get('/status', validateSiteSlug, async (req: any, res: any) => {
    try {
      const site = await storage.getSite(req.siteSlug);
      if (!site) {
        return res.status(404).json({ ok: false, error: 'site_nao_encontrado' });
      }

      res.json({
        ok: true,
        siteSlug: site.siteSlug,
        status: site.status,
        plan: site.plan,
        active: site.status === 'active'
      });
    } catch (error) {
      console.error('Erro ao obter status:', error);
      res.status(500).json({ ok: false, error: 'erro_interno' });
    }
  });

  return router;
}