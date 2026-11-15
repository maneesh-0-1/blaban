export const config = {
  runtime: 'edge',
};

// In-memory stale cache across invocations within the same Edge worker
const edgeStaleCache = new Map();

function stripItem(item) {
  if (!item || typeof item !== 'object') return item;
  return {
    id: item.id,
    name: item.name,
    slug: item.slug,
    price: item.price,
    discount: item.discount,
    discount_type: item.discount_type,
    image: item.image,
    image_full_url: item.image_full_url,
    category_id: item.category_id,
    category_ids: item.category_ids,
    store_id: item.store_id,
    store_name: item.store_name,
    store_discount: item.store_discount,
    module_id: item.module_id,
    module_type: item.module_type,
    unit: item.unit,
    unit_type: item.unit_type,
    unit_value: item.unit_value,
    stock: item.stock,
    order_count: item.order_count,
    avg_rating: item.avg_rating,
    rating_count: item.rating_count,
    status: item.status,
    veg: item.veg,
    organic: item.organic,
    recommended: item.recommended,
    is_approved: item.is_approved,
    is_halal: item.is_halal,
    halal_tag_status: item.halal_tag_status,
    maximum_cart_quantity: item.maximum_cart_quantity,
    available_time_starts: item.available_time_starts,
    available_time_ends: item.available_time_ends,
    schedule_order: item.schedule_order,
    delivery_time: item.delivery_time,
    min_delivery_time: item.min_delivery_time,
    max_delivery_time: item.max_delivery_time,
    free_delivery: item.free_delivery,
    food_variations: item.food_variations || [],
    variations: item.variations || [],
    add_ons: Array.isArray(item.add_ons)
      ? item.add_ons.map((a) => ({
          id: a?.id,
          name: a?.name,
          price: a?.price,
          status: a?.status,
        }))
      : [],
    attributes: item.attributes || [],
    choice_options: item.choice_options || [],
    description: typeof item.description === 'string' ? item.description.slice(0, 160) : '',
    tax: item.tax,
    tax_type: item.tax_type,
    zone_id: item.zone_id,
    flash_sale: item.flash_sale,
    is_campaign: item.is_campaign,
  };
}

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

  // Default to 20 items per page for snappy, lightweight catalog responses
  const rawLimit = parseInt(backendUrl.searchParams.get('limit') || '20', 10);
  const safeLimit = isNaN(rawLimit) || rawLimit <= 0 ? 20 : Math.min(rawLimit, 250);
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

    const rawData = await response.json();

    // Strip bulky unused fields before returning JSON
    const cleanProducts = Array.isArray(rawData?.products)
      ? rawData.products.map(stripItem)
      : [];

    const cleanCategoryWise = {};
    if (rawData?.category_wise_items && typeof rawData.category_wise_items === 'object') {
      Object.entries(rawData.category_wise_items).forEach(([catId, items]) => {
        cleanCategoryWise[catId] = Array.isArray(items) ? items.map(stripItem) : [];
      });
    }

    const payload = JSON.stringify({
      ...rawData,
      products: cleanProducts,
      category_wise_items: cleanCategoryWise,
    });

    edgeStaleCache.set(cacheKey, payload);

    return new Response(payload, {
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
