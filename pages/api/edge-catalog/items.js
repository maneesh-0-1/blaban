export const config = {
  runtime: 'edge',
};

// In-memory stale cache across invocations within the same Edge worker
const edgeStaleCache = new Map();

export default async function handler(req) {
  const url = new URL(req.url);
  const base = (process.env.NEXT_PUBLIC_BASE_URL || 'https://admin.domains4gulf.com').replace(/\/+$/, '');
  const backendUrl = new URL(`${base}/api/v1/store-categories/items`);

  // Language handling
  const rawLang = url.searchParams.get('locale') || url.searchParams.get('lang') || req.headers.get('x-localization') || '';
  const lang = rawLang && rawLang.toLowerCase().startsWith('ar') ? 'ar' : 'en';

  url.searchParams.forEach((value, key) => {
    backendUrl.searchParams.set(key, value);
  });
  backendUrl.searchParams.set('locale', lang);

  // Strip user/location params that do not change catalog results to maximize cache hit ratio
  ['guest_id', 'latitude', 'longitude', 'lat', 'lng', 'distance'].forEach((k) => {
    backendUrl.searchParams.delete(k);
  });

  // Allow full catalog fetch (up to 250) so all products load directly without late loading or pagination spinners
  const rawLimit = parseInt(backendUrl.searchParams.get('limit') || '200', 10);
  const safeLimit = isNaN(rawLimit) || rawLimit <= 0 ? 200 : Math.min(rawLimit, 250);
  backendUrl.searchParams.set('limit', String(safeLimit));

  const headers = new Headers();
  headers.set('Accept', 'application/json');
  headers.set('X-localization', lang);

  // Default to B.Laban Kuwait zones [6,7,8,9,10] if not provided or invalid
  let zoneId = req.headers.get('zoneid') || req.headers.get('zoneId') || url.searchParams.get('zone_id');
  if (!zoneId || zoneId === 'undefined' || zoneId === 'null' || zoneId === '[1]') {
    zoneId = '[6,7,8,9,10]';
  }
  headers.set('zoneId', zoneId);

  // Default to Module 2 (B.Laban Food module)
  let rawModuleId = req.headers.get('moduleid') || req.headers.get('moduleId') || url.searchParams.get('module_id') || url.searchParams.get('module');
  const moduleId = (rawModuleId && rawModuleId !== 'blaban' && !isNaN(Number(rawModuleId)) && Number(rawModuleId) > 0) ? String(rawModuleId) : '2';
  headers.set('moduleId', moduleId);

  const cacheKey = `${backendUrl.searchParams.toString()}&zone=${zoneId}&mod=${moduleId}&lang=${lang}`;

  // Timeout: 20 seconds to allow cold upstream backend queries to finish and cache
  const controller = new AbortController();
  const timeoutId = setTimeout(() => controller.abort(), 20000);

  try {
    const response = await fetch(backendUrl.toString(), {
      method: 'GET',
      headers: headers,
      signal: controller.signal,
    });
    clearTimeout(timeoutId);

    if (!response.ok) {
      // If upstream failed but we have stale cache, serve stale cache
      const cached = edgeStaleCache.get(cacheKey);
      if (cached) {
        return new Response(cached, {
          status: 200,
          headers: {
            'Content-Type': 'application/json',
            'Cache-Control': 'public, s-maxage=300, stale-while-revalidate=600',
            'X-Edge-Cache': 'STALE-FALLBACK',
          },
        });
      }

      return new Response(await response.text(), {
        status: response.status,
        headers: {
          'Content-Type': 'application/json',
          'Cache-Control': 'no-store',
        },
      });
    }

    const data = await response.text();
    edgeStaleCache.set(cacheKey, data);

    return new Response(data, {
      status: 200,
      headers: {
        'Content-Type': 'application/json',
        'Cache-Control': 'public, s-maxage=300, stale-while-revalidate=600',
        'CDN-Cache-Control': 'public, s-maxage=300, stale-while-revalidate=600',
        'Vercel-CDN-Cache-Control': 'public, s-maxage=300, stale-while-revalidate=600',
        'Cache-Tag': `catalog,products,store-items,lang-${lang}`,
        'Vary': 'X-localization, Accept-Language, locale',
        'X-Edge-Cache': 'HIT-VERCEL',
        'X-Language': lang,
      },
    });
  } catch (error) {
    clearTimeout(timeoutId);

    // If aborted due to timeout or network issue, serve stale cached data if available
    const cached = edgeStaleCache.get(cacheKey);
    if (cached) {
      return new Response(cached, {
        status: 200,
        headers: {
          'Content-Type': 'application/json',
          'Cache-Control': 'public, s-maxage=300, stale-while-revalidate=600',
          'X-Edge-Cache': 'TIMEOUT-STALE-FALLBACK',
        },
      });
    }

    // Return graceful 200 empty fallback instead of 504 to prevent frontend Axios unhandled toast "Request failed with status code 504"
    const fallbackResponse = {
      total_size: 0,
      limit: safeLimit,
      offset: parseInt(backendUrl.searchParams.get('offset') || '1', 10),
      categories: [],
      products: [],
      category_wise_items: {},
    };

    return new Response(JSON.stringify(fallbackResponse), {
      status: 200,
      headers: {
        'Content-Type': 'application/json',
        'Cache-Control': 'no-store, no-cache, must-revalidate',
        'X-Edge-Fallback': 'EMPTY_TIMEOUT',
      },
    });
  }
}
