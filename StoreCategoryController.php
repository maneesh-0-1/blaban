<?php

namespace App\Http\Controllers\Api\V1;

use App\CentralLogics\Helpers;
use App\Http\Controllers\Controller;
use App\Models\Category;
use App\Models\Item;
use App\Models\StoreCategory;
use App\Models\AddOn;
use App\Models\FlashSaleItem;
use App\Traits\ItemFilter;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\Cache;
use Illuminate\Support\Facades\DB;
use Illuminate\Support\Facades\Validator;

class StoreCategoryController extends Controller
{
    use ItemFilter;

    public function getCategories(Request $request): JsonResponse
    {
        if (!Helpers::storeCategoryStatus()) {
            return response()->json([]);
        }

        $categories = StoreCategory::active()
            ->when(config('module.current_module_data'), function ($q) {
                $q->module(config('module.current_module_data')['id']);
            })
            ->when($request->store_id, function ($q) use ($request) {
                $q->where('store_id', $request->store_id);
            })
            ->when($request->name, function ($q) use ($request) {
                $q->where('name', 'like', "%{$request->name}%");
            })
            ->orderBy('priority', 'desc')
            ->orderBy('id', 'desc')
            ->get();

        return response()->json($categories, 200);
    }

    public function getByStore($storeId): JsonResponse
    {
        if (!Helpers::storeCategoryStatus()) {
            return response()->json([]);
        }

        $categories = StoreCategory::active()
            ->where('store_id', $storeId)
            ->orderBy('priority', 'desc')
            ->orderBy('id', 'desc')
            ->get();

        return response()->json($categories, 200);
    }

