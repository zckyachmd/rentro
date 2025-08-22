<?php

$finder = PhpCsFixer\Finder::create()
    ->in([
        __DIR__.'/app',
        __DIR__.'/config',
        __DIR__.'/routes',
    ])
    ->exclude([
        'database',
        'vendor',
        'storage',
        'resources',
        'public',
        'bootstrap/cache',
        'node_modules',
        'tests',
    ])
    ->notPath('storage/framework/views');

$config = new PhpCsFixer\Config();

return $config->setRules([
    '@PSR12' => true,
    'strict_param' => false,
    'array_syntax' => ['syntax' => 'short'],
    'single_line_throw' => false,
    'binary_operator_spaces' => [
        'default' => 'single_space',
        'operators' => [
            '=' => 'align_single_space_minimal',
            '=>' => 'align_single_space_minimal',
        ],
    ],
    'blank_line_after_namespace' => true,
    'blank_line_after_opening_tag' => true,
    'blank_line_before_statement' => [
        'statements' => [
            'return',
        ],
    ],
    'cast_spaces' => true,
    'class_attributes_separation' => [
        'elements' => [
            'method' => 'one',
        ],
    ],
    'concat_space' => [
        'spacing' => 'one',
    ],
    'declare_equal_normalize' => true,
    'function_typehint_space' => true,
    'single_line_comment_style' => [
        'comment_types' => [
            'hash',
        ],
    ],
    'no_extra_blank_lines' => [
        'tokens' => [
            'extra',
            'throw',
            'use',
            'use_trait',
        ],
    ],
    'no_spaces_around_offset' => true,
    'no_unused_imports' => true,
    'ordered_imports' => true,
    'phpdoc_align' => [
        'align' => 'left',
    ],
    'phpdoc_indent' => true,
    'phpdoc_no_access' => true,
    'phpdoc_no_package' => true,
    'phpdoc_scalar' => true,
    'phpdoc_single_line_var_spacing' => true,
    'phpdoc_summary' => true,
    'phpdoc_to_comment' => true,
    'phpdoc_trim' => true,
    'phpdoc_types' => true,
    'phpdoc_var_without_name' => true,
    'return_type_declaration' => true,
    //'single_blank_line_before_namespace' => true,
    'single_import_per_statement' => true,
    'single_trait_insert_per_statement' => true,
    'space_after_semicolon' => true,
    'standardize_not_equals' => true,
    'switch_case_semicolon_to_colon' => true,
    'switch_case_space' => true,
    'ternary_operator_spaces' => true,
    'trailing_comma_in_multiline' => [
        'elements' => [
            'arrays',
            'arguments',
            'parameters',
        ],
    ],
    'unary_operator_spaces' => true,
    'whitespace_after_comma_in_array' => true,
])->setFinder($finder);
