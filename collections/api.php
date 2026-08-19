<?php
// Collections API - Returns data from SQLite database
// URL: /collections/api.php

header('Content-Type: application/json');
header('Access-Control-Allow-Origin: *');
header('Access-Control-Allow-Methods: GET, POST, OPTIONS');
header('Access-Control-Allow-Headers: Content-Type');

if ($_SERVER['REQUEST_METHOD'] === 'OPTIONS') {
    http_response_code(200);
    exit;
}

$dbPath = '/root/.openclaw/workspace/datadepot/data/collections.db';

if (!file_exists($dbPath)) {
    http_response_code(500);
    echo json_encode(['error' => 'Database not found']);
    exit;
}

try {
    $pdo = new PDO("sqlite:$dbPath");
    $pdo->setAttribute(PDO::ATTR_ERRMODE, PDO::ERRMODE_EXCEPTION);
    
    // Handle POST requests (update address or mark paid)
    if ($_SERVER['REQUEST_METHOD'] === 'POST') {
        $data = json_decode(file_get_contents('php://input'), true);
        
        if ($data['action'] === 'update_address') {
            $stmt = $pdo->prepare("UPDATE collections_accounts SET address = ?, updated_at = datetime('now') WHERE invoice_number = ?");
            $stmt->execute([$data['address'], $data['invoice']]);
            echo json_encode(['success' => true, 'message' => 'Address updated']);
            exit;
        }
        
        if ($data['action'] === 'mark_paid') {
            $stmt = $pdo->prepare("UPDATE collections_accounts SET status = 'paid', payment_received = amount, payment_date = datetime('now'), updated_at = datetime('now') WHERE invoice_number = ?");
            $stmt->execute([$data['invoice']]);
            echo json_encode(['success' => true, 'message' => 'Marked as paid']);
            exit;
        }
        
        http_response_code(400);
        echo json_encode(['error' => 'Unknown action']);
        exit;
    }
    
    // GET - Return all accounts
    $stmt = $pdo->query("SELECT * FROM collections_accounts WHERE status != 'paid' ORDER BY days_overdue DESC, amount DESC");
    $accounts = $stmt->fetchAll(PDO::FETCH_ASSOC);
    
    // Format for frontend
    $invoices = [];
    foreach ($accounts as $row) {
        $days = intval($row['days_overdue']);
        $invoices[] = [
            'date' => $row['invoice_date'],
            'customer' => $row['customer_name'],
            'email' => $row['email'] ?? '',
            'invoice' => $row['invoice_number'],
            'amount' => floatval($row['amount']),
            'status' => $row['status'],
            'days' => $days,
            'viewed' => boolval($row['viewed']),
            'note' => $row['notes'] ?? '',
            'address' => $row['address'] ?: 'Address not on file - Click Edit to add',
            'phone' => $row['phone'] ?? ''
        ];
    }
    
    echo json_encode([
        'success' => true,
        'count' => count($invoices),
        'invoices' => $invoices,
        'lastUpdated' => date('Y-m-d H:i:s')
    ]);
    
} catch (PDOException $e) {
    http_response_code(500);
    echo json_encode(['error' => 'Database error: ' . $e->getMessage()]);
}
?>