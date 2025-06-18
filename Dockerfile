# Imagen base oficial de Node.js
FROM node:18

# Instalar dependencias necesarias para Puppeteer/Chromium
RUN apt-get update && apt-get install -y \
    wget ca-certificates fonts-liberation libappindicator3-1 \
    libasound2 libatk-bridge2.0-0 libatk1.0-0 libcups2 libdbus-1-3 \
    libgdk-pixbuf2.0-0 libnspr4 libnss3 libx11-xcb1 libxcomposite1 \
    libxdamage1 libxrandr2 xdg-utils \
    --no-install-recommends && \
    apt-get clean && rm -rf /var/lib/apt/lists/*

# Carpeta de trabajo
WORKDIR /app

# Copiar package.json y package-lock primero para aprovechar cache
COPY package*.json ./

# Instalar dependencias
RUN npm install

# Copiar todo el código
COPY . .

# Exponer puerto
EXPOSE 3000

# Comando de inicio
CMD ["node", "server.js"]
