# Local verification only. cPanel runs the prebuilt static frontend and its own PHP.
FROM php:8.2-cli
RUN --mount=type=secret,id=proxy_ca,required=false \
    if [ -f /run/secrets/proxy_ca ]; then export CURL_CA_BUNDLE=/run/secrets/proxy_ca; export SSL_CERT_FILE=/run/secrets/proxy_ca; export OD_APT_CA_OPTION='-o Acquire::https::CaInfo=/run/secrets/proxy_ca'; fi; \
    apt-get ${OD_APT_CA_OPTION:-} update && \
    apt-get ${OD_APT_CA_OPTION:-} install -y --no-install-recommends libcurl4-openssl-dev libonig-dev && \
    docker-php-ext-install pdo_mysql curl mbstring && rm -rf /var/lib/apt/lists/*
WORKDIR /app
CMD ["php", "-S", "0.0.0.0:8081", "scripts/router.php"]
