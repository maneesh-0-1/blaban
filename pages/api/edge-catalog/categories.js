export const config = {
  runtime: 'edge',
};

export default async function handler(req) {
  try {
    const url = new URL(req.url);
    const backendUrl = new URL('https://admin.blabankw.com/api/v1/categories');

    url.searchParams.forEach((value, key) => {
      backendUrl.searchParams.set(key, value);
    });

    const headers = new Headers();
    headers.set('Accept', 'application/json');

    const zoneId = req.headers.get('zoneid') || req.headers.get('zoneId');
    if (zoneId) headers.set('zoneId', zoneId);
    const moduleId = req.headers.get('moduleid') || req.headers.get('moduleId');
    if (moduleId) headers.set('moduleId', moduleId);
    const lang = req.headers.get('x-localization') || req.headers.get('accept-language');
    if (lang) headers.set('X-localization', lang);

    const response = await fetch(backendUrl.toString(), {
      method: 'GET',
      headers: headers,
    });

    if (!response.ok) {
      return new Response(await response.text(), {
        status: response.status,
        headers: {
          'Content-Type': 'application/json',
          'Cache-Control': 'no-store',
        },
      });
    }

    const data = await response.text();

    return new Response(data, {
      status: 200,
      headers: {
        'Content-Type': 'application/json',
        // Edge Cache: 1 hour (3600s), stale-while-revalidate 24 hours (86400s)
        'Cache-Control': 'public, s-maxage=3600, stale-while-revalidate=86400',
        'CDN-Cache-Control': 'public, s-maxage=3600, stale-while-revalidate=86400',
        'Vercel-CDN-Cache-Control': 'public, s-maxage=3600, stale-while-revalidate=86400',
        'Cache-Tag': 'catalog,categories',
        'X-Edge-Cache': 'HIT-VERCEL',
      },
    });
  } catch (error) {
    return new Response(JSON.stringify({ error: error.message }), {
      status: 500,
      headers: { 'Content-Type': 'application/json' },
    });
  }
}
