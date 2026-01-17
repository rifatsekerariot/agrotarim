FROM node:18-alpine

WORKDIR /app

COPY package*.json ./

RUN npm install

COPY . .


# Generate Prisma Client
RUN npx prisma generate

COPY start.sh .
RUN chmod +x start.sh

EXPOSE 3000

CMD ["./start.sh"]
