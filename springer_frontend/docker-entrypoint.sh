#!/bin/sh
set -eu

: "${BACKEND_URL:?BACKEND_URL is required}"
: "${FRONTEND_HOST:?FRONTEND_HOST is required}"

envsubst '${BACKEND_URL} ${FRONTEND_HOST}' \
  < /etc/nginx/templates/default.conf.template \
  > /etc/nginx/conf.d/default.conf