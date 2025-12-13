export default function handler(req, res) {
  // Set proper XML headers
  res.setHeader('Content-Type', 'application/xml; charset=utf-8');
  res.setHeader('X-Content-Type-Options', 'nosniff');
  
  // Generate sitemap with XML declaration
  const today = new Date().toISOString().split('T')[0];
  
  const sitemap = `<?xml version="1.0" encoding="UTF-8"?>
<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9">
<url>
<loc>https://cosmic-horoscope.vercel.app/</loc>
<lastmod>${today}</lastmod>
<changefreq>daily</changefreq>
<priority>1.0</priority>
</url>
</urlset>`;

  res.status(200).send(sitemap);
}
