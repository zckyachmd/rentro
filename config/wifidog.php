<?php

/*
|--------------------------------------------------------------------------
| Config: wifidog
|--------------------------------------------------------------------------
| Purpose: Policies for WiFiDog gateway integration endpoints.
| Keys:
| - allow_unknown_ping: Allow /wifidog/ping from unregistered gateways.
| - enforce_source_ip: Verify request source IP equals gateway's mgmt IP.
| - enforce_gateway_mac: If set, require gw_mac to match stored MAC address.
*/

return [
    // Izinkan /wifidog/ping berjalan meski gw_id belum terdaftar (untuk auto-discovery/logging)?
    'allow_unknown_ping' => true,

    // Paksa verifikasi IP sumber == mgmt_ip gateway untuk endpoint yang dipanggil gateway (auth/counters)?
    'enforce_source_ip' => true,

    // Jika true dan param 'gw_mac' ada, cocokkan dengan wifi_gateways.mac_address
    'enforce_gateway_mac' => false,
];
