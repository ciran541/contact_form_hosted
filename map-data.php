<?php
require_once 'config.php';

header('Content-Type: application/json');

$data = [
    'key' => $_ENV['GOOGLE_MAPS_API_KEY'],
    'location' => [
        'lat' => 1.2855,
        'lng' => 103.8521
    ],
    'name' => 'The Loan Connection',
    'address' => '1 Fullerton Rd, #02-01, Singapore 049213'
];

echo json_encode($data);