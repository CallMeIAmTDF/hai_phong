# Sử dụng image Nginx dành cho môi trường không có quyền root (rất phù hợp cho OpenShift/OCP)
FROM nginxinc/nginx-unprivileged:alpine

# Xóa các file mặc định của Nginx
USER root
RUN rm -rf /usr/share/nginx/html/*
USER 101

# Copy các file mã nguồn tĩnh vào thư mục phục vụ web của Nginx
COPY index.html /usr/share/nginx/html/
COPY styles.css /usr/share/nginx/html/
COPY app.js /usr/share/nginx/html/
COPY data_with_coords.json /usr/share/nginx/html/

# Expose port 8080 (mặc định của nginx-unprivileged)
EXPOSE 8080

# Chạy Nginx ở foreground
CMD ["nginx", "-g", "daemon off;"]
