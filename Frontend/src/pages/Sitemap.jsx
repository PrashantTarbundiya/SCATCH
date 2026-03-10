import { useEffect } from 'react';
import axios from 'axios';

const Sitemap = () => {
    useEffect(() => {
        const generateSitemap = async () => {
            try {
                const response = await axios.get(`${import.meta.env.VITE_API_BASE_URL}/products?limit=1000`);
                const products = response.data.products || [];

                const FRONTEND_URL = window.location.origin;
                const today = new Date().toISOString().split('T')[0];

                const staticRoutes = [
                    { url: '/', priority: '1.0', changefreq: 'daily' },
                    { url: '/shop', priority: '0.9', changefreq: 'daily' },
                    { url: '/contact', priority: '0.7', changefreq: 'monthly' },
                    { url: '/about', priority: '0.6', changefreq: 'monthly' },
                    { url: '/login', priority: '0.5', changefreq: 'yearly' },
                    { url: '/register', priority: '0.5', changefreq: 'yearly' }
                ];

                const urls = [
                    ...staticRoutes.map(r => `  <url>
    <loc>${FRONTEND_URL}${r.url}</loc>
    <lastmod>${today}</lastmod>
    <changefreq>${r.changefreq}</changefreq>
    <priority>${r.priority}</priority>
  </url>`),
                    ...products.map(p => `  <url>
    <loc>${FRONTEND_URL}/product/${p._id}</loc>
    <lastmod>${p.updatedAt?.split('T')[0] || today}</lastmod>
    <changefreq>weekly</changefreq>
    <priority>0.8</priority>
  </url>`)
                ];

                const sitemap = `<?xml version="1.0" encoding="UTF-8"?>
<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9" xmlns:image="http://www.google.com/schemas/sitemap-image/1.1">
${urls.join('\n')}
</urlset>`;

                document.open('text/xml');
                document.write(sitemap);
                document.close();
            } catch (error) {
                console.error("Sitemap generation failed:", error);
                document.body.innerHTML = "<h1>Error generating sitemap</h1>";
            }
        };

        generateSitemap();
    }, []);

    return null;
};

export default Sitemap;
