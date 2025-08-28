<?php

namespace App;

enum RoomType: string
{
    case STANDARD = 'Standard';
    case DELUXE   = 'Deluxe';
    case SUITE    = 'Suite';
    case ECONOMY  = 'Economy';
}
