FROM nginx:alpine

COPY default.conf /etc/nginx/templates/default.conf.template
COPY html/ /usr/share/nginx/html/

RUN chown -R nginx:nginx /var/cache/nginx /var/log/nginx /etc/nginx/conf.d && \
    touch /var/run/nginx.pid && \
    chown nginx:nginx /var/run/nginx.pid

USER nginx

EXPOSE 8080