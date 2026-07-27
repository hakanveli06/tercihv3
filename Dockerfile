# Betül Tercih Robotu — Coolify/GitHub için hazır
FROM node:20-alpine
WORKDIR /app
COPY . /app
ENV PORT=8080
ENV DATA_DIR=/data
# Listeler bu klasörde saklanır; Coolify'da /data'ya KALICI VOLUME bağlayın
VOLUME ["/data"]
EXPOSE 8080
CMD ["node","server.js"]
