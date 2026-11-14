<?php
// Runs without a database. Uses a temporary dummy config and never reads production secrets.
declare(strict_types=1);
$configFile = tempnam(sys_get_temp_dir(), "od-content-test-");
chmod($configFile, 0600);
file_put_contents(
    $configFile,
    "<?php return " .
        var_export(
            [
                "url" => "https://example.test/shop",
                "app_key" => bin2hex(random_bytes(32)),
            ],
            true,
        ) .
        ";",
);
putenv("OD_CONFIG=" . $configFile);
require __DIR__ . "/../backend/src/content.php";
function check(bool $ok, string $message): void
{
    if (!$ok) {
        throw new RuntimeException($message);
    }
}
try {
    $html = content_sanitize(
        '<h2>안녕하세요 / 你好 / Xin chào</h2><p onclick="alert(1)" style="text-align:center">Readable <strong>content</strong></p><script>alert(1)</script><svg><script>alert(2)</script></svg><iframe src="https://evil.test"></iframe><a href="java&#x73;cript:alert(1)">Unsafe link</a><a href="https://example.test/guide">Safe link</a><img src="data:image/svg+xml,bad" onerror="alert(1)"><img src="images/test.jpg" alt="An example" onerror="alert(2)"><table><tr><td colspan="2">Cell</td></tr></table>',
    );
    check(
        !preg_match(
            "/<script|<svg|<iframe|onerror|onclick|javascript:|data:image/i",
            $html,
        ),
        "Unsafe HTML survived",
    );
    check(
        str_contains($html, 'id="section-1"') &&
            str_contains($html, "안녕하세요 / 你好 / Xin chào"),
        "Headings or Unicode were lost",
    );
    check(
        str_contains($html, "<strong>content</strong>") &&
            str_contains($html, "<table>") &&
            str_contains($html, 'colspan="2"'),
        "Semantic formatting was lost",
    );
    check(
        str_contains($html, "https://example.test/shop/images/test.jpg") &&
            str_contains($html, 'alt="An example"'),
        "Local image normalization failed",
    );
    check(
        str_contains($html, 'href="https://example.test/guide"') &&
            str_contains($html, 'rel="noopener noreferrer"'),
        "Safe links were lost",
    );
    foreach (
        [
            "../config.php",
            "uploads/../../config.php",
            "uploads/image.svg",
            "https://evil.test/image.jpg",
        ]
        as $path
    ) {
        try {
            content_image($path);
            throw new RuntimeException("Unsafe image path accepted");
        } catch (HttpError $e) {
            check($e->status === 422, "Unexpected image error");
        }
    }
    echo "PASS content sanitizer: XSS, local images, subdirectory URLs, semantic formatting and Unicode.\n";
} finally {
    @unlink($configFile);
}
