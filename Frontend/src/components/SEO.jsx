import { useEffect } from 'react';

const SEO = ({
    title,
    description,
    keywords,
    image = '/src/assets/logo2.png',
    type = 'website',
    canonicalUrl,
    schema
}) => {
    useEffect(() => {
        // Update Title
        document.title = title ? `${title} | SCATCH` : 'SCATCH | Premium Urban Fashion';

        // Helper to update meta tags
        const updateMeta = (name, content) => {
            let element = document.querySelector(`meta[name="${name}"]`);
            if (!element) {
                element = document.createElement('meta');
                element.setAttribute('name', name);
                document.head.appendChild(element);
            }
            element.setAttribute('content', content);
        };

        // Helper for Open Graph / Property tags
        const updateProperty = (property, content) => {
            let element = document.querySelector(`meta[property="${property}"]`);
            if (!element) {
                element = document.createElement('meta');
                element.setAttribute('property', property);
                document.head.appendChild(element);
            }
            element.setAttribute('content', content);
        };

        // Helper to update link tags (like canonical)
        const updateLink = (rel, href) => {
            let element = document.querySelector(`link[rel="${rel}"]`);
            if (!element) {
                element = document.createElement('link');
                element.setAttribute('rel', rel);
                document.head.appendChild(element);
            }
            element.setAttribute('href', href);
        };

        // Helper to inject JSON-LD Schema
        const updateSchema = (schemaData) => {
            // Remove existing schema
            const existingSchema = document.querySelector('script[type="application/ld+json"][data-seo="true"]');
            if (existingSchema) {
                existingSchema.remove();
            }

            if (schemaData) {
                const script = document.createElement('script');
                script.type = 'application/ld+json';
                script.setAttribute('data-seo', 'true');
                script.text = JSON.stringify(schemaData);
                document.head.appendChild(script);
            }
        };

        // Update Meta Tags
        if (description) {
            updateMeta('description', description);
            updateProperty('og:description', description);
            updateProperty('twitter:description', description);
        }

        if (keywords) {
            updateMeta('keywords', keywords);
        }

        // Default Robots
        updateMeta('robots', 'index, follow');

        // Update Open Graph Images
        if (image) {
            const fullImage = image.startsWith('http') ? image : `${window.location.origin}${image}`;
            updateProperty('og:image', fullImage);
            updateProperty('twitter:image', fullImage);
        }

        // Update OG Title and Type
        const fullTitle = title ? `${title} | SCATCH` : 'SCATCH | Premium Urban Fashion';
        updateProperty('og:title', fullTitle);
        updateProperty('twitter:title', fullTitle);
        updateProperty('og:type', type);
        updateProperty('og:site_name', 'SCATCH');
        updateProperty('og:locale', 'en_US');

        // Canonical URL
        const currentUrl = canonicalUrl || window.location.href;
        updateProperty('og:url', currentUrl);
        updateProperty('twitter:url', currentUrl);
        updateLink('canonical', currentUrl);

        // Inject Schema
        updateSchema(schema);

    }, [title, description, keywords, image, type, canonicalUrl, schema]);

    return null;
};

export default SEO;
