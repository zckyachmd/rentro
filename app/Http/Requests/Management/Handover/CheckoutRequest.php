<?php

namespace App\Http\Requests\Management\Handover;

use App\Models\AppSetting;
use Illuminate\Foundation\Http\FormRequest;
use Illuminate\Http\UploadedFile;

class CheckoutRequest extends FormRequest
{
    public function authorize(): bool
    {
        return $this->user() !== null;
    }

    public function rules(): array
    {
        $minPhotos = max(0, (int) AppSetting::config('handover.min_photos_checkout', 0));

        $filesRules = ['array', 'max:5'];
        if ($minPhotos > 0) {
            $filesRules[] = 'required';
            $filesRules[] = 'min:' . $minPhotos;
        } else {
            $filesRules[] = 'sometimes';
        }

        return [
            'notes'           => ['required', 'string', 'min:20', 'max:2000'],
            'files.general'   => $filesRules,
            'files.general.*' => ['file', 'image', 'max:5120'],
        ];
    }

    public function attributes(): array
    {
        return [
            'notes'           => 'catatan',
            'files.general'   => 'lampiran',
            'files.general.*' => 'lampiran',
        ];
    }

    public function messages(): array
    {
        return [
            'files.general.required' => 'Harap unggah foto sebagai eviden.',
            'files.general.min'      => 'Minimal unggah :min foto sebagai eviden.',
        ];
    }

    public function validatedNotes(): string
    {
        return (string) $this->validated()['notes'];
    }

    /**
     * @return UploadedFile[]
     */
    public function uploadedFiles(): array
    {
        $files = $this->file('files.general');
        if ($files === null) {
            return [];
        }

        return is_array($files) ? $files : [$files];
    }
}
