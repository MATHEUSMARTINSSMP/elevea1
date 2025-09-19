import bcrypt from 'bcryptjs';
import { getDatabase } from '../db/database.js';

export async function seedDatabase() {
  const db = getDatabase();
  
  console.log('🌱 Seeding ELEVEA database...');
  
  try {
    // Check if already seeded
    const adminCheck = db.prepare('SELECT COUNT(*) as count FROM users WHERE role = ?').get('admin');
    if (adminCheck.count > 0) {
      console.log('✅ Database already seeded, skipping');
      return;
    }
    
    // Create admin user
    const adminEmail = process.env.ADMIN_EMAIL || 'admin@elevea.com.br';
    const adminPassword = process.env.ADMIN_PASSWORD || 'admin123';
    const adminPasswordHash = await bcrypt.hash(adminPassword, 12);
    
    const adminStmt = db.prepare(`
      INSERT INTO users (email, password_hash, role, plan, billing_status)
      VALUES (?, ?, 'admin', 'vip', 'active')
    `);
    
    const adminResult = adminStmt.run(adminEmail, adminPasswordHash);
    console.log(`✅ Created admin user: ${adminEmail}`);
    
    // Create example site
    const exampleSiteSlug = 'SITE-EXEMPLO';
    const exampleSitePin = 'exemplo123';
    const exampleSitePinHash = await bcrypt.hash(exampleSitePin, 12);
    
    const siteStmt = db.prepare(`
      INSERT INTO sites (slug, active, notes, vip_pin_hash)
      VALUES (?, 1, 'Site de exemplo para demonstração', ?)
    `);
    
    siteStmt.run(exampleSiteSlug, exampleSitePinHash);
    console.log(`✅ Created example site: ${exampleSiteSlug}`);
    
    // Create example client user
    const clientEmail = 'cliente@exemplo.com';
    const clientPassword = 'cliente123';
    const clientPasswordHash = await bcrypt.hash(clientPassword, 12);
    
    const clientStmt = db.prepare(`
      INSERT INTO users (email, password_hash, role, site_slug, plan, billing_status, billing_next, billing_amount)
      VALUES (?, ?, 'client', ?, 'vip', 'approved', datetime('now', '+30 days'), 97.00)
    `);
    
    const clientResult = clientStmt.run(clientEmail, clientPasswordHash, exampleSiteSlug);
    console.log(`✅ Created client user: ${clientEmail}`);
    
    // Create example settings
    const defaultSettings = {
      sections: {
        defs: [
          {
            id: 'hero',
            name: 'Seção Principal',
            fields: ['title', 'subtitle', 'buttonText'],
            slots: ['hero']
          },
          {
            id: 'about',
            name: 'Sobre Nós',
            fields: ['title', 'description'],
            slots: ['media_1']
          },
          {
            id: 'services',
            name: 'Serviços',
            fields: ['title', 'items'],
            slots: ['media_2', 'media_3']
          }
        ],
        data: {
          hero: {
            title: 'Bem-vindo ao Site Exemplo',
            subtitle: 'Sua solução digital completa',
            buttonText: 'Entre em Contato'
          },
          about: {
            title: 'Sobre Nossa Empresa',
            description: 'Oferecemos as melhores soluções para seu negócio.'
          },
          services: {
            title: 'Nossos Serviços',
            items: ['Consultoria', 'Desenvolvimento', 'Suporte']
          }
        }
      },
      colors: {
        primary: '#d4af37',
        secondary: '#2c3e50',
        accent: '#e74c3c'
      },
      fonts: {
        heading: 'Inter',
        body: 'Inter'
      }
    };
    
    const settingsStmt = db.prepare(`
      INSERT INTO settings_kv (site_slug, settings_json)
      VALUES (?, ?)
    `);
    
    settingsStmt.run(exampleSiteSlug, JSON.stringify(defaultSettings));
    console.log(`✅ Created default settings for ${exampleSiteSlug}`);
    
    // Create sample feedback
    const feedbackStmt = db.prepare(`
      INSERT INTO feedbacks (site_slug, name, email, rating, comment, approved)
      VALUES (?, ?, ?, ?, ?, 1)
    `);
    
    feedbackStmt.run(
      exampleSiteSlug,
      'João Silva',
      'joao@exemplo.com',
      5,
      'Excelente serviço! Recomendo a todos.'
    );
    
    feedbackStmt.run(
      exampleSiteSlug,
      'Maria Santos',
      'maria@exemplo.com',
      4,
      'Muito bom atendimento, profissionais competentes.'
    );
    
    console.log(`✅ Created sample feedbacks for ${exampleSiteSlug}`);
    
    // Create sample traffic data
    const trafficStmt = db.prepare(`
      INSERT INTO traffic_hits (site_slug, path, ip, user_agent)
      VALUES (?, ?, ?, ?)
    `);
    
    // Add some sample hits from the last few days
    const now = new Date();
    for (let i = 0; i < 50; i++) {
      const randomDaysAgo = Math.floor(Math.random() * 7);
      const hitDate = new Date(now);
      hitDate.setDate(hitDate.getDate() - randomDaysAgo);
      hitDate.setHours(Math.floor(Math.random() * 24));
      
      const paths = ['/', '/sobre', '/servicos', '/contato'];
      const path = paths[Math.floor(Math.random() * paths.length)];
      
      // Temporarily set the date using a different approach since we can't control created_at
      trafficStmt.run(
        exampleSiteSlug,
        path,
        `192.168.1.${Math.floor(Math.random() * 255)}`,
        'Mozilla/5.0 (Example User Agent)'
      );
    }
    
    console.log(`✅ Created sample traffic data for ${exampleSiteSlug}`);
    
    console.log('🎉 Database seeding completed successfully!');
    console.log('');
    console.log('Default credentials:');
    console.log(`Admin: ${adminEmail} / ${adminPassword}`);
    console.log(`Client: ${clientEmail} / ${clientPassword}`);
    console.log(`Site: ${exampleSiteSlug} / PIN: ${exampleSitePin}`);
    
  } catch (error) {
    console.error('❌ Database seeding failed:', error);
    throw error;
  }
}