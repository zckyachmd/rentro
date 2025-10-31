<?php

namespace App\Policies;

use Spatie\Csp\Directive;
use Spatie\Csp\Keyword;
use Spatie\Csp\Policies\Policy;
use Spatie\Csp\Value;

class AppCspPolicy extends Policy
{
    public function configure()
    {
        $isLocal = app()->environment('local', 'testing');

        // Dasar yang aman
        $this
            ->addDirective(Directive::DEFAULT, Keyword::SELF)
            ->addDirective(Directive::BASE, Keyword::SELF)
            ->addDirective(Directive::FORM_ACTION, Keyword::SELF)
            ->addDirective(Directive::FRAME_ANCESTORS, Keyword::SELF)
            ->addDirective(Directive::OBJECT, Keyword::NONE)
            ->addDirective(Directive::IMG, [Keyword::SELF, 'data:', 'blob:', 'https:'])
            ->addDirective(Directive::FONT, [Keyword::SELF, 'data:', 'https:'])
            ->addDirective(Directive::CONNECT, [Keyword::SELF, 'https:', 'wss:'])
            ->addDirective(Directive::STYLE, [Keyword::SELF, 'https:'])
            ->addDirective(Directive::STYLE_ATTR, [Keyword::UNSAFE_INLINE])
            ->addDirective(Directive::STYLE_ELEM, [Keyword::SELF, 'https:'])
            ->addDirective(Directive::SCRIPT, [Keyword::SELF, Keyword::STRICT_DYNAMIC])
            ->addNonceForDirective(Directive::SCRIPT)
            ->addNonceForDirective(Directive::STYLE);

        if ($isLocal) {
            $this
                ->addDirective(Directive::CONNECT, 'ws:')
                ->addDirective(Directive::SCRIPT, Keyword::UNSAFE_EVAL)
                ->addDirective(Directive::STYLE_ELEM, Keyword::UNSAFE_INLINE);
        } else {
            $this->addDirective(Directive::UPGRADE_INSECURE_REQUESTS, Value::NO_VALUE);
        }

        // Merge whitelist dari config (sudah diisi dari ENV di config/csp.php)
        $map = [
            Directive::DEFAULT         => 'default',
            Directive::SCRIPT          => 'script',
            Directive::SCRIPT_ATTR     => 'script_attr',
            Directive::SCRIPT_ELEM     => 'script_elem',
            Directive::STYLE           => 'style',
            Directive::STYLE_ATTR      => 'style_attr',
            Directive::STYLE_ELEM      => 'style_elem',
            Directive::IMG             => 'img',
            Directive::FONT            => 'font',
            Directive::CONNECT         => 'connect',
            Directive::FRAME           => 'frame',
            Directive::FRAME_ANCESTORS => 'frame_ancestors',
            Directive::OBJECT          => 'object',
            Directive::MEDIA           => 'media',
            Directive::WORKER          => 'worker',
            Directive::MANIFEST        => 'manifest',
        ];

        foreach ($map as $directive => $key) {
            $list = (array) (config("csp.whitelist.{$key}") ?? []);
            if (!empty($list)) {
                $this->addDirective($directive, $list);
            }
        }

        // Report URI jika diset
        if ($uri = config('csp.report_uri')) {
            $this->reportTo($uri);
        }
    }
}
