FROM node:22-slim
WORKDIR /workspace

# Salin package.json saja (abaikan lockfile pnpm yang bikin konflik path)
COPY package.json ./

# Paksa install semua modul menggunakan npm biasa agar mandiri & utuh
RUN npm install

# Salin seluruh sisa source code backend
COPY . .

# Set environment PORT untuk Google Cloud Run
ENV PORT=8080
EXPOSE 8080

# Jalankan server secara langsung tanpa lewat script pnpm
CMD ["node", "src/server.js"]