    public function getCategoriesWithItems(Request $request): JsonResponse
    {
        $validator = Validator::make($request->all(), [
            'store_id' => 'required',
        ]);

        if ($validator->fails()) {
            return response()->json(['errors' => Helpers::error_processor($validator)], 403);
        }

        try {
            if (method_exists(Helpers::class, 'setZoneIds')) {
                Helpers::setZoneIds($request);
            }

            // Robust zone parsing: extract all digits to safely handle merged headers like "[6,7,8,9,10], [6,7,8,9,10]"
            $rawZone = (string) ($request->header('zoneId') ?? $request->header('zoneid') ?? '');
            preg_match_all('/\d+/', $rawZone, $zoneMatches);
            $zones = !empty($zoneMatches[0]) ? array_map('intval', array_unique($zoneMatches[0])) : [6, 7, 8, 9, 10];
            if (empty($zones) || (count($zones) === 1 && $zones[0] === 1)) {
                $zones = [6, 7, 8, 9, 10];
            }

            // Robust module parsing (default 2 for Food)
            $rawModule = (string) ($request->header('moduleId') ?? $request->header('moduleid') ?? $request->query('module_id') ?? '2');
            preg_match('/\d+/', $rawModule, $mMod);
            $moduleId = !empty($mMod[0]) ? (int) $mMod[0] : 2;

            $storeId  = (int) $request->query('store_id');
            $rawLimit = (int) $request->query('limit', 200);
            $limit    = ($rawLimit <= 0) ? 200 : min($rawLimit, 250);
            $offset   = max(1, (int) $request->query('offset', 1));
            $type     = $request->query('type', 'all');
            $locale   = $request->header('X-localization', $request->query('locale', app()->getLocale()));

            $filters = $this->resolveSearchFilters($request);
            $sortBy  = $filters['sort_by'];
            $additionalData = ['sort_by' => $filters['sort_by'], 'filter_by' => $filters['filter_by']];

            $searchKey       = $request->query('name') ?? $request->query('search');
            $searchRelations = [
                'translations' => 'value',
                'category'     => 'name',
                'tags'         => 'tag',
            ];

            // 5-minute cache keyed by store, module, type, offset, limit, locale, zone, and search/sort
            $zoneKey = is_array($zones) ? implode('-', $zones) : (string) $zones;
            $cacheVersion = (int) Cache::get('catalog_cache_version', 4);
            $cacheKey = "cat_items_v{$cacheVersion}_s{$storeId}_m{$moduleId}_t{$type}_o{$offset}_l{$limit}_loc{$locale}_z{$zoneKey}_srt{$sortBy}_q" . md5((string) $searchKey);

            $responseData = Cache::remember($cacheKey, 300, function () use (
                $storeId, $limit, $offset, $type, $locale, $sortBy, $additionalData,
                $searchKey, $searchRelations, $zones, $moduleId, $request
            ) {
                $itemsTable = (new Item)->getTable();

                $applyItemConstraints = function ($q) use ($type, $storeId, $itemsTable, $zones, $moduleId) {
                    $q->active(zone_ids: $zones, module_id: $moduleId)
                      ->where("{$itemsTable}.store_id", $storeId)
                      ->type($type);
                };

                $applyItemFilters = function ($q) use ($additionalData, $request, $searchKey, $searchRelations) {
                    $q->applyFilters($additionalData)
                      ->applyRating($request)
                      ->applyPriceRange($request)
                      ->when($request->rating_count && is_numeric($request->rating_count), function ($q) use ($request) {
                          $q->where('avg_rating', '<', (int) $request->rating_count + 1);
                      })
                      ->when($searchKey, function ($q) use ($searchKey, $searchRelations) {
                          $q->search($searchKey, $searchRelations);
                      });
                };

                $useStoreCategory = false;
                if (Helpers::storeCategoryStatus()) {
                    $categories = StoreCategory::active()
                        ->where('store_id', $storeId)
                        ->orderBy('priority', 'desc')
                        ->orderBy('name', 'asc')
                        ->get(['id', 'name', 'image', 'priority', 'status']);
                    $useStoreCategory = $categories->isNotEmpty();
                }

                if ($useStoreCategory) {
                    $categoryIds      = $categories->pluck('id')->map(fn ($v) => (int) $v)->all();
                    $categoryKeyCol   = "{$itemsTable}.store_category_id";
                    $baseItemScope    = function ($q) use ($itemsTable, $categoryIds) {
                        $q->whereIn("{$itemsTable}.store_category_id", $categoryIds);
                    };
                } else {
                    $usedCategoryIds = Item::query()
                        ->tap($applyItemConstraints)
                        ->whereNotNull("{$itemsTable}.category_id")
                        ->distinct()
                        ->pluck("{$itemsTable}.category_id")
                        ->filter()
                        ->map(fn ($v) => (int) $v)
                        ->all();

                    $categories = empty($usedCategoryIds)
                        ? collect()
                        : Category::where('status', 1)
                            ->whereIn('id', $usedCategoryIds)
                            ->orderBy('priority', 'desc')
                            ->orderBy('name', 'asc')
                            ->get(['id', 'name', 'image']);

                    $categoryIds    = $categories->pluck('id')->map(fn ($v) => (int) $v)->all();
                    $categoryKeyCol = "{$itemsTable}.category_id";
                    $baseItemScope  = function ($q) use ($itemsTable, $categoryIds) {
                        if (!empty($categoryIds)) {
                            $q->whereIn("{$itemsTable}.category_id", $categoryIds);
                        }
                    };
                }

                if (empty($categoryIds)) {
                    return [
                        'total_size'          => 0,
                        'limit'               => $limit,
                        'offset'              => $offset,
                        'category_source'     => $useStoreCategory ? 'store_category' : 'main_category',
                        'categories'          => [],
                        'products'            => [],
                        'category_wise_items' => (object) [],
                    ];
                }

                $itemsBaseQuery = Item::query()
                    ->tap($baseItemScope)
                    ->tap($applyItemConstraints)
                    ->tap($applyItemFilters);

                $filterCatParam = $request->query('category_id');
                if (!empty($filterCatParam)) {
                    $filterCatIds = array_filter(array_map('intval', is_array($filterCatParam) ? $filterCatParam : explode(',', (string) $filterCatParam)));
                    if (!empty($filterCatIds)) {
                        $itemsBaseQuery->whereIn($categoryKeyCol, $filterCatIds);
                    }
                }

                $totalItems = (clone $itemsBaseQuery)->reorder()->count("{$itemsTable}.id");

                // Count items per category across whole store
                $itemsCountByCategory = (clone $itemsBaseQuery)
                    ->reorder()
                    ->groupBy($categoryKeyCol)
                    ->selectRaw("{$categoryKeyCol}, count(*) as cnt")
                    ->pluck('cnt', $categoryKeyCol);

                // Fetch items with eager loading
                $items = $itemsBaseQuery
                    ->with([
                        'store',
                        'store.storage',
                        'store.discount',
                        'unit',
                        'storage',
                        'translations',
                        'storeCategory',
                        'taxVats',
                    ])
                    ->reorder()
                    ->addSelect("{$itemsTable}.*")
                    ->selectRaw("{$categoryKeyCol} AS cat_group")
                    ->orderByRaw("FIELD({$categoryKeyCol}, " . implode(',', $categoryIds) . ')')
                    ->orderBy("{$itemsTable}.name", 'asc')
                    ->orderBy("{$itemsTable}.id", 'asc')
                    ->applySorting($sortBy)
                    ->skip(($offset - 1) * $limit)
                    ->take($limit)
                    ->get();

                $categoriesData = $categories
                    ->map(function ($category) use ($itemsCountByCategory) {
                        return [
                            'id'             => (int) $category->id,
                            'name'           => $category->name,
                            'image_full_url' => $category->image_full_url ?? null,
                            'items_count'    => (int) ($itemsCountByCategory[$category->id] ?? 0),
                        ];
                    })
                    ->values();

                // Pre-load all active addons for this store in 1 single query (eliminating 1,800 N+1 queries)
                $storeAddons = AddOn::where('store_id', $storeId)
                    ->active()
                    ->get(['id', 'name', 'price', 'status'])
                    ->keyBy('id');

                // Map item add_on IDs and temporarily suppress N+1 query inside Helpers::product_data_formatting
                $itemsAddonsMap = [];
                foreach ($items as $it) {
                    $rawIds = is_array($it->add_ons) ? $it->add_ons : json_decode($it->add_ons ?? '[]', true);
                    $itemsAddonsMap[$it->id] = is_array($rawIds) ? array_map('intval', $rawIds) : [];
                    $it->add_ons = '[]';
                }

                $formattedItems = (object) [];
                $allFormattedProducts = [];
                if ($items->isNotEmpty()) {
                    $itemsByCategory = $items->groupBy(fn ($it) => (int) $it->cat_group);
                    $grouped = [];

                    foreach ($categoryIds as $catId) {
                        if (!$itemsByCategory->has($catId)) {
                            continue;
                        }
                        $catProducts = Helpers::product_data_formatting(
                            $itemsByCategory[$catId], true, false, $locale
                        );

                        // Slim products: attach pre-loaded addons and strip bulky unused objects to reduce payload
                        $slimmedCatProducts = array_map(function ($p) use ($storeAddons, $itemsAddonsMap) {
                            if (is_array($p)) {
                                unset(
                                    $p['module'],
                                    $p['storage'],
                                    $p['translations'],
                                    $p['ecommerce_item_details'],
                                    $p['video_thumbnail_url'],
                                    $p['video_preview_url'],
                                    $p['video_source_type'],
                                    $p['video_preview_type'],
                                    $p['video_embed_url'],
                                    $p['video_preview_available'],
                                    $p['video_unavailable_reason'],
                                    $p['video_size'],
                                    $p['video_preview_modal_type'],
                                    $p['video_preview_modal_url'],
                                    $p['has_video_preview'],
                                    $p['has_video_source'],
                                    $p['video'],
                                    $p['video_link'],
                                    $p['video_full_url'],
                                    $p['tax_data'],
                                    $p['tax_ids'],
                                    $p['nutritions_name'],
                                    $p['allergies_name'],
                                    $p['generic_name'],
                                    $p['manufacturer'],
                                    $p['brand_id'],
                                    $p['brand_name'],
                                    $p['common_condition_id'],
                                    $p['is_basic'],
                                    $p['is_prescription_required'],
                                    $p['is_takeaway_only'],
                                    $p['verified_seller'],
                                    $p['created_at'],
                                    $p['updated_at']
                                );
                                $aIds = $itemsAddonsMap[$p['id']] ?? [];
                                $p['add_ons'] = [];
                                foreach ($aIds as $aId) {
                                    if ($a = $storeAddons->get($aId)) {
                                        $p['add_ons'][] = [
                                            'id'     => (int) $a->id,
                                            'name'   => (string) $a->name,
                                            'price'  => (float) $a->price,
                                            'status' => (int) $a->status,
                                        ];
                                    }
                                }
                            }
                            return $p;
                        }, $catProducts);

                        $grouped[(string) $catId] = $slimmedCatProducts;
                        foreach ($slimmedCatProducts as $p) {
                            $allFormattedProducts[] = $p;
                        }
                    }

                    $formattedItems = (object) $grouped;
                }

                return [
                    'total_size'          => (int) $totalItems,
                    'limit'               => (int) $limit,
                    'offset'              => (int) $offset,
                    'category_source'     => $useStoreCategory ? 'store_category' : 'main_category',
                    'categories'          => $categoriesData,
                    'products'            => $allFormattedProducts,
                    'category_wise_items' => $formattedItems,
                ];
            });

            return response()->json($responseData, 200, [
                'Cache-Control' => 'public, s-maxage=300, stale-while-revalidate=600',
            ]);
        } catch (\Exception $e) {
            return response()->json(['error' => $e->getMessage()], 500);
        }
    }

}
