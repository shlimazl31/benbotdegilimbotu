FROM node:18-slim

WORKDIR /app

# Gerekli paketleri yükle
RUN apt-get update && \
    apt-get install -y python3 build-essential && \
    apt-get clean

# Uygulama dosyalarını kopyala
COPY package*.json ./

# Paketleri yükle
RUN npm install --legacy-peer-deps

# Diğer dosyaları kopyala
COPY . .

# Uygulamayı başlat
CMD ["npm", "start"] 