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

  // Robust zone sanitization: extract numbers to avoid corrupt headers like "[6,7,8,9,10], [6,7,8,9,10]"
  const rawZone = (req.headers.get('zoneId') || req.headers.get('zoneid') || url.searchParams.get('zone_id') || '').trim();
  const zoneNums = Array.from(rawZone.matchAll(/\d+/g), (m) => Number(m[0])).filter((n) => !isNaN(n) && n > 0);
  const zoneId = (zoneNums.length > 0 && !(zoneNums.length === 1 && zoneNums[0] === 1))
    ? JSON.stringify(Array.from(new Set(zoneNums)))
    : '[6,7,8,9,10]';
  headers.set('zoneId', zoneId);

  // Default to Module 2 (B.Laban Food module)
  const rawModuleId = (req.headers.get('moduleId') || req.headers.get('moduleid') || url.searchParams.get('module_id') || url.searchParams.get('module') || '').trim();
  const modMatch = rawModuleId.match(/\d+/);
  const moduleId = (modMatch && Number(modMatch[0]) > 0) ? String(modMatch[0]) : '2';
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
            'Cache-Control': 'public, s-maxage=3600, stale-while-revalidate=86400',
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
        'Cache-Control': 'public, s-maxage=3600, stale-while-revalidate=86400',
        'CDN-Cache-Control': 'public, s-maxage=3600, stale-while-revalidate=86400',
        'Vercel-CDN-Cache-Control': 'public, s-maxage=3600, stale-while-revalidate=86400',
        'Cache-Tag': `catalog,products,store-items,lang-${lang}`,
        'Vary': 'zoneId, moduleId, X-localization, Accept-Language, locale',
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
          'Cache-Control': 'public, s-maxage=3600, stale-while-revalidate=86400',
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
