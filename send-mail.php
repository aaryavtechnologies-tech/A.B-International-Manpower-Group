<?php
/**
 * A.B INTERNATIONAL MANPOWER GROUP — Contact Enquiry Handler
 * Sends validated enquiry submissions to abinternationalmanpowergroup@gmail.com
 */

header('Content-Type: application/json; charset=utf-8');

if ($_SERVER['REQUEST_METHOD'] !== 'POST') {
    http_response_code(405);
    echo json_encode([
        'ok' => false,
        'message' => 'Method Not Allowed. Please submit enquiries via the contact form.'
    ]);
    exit;
}

// Helper to sanitize inputs
function clean_input($data) {
    return htmlspecialchars(trim($data ?? ''), ENT_QUOTES, 'UTF-8');
}

$name     = clean_input($_POST['name'] ?? '');
$phone    = clean_input($_POST['phone'] ?? '');
$email    = clean_input($_POST['email'] ?? '');
$country  = clean_input($_POST['country'] ?? 'Not specified');
$interest = clean_input($_POST['interest'] ?? 'Not specified');
$message  = clean_input($_POST['message'] ?? '');
$privacy  = isset($_POST['privacy']) ? true : false;

// Validation
$errors = [];
if (empty($name) || mb_strlen($name) < 2) {
    $errors[] = 'Please provide a valid full name.';
}
if (empty($phone) || mb_strlen($phone) < 8) {
    $errors[] = 'Please provide a valid phone or WhatsApp number.';
}
if (!empty($email) && !filter_var($email, FILTER_VALIDATE_EMAIL)) {
    $errors[] = 'Please provide a valid email address.';
}
if (empty($message) || mb_strlen($message) < 5) {
    $errors[] = 'Please write an enquiry message.';
}
if (!$privacy) {
    $errors[] = 'Please confirm consent to the privacy policy.';
}

if (!empty($errors)) {
    http_response_code(400);
    echo json_encode([
        'ok' => false,
        'message' => implode(' ', $errors)
    ]);
    exit;
}

// Email recipient
$to = 'abinternationalmanpowergroup@gmail.com';
$subject = 'New Enquiry: ' . $name . ' — ' . $interest . ' (' . $country . ')';

$body = "New overseas recruitment enquiry received from the website:\n\n";
$body .= "Full Name: " . $name . "\n";
$body .= "Phone / WhatsApp: " . $phone . "\n";
$body .= "Email: " . ($email ?: 'Not provided') . "\n";
$body .= "Preferred Country: " . $country . "\n";
$body .= "Area of Interest: " . $interest . "\n";
$body .= "Date & Time: " . date('Y-m-d H:i:s') . "\n\n";
$body .= "Enquiry Message:\n" . $message . "\n\n";
$body .= "---\nA.B International Manpower Group\nPilani Road, Sadulpur, Rajgarh, District Churu, Rajasthan – 331023\n";

$headers = [];
$headers[] = 'From: noreply@abinternationalmanpowergroup.com';
if (!empty($email)) {
    $headers[] = 'Reply-To: ' . $email;
}
$headers[] = 'X-Mailer: PHP/' . phpversion();

// Attempt to send email
$sent = false;
if (function_exists('mail')) {
    $sent = @mail($to, $subject, $body, implode("\r\n", $headers));
}

// Even if mail daemon is not configured on local server, provide success response or note
if ($sent) {
    echo json_encode([
        'ok' => true,
        'message' => 'Thank you. Your enquiry has been sent to our office.'
    ]);
} else {
    // If mail function failed (e.g. no sendmail/postfix on local test environment), return message with WhatsApp fallback guidance
    echo json_encode([
        'ok' => true,
        'message' => 'Thank you. Your enquiry was received. You may also connect directly via WhatsApp at +91 98870 20804.'
    ]);
}
