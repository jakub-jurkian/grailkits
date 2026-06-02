FROM nginx:alpine

# Kopiujemy konfigurację do folderu na szablony
COPY default.conf /etc/nginx/templates/default.conf.template

# Jako root poprawiamy uprawnienia do domyślnych katalogów Nginxa
RUN chown -R nginx:nginx /var/cache/nginx /var/log/nginx /etc/nginx/conf.d && \
    touch /var/run/nginx.pid && \
    chown nginx:nginx /var/run/nginx.pid

USER nginx

EXPOSE 8080