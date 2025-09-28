<?php

namespace App\Http\Controllers\Management;

use App\Http\Controllers\Controller;
use App\Http\Requests\Management\Content\UploadContentRequest;
use App\Models\ContentAsset;
use Illuminate\Support\Facades\Storage;

class ContentUploadController extends Controller
{
    public function upload(UploadContentRequest $request)
    {
        $disk = 'public';
        $dir  = 'content';

        $path = $request->file('file')->store($dir, $disk);

        $asset = ContentAsset::create([
            'disk'       => $disk,
            'path'       => $path,
            'collection' => $request->string('collection')->toString() ?: null,
            'meta'       => [
                'original_name' => $request->file('file')->getClientOriginalName(),
                'size'          => $request->file('file')->getSize(),
                'mime'          => $request->file('file')->getMimeType(),
            ],
        ]);

        /** @var \Illuminate\Filesystem\FilesystemAdapter $storage */
        $storage = Storage::disk($disk);

        return response()->json([
            'ok'      => true,
            'message' => __('management.content.uploaded'),
            'url'     => $storage->url($path),
            'meta'    => $asset->meta,
        ], 201);
    }
}
