FROM nginx:alpine
RUN echo 'Build: 2026-02-27-13:05' > /build-info.txt
COPY . /usr/share/nginx/html
