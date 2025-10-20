<?php

/*
|--------------------------------------------------------------------------
| Config: snowflake
|--------------------------------------------------------------------------
| Purpose: Configuration for distributed ID generation using Snowflake.
| Keys:
| - datacenter_id (env SNOWFLAKE_DATACENTER_ID): 0..31 datacenter identifier.
| - worker_id (env SNOWFLAKE_WORKER_ID): 0..31 worker identifier within DC.
| - epoch_ms (env SNOWFLAKE_EPOCH_MS): Custom epoch in milliseconds.
*/

return [
    // 0..31 datacenter id (library supports 5 bits by default, but here we only pass ints)
    'datacenter_id' => env('SNOWFLAKE_DATACENTER_ID', 1),
    // 0..31 worker id
    'worker_id' => env('SNOWFLAKE_WORKER_ID', 1),
    // milliseconds since epoch for custom start timestamp
    'epoch_ms' => env('SNOWFLAKE_EPOCH_MS', 1704067200000), // 2024-01-01 UTC
];
