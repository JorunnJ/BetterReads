# Använd en officiell Node-bild
FROM node:18

# Sätt arbetskatalogen
WORKDIR /app

# Set CHOKIDAR_USEPOLLING to true for file watching
ENV WATCHPACK_POLLING=True

# Kopiera package.json och installera beroenden
COPY ./package.json ./package-lock.json ./
RUN npm install


# Kopiera resten av frontend-koden
COPY . .

# Exponera porten (vanligtvis 3000 för CRA)
EXPOSE 3000

# Starta React-appens
CMD ["npm", "start"]