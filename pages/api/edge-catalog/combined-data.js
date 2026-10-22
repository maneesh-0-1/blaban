export const config = {
  runtime: 'edge',
};

export default async function handler(req) {
  try {
    const url = new URL(req.url);
    const backendUrl = new URL('https://admin.blabankw.com/api/v1/get-combined-data');

    const rawLang = url.searchParams.get('locale') || url.searchParams.get('lang') || req.headers.get('x-localization') || '';
    const lang = rawLang && rawLang.toLowerCase().startsWith('ar') ? 'ar' : 'en';

    // Forward all query parameters (name, data_type, offset, limit, category_ids, etc.)
    url.searchParams.forEach((value, key) => {
      backendUrl.searchParams.set(key, value);
    });
    backendUrl.searchParams.set('locale', lang);

    const headers = new Headers();
    headers.set('Accept', 'application/json');
    headers.set('X-localization', lang);

    let zoneId = req.headers.get('zoneid') || req.headers.get('zoneId') || url.searchParams.get('zone_id');
    if (!zoneId || zoneId === 'undefined' || zoneId === 'null' || zoneId === '[1]') {
      zoneId = '[6,7,8,9,10]';
    }
    headers.set('zoneId', zoneId);

    let rawModuleId = req.headers.get('moduleid') || req.headers.get('moduleId') || url.searchParams.get('module_id') || url.searchParams.get('module');
    const moduleId = (rawModuleId && rawModuleId !== 'blaban' && !isNaN(Number(rawModuleId)) && Number(rawModuleId) > 0) ? String(rawModuleId) : '2';
    headers.set('moduleId', moduleId);

    const guestId = req.headers.get('guestid') || req.headers.get('guestId');
    if (guestId) {
      headers.set('guestId', guestId);
    }

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
        // Edge Cache search results for 10 min, stale-while-revalidate 24 hours
        'Cache-Control': 'public, s-maxage=600, stale-while-revalidate=86400',
        'CDN-Cache-Control': 'public, s-maxage=600, stale-while-revalidate=86400',
        'Vercel-CDN-Cache-Control': 'public, s-maxage=600, stale-while-revalidate=86400',
        'Cache-Tag': `search,combined-data,lang-${lang}`,
        'Vary': 'X-localization, Accept-Language, locale',
        'X-Edge-Cache': 'HIT-VERCEL',
        'X-Language': lang,
      },
    });
  } catch (error) {
    return new Response(JSON.stringify({ error: error.message }), {
      status: 500,
      headers: { 'Content-Type': 'application/json' },
    });
  }
}
