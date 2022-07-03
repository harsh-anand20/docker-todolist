FROM node:alpine
EXPOSE 3000
COPY . /app
WORKDIR /app
RUN npm install
CMD ["node", "app.js"]