import { Helmet } from 'react-helmet-async';

export const SEO = ({
    title,
    description,
    image,
    url,
    type = 'website',
    noindex = false,
    structuredData = null,
    keywords = null
}) => {
    const siteName = 'Launchit';
    const siteUrl = 'https://launchit.site';
    const defaultImage = `${siteUrl}/images/r6_circle_optimized.png`;

    // Build full title
    const fullTitle = title
        ? `${title} | ${siteName}`
        : `${siteName} - Where Builders Launch Projects`;

    // Build description
    const fullDescription = description ||
        'Launchit is the instant platform for startup founders who want to ship their products and get visibility — without gatekeeping or delays.';

    // Build image URL (ensure absolute)
    const fullImage = image
        ? (image.startsWith('http') ? image : `${siteUrl}${image}`)
        : defaultImage;

    // Build canonical URL
    const fullUrl = url || (typeof window !== 'undefined' ? `${siteUrl}${window.location.pathname}` : siteUrl);

    // Default keywords
    const defaultKeywords = 'startups, early-stage, launch platform, side projects, beta startups, projects, innovation, entrepreneurship';
    const metaKeywords = keywords || defaultKeywords;

    return (
        <Helmet>
            {/* Basic Meta */}
            <title>{fullTitle}</title>
            <meta name="description" content={fullDescription} />
            <meta name="keywords" content={metaKeywords} />

            {/* Robots / Canonical */}
            {noindex ? (
                <meta name="robots" content="noindex, nofollow" />
            ) : (
                <>
                    <meta name="robots" content="index, follow" />
                    <link rel="canonical" href={fullUrl} />
                </>
            )}

            {/* Open Graph */}
            <meta property="og:title" content={fullTitle} />
            <meta property="og:description" content={fullDescription} />
            <meta property="og:image" content={fullImage} />
            <meta property="og:url" content={fullUrl} />
            <meta property="og:type" content={type} />
            <meta property="og:site_name" content={siteName} />

            {/* Twitter */}
            <meta name="twitter:card" content="summary_large_image" />
            <meta name="twitter:title" content={fullTitle} />
            <meta name="twitter:description" content={fullDescription} />
            <meta name="twitter:image" content={fullImage} />
            <meta name="twitter:site" content="@launchit" />

            {/* Structured Data */}
            {structuredData && (
                <script type="application/ld+json" dangerouslySetInnerHTML={{
                    __html: JSON.stringify(structuredData)
                }} />
            )}
        </Helmet>
    );
};

