export default async function handler(req, res) {
    try {
        const API_BASE_URL = process.env.VITE_API_BASE_URL 

        const protocol = req.headers["x-forwarded-proto"] || "https";
        const host = req.headers.host || "localhost:5173";
        const FRONTEND_URL = (
            process.env.FRONTEND_URL || `${protocol}://${host}`
        ).replace(/\/+$/, "");

        // Helper: safely format ISO date
        const toSitemapDate = (dateStr) => {
            try {
                return dateStr
                    ? new Date(dateStr).toISOString().split("T")[0]
                    : new Date().toISOString().split("T")[0];
            } catch (e) {
                return new Date().toISOString().split("T")[0];
            }
        };

        // Fetch products
        let products = [];
        try {
            const response = await fetch(`${API_BASE_URL}/products?limit=1000`);
            if (response.ok) {
                const data = await response.json();
                products = data.products || [];
            }
        } catch (err) {
            console.error("Failed to fetch products for sitemap", err);
        }

        const today = new Date().toISOString().split("T")[0];

        // Static pages
        const staticPages = [
            { loc: "/", changefreq: "daily", priority: "1.0", lastmod: today },
            { loc: "/shop", changefreq: "daily", priority: "0.9", lastmod: today },
            { loc: "/contact", changefreq: "monthly", priority: "0.7", lastmod: today },
            { loc: "/about", changefreq: "monthly", priority: "0.6", lastmod: today },
            { loc: "/login", changefreq: "yearly", priority: "0.5", lastmod: today },
            { loc: "/register", changefreq: "yearly", priority: "0.5", lastmod: today }
        ];

        const staticXml = staticPages
            .map(
                (page) => `  <url>
    <loc>${FRONTEND_URL}${page.loc}</loc>
    <lastmod>${page.lastmod}</lastmod>
    <changefreq>${page.changefreq}</changefreq>
    <priority>${page.priority}</priority>
  </url>`
            )
            .join("\n");

        // Dynamic product pages
        const productXml = products
            .map((p) => {
                const lastmod = toSitemapDate(p.updatedAt);
                return `  <url>
    <loc>${FRONTEND_URL}/product/${p._id}</loc>
    <lastmod>${lastmod}</lastmod>
    <changefreq>weekly</changefreq>
    <priority>0.8</priority>
  </url>`;
            })
            .join("\n");

        const sitemap = `<?xml version="1.0" encoding="UTF-8"?>
<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9">
${staticXml}
${productXml}
</urlset>`;

        res.setHeader("Content-Type", "application/xml; charset=utf-8");
        res.setHeader("Cache-Control", "public, s-maxage=3600, stale-while-revalidate=600");
        res.setHeader("X-Robots-Tag", "noindex");
        res.status(200).send(sitemap);
    } catch (error) {
        console.error("Sitemap generation error:", error);

        const protocol = req.headers["x-forwarded-proto"] || "https";
        const host = req.headers.host || "localhost:5173";
        const FRONTEND_URL = (
            process.env.FRONTEND_URL || `${protocol}://${host}`
        ).replace(/\/+$/, "");

        const fallback = `<?xml version="1.0" encoding="UTF-8"?>
<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9">
  <url>
    <loc>${FRONTEND_URL}/</loc>
    <priority>1.0</priority>
  </url>
</urlset>`;
        res.setHeader("Content-Type", "application/xml; charset=utf-8");
        res.status(200).send(fallback);
    }
}
