export const config = {
  runtime: 'edge',
};

export default async function handler(req) {
  try {
    const url = new URL(req.url);
    const base = (process.env.NEXT_PUBLIC_BASE_URL || 'https://admin.domains4gulf.com').replace(/\/+$/, '');

    // Extract path after /api/edge-public/
    const pathname = url.pathname.replace(/^\/api\/edge-public\/?/, '');
    const cleanPath = pathname.replace(/^\/+|\/+$/g, '');

    // Target backend path: /api/v1/...
    const backendUrl = new URL(`${base}/api/v1/${cleanPath}`);

    // Check if this request carries an auth token, guest cart, or customer data
    const authHeader = req.headers.get('authorization') || req.headers.get('Authorization');
    const guestHeader = req.headers.get('guest_id') || req.headers.get('guestId') || url.searchParams.get('guest_id');
    const isCustomerData = cleanPath.includes('customer') || cleanPath.includes('order') || cleanPath.includes('auth');
    const shouldBypassCache = Boolean(authHeader || guestHeader || isCustomerData || req.method !== 'GET');

    // Language handling
    const rawLang = url.searchParams.get('locale') || url.searchParams.get('lang') || req.headers.get('x-localization') || '';
    const lang = rawLang && rawLang.toLowerCase().startsWith('ar') ? 'ar' : 'en';

    // Forward query params
    url.searchParams.forEach((value, key) => {
      backendUrl.searchParams.set(key, value);
    });
    backendUrl.searchParams.set('locale', lang);

    const headers = new Headers();
    headers.set('Accept', 'application/json');
    headers.set('X-localization', lang);

    // Forward auth headers if present (for bypass requests)
    if (authHeader) headers.set('Authorization', authHeader);
    if (guestHeader) headers.set('guestId', guestHeader);

    // Zone & Module handling
    let zoneId = req.headers.get('zoneid') || req.headers.get('zoneId') || url.searchParams.get('zone_id');
    if (!zoneId || zoneId === 'undefined' || zoneId === 'null' || zoneId === '[1]') {
      zoneId = '[6,7,8,9,10]';
    }
    headers.set('zoneId', zoneId);

    let rawModuleId = req.headers.get('moduleid') || req.headers.get('moduleId') || url.searchParams.get('module_id') || url.searchParams.get('module');
    const moduleId = (rawModuleId && rawModuleId !== 'blaban' && !isNaN(Number(rawModuleId)) && Number(rawModuleId) > 0) ? String(rawModuleId) : '2';
    headers.set('moduleId', moduleId);

    // Lat/Lng forwarding for config
    const lat = req.headers.get('latitude') || url.searchParams.get('lat');
    const lng = req.headers.get('longitude') || url.searchParams.get('lng');
    if (lat) headers.set('latitude', lat);
    if (lng) headers.set('longitude', lng);

    const response = await fetch(backendUrl.toString(), {
      method: req.method || 'GET',
      headers: headers,
    });

    if (!response.ok) {
      return new Response(await response.text(), {
        status: response.status,
        headers: {
          'Content-Type': 'application/json',
          'Cache-Control': 'no-store, private',
        },
      });
    }

    const data = await response.text();

    // If request contains auth token, guest cart or is customer data, NEVER cache
    if (shouldBypassCache) {
      return new Response(data, {
        status: 200,
        headers: {
          'Content-Type': 'application/json',
          'Cache-Control': 'no-store, no-cache, private, must-revalidate',
          'X-Edge-Cache': 'BYPASS-AUTH-DATA',
        },
      });
    }

    // Public GET response: cache for 1 hour with stale-while-revalidate 24 hours
    const firstSegment = cleanPath.split('/')[0] || 'public';
    return new Response(data, {
      status: 200,
      headers: {
        'Content-Type': 'application/json',
        'Cache-Control': 'public, s-maxage=3600, stale-while-revalidate=86400',
        'CDN-Cache-Control': 'public, s-maxage=3600, stale-while-revalidate=86400',
        'Vercel-CDN-Cache-Control': 'public, s-maxage=3600, stale-while-revalidate=86400',
        'Cache-Tag': `public-api,${firstSegment},lang-${lang}`,
        'Vary': 'zoneId, moduleId, X-localization, Accept-Language, locale',
        'X-Edge-Cache': 'HIT-PUBLIC',
        'X-Language': lang,
      },
    });
  } catch (error) {
    return new Response(JSON.stringify({ error: error.message }), {
      status: 500,
      headers: { 'Content-Type': 'application/json', 'Cache-Control': 'no-store, private' },
    });
  }
}
