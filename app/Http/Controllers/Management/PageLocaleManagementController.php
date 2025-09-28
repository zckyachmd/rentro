<?php

namespace App\Http\Controllers\Management;

use App\Http\Controllers\Controller;
use App\Http\Requests\Management\Page\UpsertPageDraftRequest;
use App\Models\Page;
use App\Models\PageLocale;
use App\Models\PageLocaleVersion;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\Auth;
use Illuminate\Support\Facades\DB;
use Illuminate\Support\Facades\URL;

class PageLocaleManagementController extends Controller
{
    public function show(Page $page, string $locale)
    {
        $locale = strtolower($locale);
        $loc    = PageLocale::query()->where('page_id', $page->id)->where('locale', $locale)->first();
        if (!$loc) {
            return response()->json(null);
        }

        return response()->json($loc);
    }

    public function upsertDraft(UpsertPageDraftRequest $request, Page $page, string $locale)
    {
        $data = $request->validated();

        $loc = PageLocale::query()->firstOrNew([
            'page_id' => $page->id,
            'locale'  => strtolower($locale),
        ]);

        $loc->fill([
            'title'        => $data['title'] ?? $loc->title,
            'description'  => $data['description'] ?? $loc->description,
            'seo_draft'    => $data['seo'] ?? $loc->seo_draft,
            'fields_draft' => $data['fields'] ?? $loc->fields_draft,
            'blocks_draft' => $data['blocks'] ?? $loc->blocks_draft,
            'publish_at'   => $data['publish_at'] ?? $loc->publish_at,
            'unpublish_at' => $data['unpublish_at'] ?? $loc->unpublish_at,
            'status'       => $data['status'] ?? $loc->status ?? 'draft',
        ]);

        $loc->save();

        // Redirect back to the edit page so Inertia rehydrates props (no JSON API)
        return redirect()
            ->route('management.pages.edit', ['page' => $page->id])
            ->with('message', __('management.pages.draft_saved'));
    }

    public function publish(Request $request, Page $page, string $locale)
    {
        $loc = PageLocale::query()->where('page_id', $page->id)->where('locale', strtolower($locale))->firstOrFail();

        DB::transaction(function () use ($page, $loc): void {
            $snapshot = [
                'title'        => $loc->title,
                'description'  => $loc->description,
                'seo_draft'    => $loc->seo_draft,
                'fields_draft' => $loc->fields_draft,
                'blocks_draft' => $loc->blocks_draft,
            ];
            $version = (int) $loc->version + 1;
            PageLocaleVersion::create([
                'page_locale_id' => $loc->id,
                'version'        => $version,
                'snapshot'       => $snapshot,
                'user_id'        => Auth::id(),
            ]);

            $loc->fill([
                'seo_published'    => $loc->seo_draft,
                'fields_published' => $loc->fields_draft,
                'blocks_published' => $loc->blocks_draft,
                'status'           => 'published',
                'version'          => $version,
            ]);
            $loc->save();

            $page->is_published = true;
            $page->published_at = now();
            $page->save();
        });

        return response()->json(['ok' => true, 'message' => __('management.pages.published')]);
    }

    public function preview(Request $request, Page $page, string $locale)
    {
        $url = URL::signedRoute('public.pages.show', [
            'slug'    => $page->slug,
            'preview' => 1,
        ]);

        return response()->json(['ok' => true, 'url' => $url]);
    }

    public function unpublish(Request $request, Page $page, string $locale)
    {
        $loc         = PageLocale::query()->where('page_id', $page->id)->where('locale', strtolower($locale))->firstOrFail();
        $loc->status = 'archived';
        $loc->save();

        return response()->json(['ok' => true, 'message' => __('management.pages.unpublished')]);
    }

    public function versions(Page $page, string $locale)
    {
        $loc  = PageLocale::query()->where('page_id', $page->id)->where('locale', strtolower($locale))->firstOrFail();
        $list = PageLocaleVersion::query()
            ->where('page_locale_id', $loc->id)
            ->orderByDesc('version')
            ->limit(20)
            ->get(['id', 'version', 'created_at']);

        return response()->json(['ok' => true, 'data' => $list]);
    }

    public function restoreVersion(Page $page, string $locale, PageLocaleVersion $version)
    {
        $loc = PageLocale::query()->where('page_id', $page->id)->where('locale', strtolower($locale))->firstOrFail();
        if ($version->page_locale_id !== $loc->id) {
            abort(404);
        }
        $snap = (array) $version->snapshot;
        $loc->fill([
            'title'        => $snap['title'] ?? $loc->title,
            'description'  => $snap['description'] ?? $loc->description,
            'seo_draft'    => $snap['seo_draft'] ?? $loc->seo_draft,
            'fields_draft' => $snap['fields_draft'] ?? $loc->fields_draft,
            'blocks_draft' => $snap['blocks_draft'] ?? $loc->blocks_draft,
        ]);
        $loc->save();

        return response()->json(['ok' => true, 'message' => __('management.pages.version_restored')]);
    }
}
