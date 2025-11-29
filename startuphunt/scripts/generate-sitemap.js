import { createClient } from '@supabase/supabase-js';
import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

// Get environment variables from process.env (set by user or CI/CD)
const supabaseUrl = process.env.VITE_SUPABASE_URL;
const supabaseKey = process.env.VITE_SUPABASE_ANON_KEY;

if (!supabaseUrl || !supabaseKey) {
  console.error('Missing Supabase credentials. Please check your .env file.');
  process.exit(1);
}

const supabase = createClient(supabaseUrl, supabaseKey);

const SITE_URL = 'https://launchit.site';

async function generateSitemap() {
  try {
    console.log('Fetching projects from Supabase...');
    
    // Fetch all published projects
    const { data: projects, error } = await supabase
      .from('projects')
      .select('slug, updated_at, created_at')
      .neq('status', 'draft')
      .order('created_at', { ascending: false });

    if (error) {
      console.error('Error fetching projects:', error);
      return;
    }

    console.log(`Found ${projects?.length || 0} projects`);

    const now = new Date().toISOString();

    // Static pages
    const staticPages = [
      { url: '/', priority: '1.0', changefreq: 'daily' },
      { url: '/submit', priority: '0.9', changefreq: 'weekly' },
      { url: '/terms', priority: '0.4', changefreq: 'yearly' },
      { url: '/privacy', priority: '0.4', changefreq: 'yearly' },
      { url: '/aboutus', priority: '0.7', changefreq: 'monthly' },
      { url: '/launchitguide', priority: '0.6', changefreq: 'monthly' },
    ];

    // Categories (you may need to fetch these dynamically)
    const categories = ['AI', 'SaaS', 'Mobile', 'Web', 'Design', 'Marketing', 'Finance', 'Education', 'Health', 'E-commerce'];
    const categoryPages = categories.map(cat => ({
      url: `/category/${cat.toLowerCase()}`,
      priority: '0.8',
      changefreq: 'weekly'
    }));

    // Build XML
    let xml = `<?xml version="1.0" encoding="UTF-8"?>
<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9">
`;

    // Add static pages
    staticPages.forEach(page => {
      xml += `  <url>
    <loc>${SITE_URL}${page.url}</loc>
    <lastmod>${now}</lastmod>
    <changefreq>${page.changefreq}</changefreq>
    <priority>${page.priority}</priority>
  </url>
`;
    });

    // Add category pages
    categoryPages.forEach(page => {
      xml += `  <url>
    <loc>${SITE_URL}${page.url}</loc>
    <lastmod>${now}</lastmod>
    <changefreq>${page.changefreq}</changefreq>
    <priority>${page.priority}</priority>
  </url>
`;
    });

    // Add project pages
    projects?.forEach(project => {
      const lastmod = project.updated_at || project.created_at;
      xml += `  <url>
    <loc>${SITE_URL}/launches/${project.slug}</loc>
    <lastmod>${lastmod}</lastmod>
    <changefreq>weekly</changefreq>
    <priority>0.9</priority>
  </url>
`;
    });

    xml += `</urlset>`;

    // Write to public folder
    const sitemapPath = path.join(__dirname, '../public/sitemap.xml');
    fs.writeFileSync(sitemapPath, xml);
    console.log(`✅ Sitemap generated successfully!`);
    console.log(`   - Static pages: ${staticPages.length}`);
    console.log(`   - Category pages: ${categoryPages.length}`);
    console.log(`   - Project pages: ${projects?.length || 0}`);
    console.log(`   - Total URLs: ${staticPages.length + categoryPages.length + (projects?.length || 0)}`);
    console.log(`   - Saved to: ${sitemapPath}`);
  } catch (error) {
    console.error('Error generating sitemap:', error);
    process.exit(1);
  }
}

generateSitemap();

