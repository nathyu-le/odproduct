"""Verify the public release after cPanel's existing GitHub updater applies it."""
import os
import pathlib
import re
import time
import urllib.error
import urllib.request
import xml.etree.ElementTree as ET

site = os.environ.get("CPANEL_SITE_URL", "https://muaplus.com").rstrip("/")
expected = pathlib.Path("build/update/assets/release.txt").read_text().strip()
headers = {"User-Agent": "Mozilla/5.0", "Cache-Control": "no-cache"}

def fetch(path):
    request = urllib.request.Request(site + path, headers=headers)
    with urllib.request.urlopen(request, timeout=15) as response:
        return response.status, response.read(), response.headers, response.url

deadline = time.monotonic() + 480
ready = False
while time.monotonic() < deadline:
    try:
        fetch("/api/index.php?route=catalog")
        _, marker, _, _ = fetch("/assets/release.txt?t=" + str(int(time.time())))
        _, body, _, _ = fetch("/?release_check=" + str(int(time.time())))
        html = body.decode("utf-8")
        match = re.search(r'src="([^"]+\.js\?v=\d+)"', html)
        cache = ""
        if match:
            _, _, asset_headers, _ = fetch(match.group(1))
            cache = ", ".join(asset_headers.get_all("Cache-Control") or [])
        ready = (
            marker.decode().strip() == expected
            and 'id="od-runtime"' in html
            and 'rel="canonical"' in html
            and "<h1>" in html
            and "no-cache" in cache
            and "must-revalidate" in cache
        )
        print("Hosting release:", marker.decode().strip(), "PHP SEO:", 'id="od-runtime"' in html, "asset cache:", cache, flush=True)
        if ready:
            break
    except (urllib.error.URLError, ValueError) as error:
        print("Waiting for hosting:", type(error).__name__, flush=True)
    time.sleep(20)

if not ready:
    raise SystemExit("Build was published, but hosting verification did not complete in eight minutes.")

for path, locale in [("/", "en"), ("/vi", "vi"), ("/ko", "ko"), ("/zh", "zh"), ("/blog", "en")]:
    status, body, _, _ = fetch(path)
    html = body.decode("utf-8")
    assert status == 200 and '<html lang="' + locale + '"' in html
    assert 'rel="canonical"' in html and 'property="og:title"' in html
    assert 'name="description"' in html and "<h1>" in html
    print("PASS live SEO:", path, locale, flush=True)

_, xml, _, _ = fetch("/sitemap.xml")
ET.fromstring(xml)
assert b"/order/" not in xml and b"/admin" not in xml
_, robots, _, _ = fetch("/robots.txt")
assert (site + "/sitemap.xml").encode() in robots
_, _, private_headers, _ = fetch("/admin")
assert "noindex" in private_headers.get("X-Robots-Tag", "")
for path in ["/index.html", "/index.php"]:
    _, _, _, url = fetch(path)
    assert url == site + "/"
try:
    fetch("/blog/does-not-exist-deployment-check")
    raise AssertionError("Missing article returned HTTP 200")
except urllib.error.HTTPError as error:
    assert error.code == 404
print("PASS public release, PHP SEO, four locales, sitemap, privacy, redirects and asset cache.", flush=True)
