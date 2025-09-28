<?php

namespace App\Http\Requests\Management\Page;

use Illuminate\Foundation\Http\FormRequest;
use Illuminate\Validation\Rule;

class UpsertPageDraftRequest extends FormRequest
{
    public function authorize(): bool
    {
        return true;
    }

    protected function prepareForValidation(): void
    {
        $fields = $this->input('fields');
        if (is_array($fields) && isset($fields['body']) && is_string($fields['body'])) {
            $body           = $fields['body'];
            $body           = strip_tags($body, '<p><br><strong><em><ul><ol><li><a><img><h1><h2><h3><blockquote>');
            $body           = preg_replace('/on\w+\s*=\s*"[^"]*"/i', '', $body) ?? $body;
            $body           = preg_replace('/javascript:\s*/i', '', $body) ?? $body;
            $fields['body'] = $body;
            $this->merge(['fields' => $fields]);
        }
    }

    public function rules(): array
    {
        return [
            'title'        => ['nullable', 'string', 'max:255'],
            'description'  => ['nullable', 'string', 'max:2000'],
            'seo'          => ['nullable', 'array'],
            'fields'       => ['nullable', 'array'],
            'blocks'       => ['nullable', 'array'],
            'publish_at'   => ['nullable', 'date'],
            'unpublish_at' => ['nullable', 'date', 'after:publish_at'],
            'status'       => ['nullable', Rule::in(['draft', 'scheduled'])],
        ];
    }
}
