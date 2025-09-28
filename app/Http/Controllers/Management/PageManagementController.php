<?php

namespace App\Http\Controllers\Management;

use App\Http\Controllers\Controller;
use App\Http\Requests\Management\Page\StorePageRequest;
use App\Models\Page;
use Illuminate\Support\Facades\DB;

class PageManagementController extends Controller
{
    public function index()
    {
        $pages = Page::query()
            ->with(['locales' => function ($q) {
                $q->select(['id', 'page_id', 'locale', 'status', 'version', 'updated_at']);
            }])
            ->orderBy('updated_at', 'desc')
            ->paginate(20);

        return response()->json(['ok' => true, 'data' => $pages]);
    }

    public function store(StorePageRequest $request)
    {
        $data = $request->validated();

        $page = Page::create([
            'slug' => $data['slug'],
        ]);

        return response()->json(['ok' => true, 'message' => __('management.pages.created'), 'data' => $page], 201);
    }

    public function show(Page $page)
    {
        $page->load('locales');

        return response()->json(['ok' => true, 'data' => $page]);
    }

    public function destroy(Page $page)
    {
        // Simplified: delete locales then the page (no versions handling)
        DB::transaction(function () use ($page): void {
            $page->locales()->delete();
            $page->delete();
        });

        return response()->json(['ok' => true, 'message' => __('management.pages.deleted')]);
    }
}
