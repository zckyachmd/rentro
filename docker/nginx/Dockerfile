FROM nginx:1.26-alpine

# Copy nginx configuration
COPY docker/nginx/nginx.main.conf /etc/nginx/nginx.conf
COPY docker/nginx/nginx.conf /etc/nginx/conf.d/default.conf

# Entrypoint and healthcheck scripts
COPY docker/nginx/entrypoint.sh /usr/local/bin/nginx-entrypoint.sh
COPY docker/nginx/healthcheck.sh /usr/local/bin/nginx-healthcheck.sh
RUN chmod 755 /usr/local/bin/nginx-entrypoint.sh /usr/local/bin/nginx-healthcheck.sh

EXPOSE 80
ENTRYPOINT ["/usr/local/bin/nginx-entrypoint.sh"]
CMD ["nginx", "-g", "daemon off;"]
