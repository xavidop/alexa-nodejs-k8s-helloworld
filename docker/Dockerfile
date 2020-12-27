FROM node:12.18-alpine
ENV NODE_ENV=production
WORKDIR /usr/src/app
COPY ./app/ .
RUN npm install --production
EXPOSE 3000
CMD ["node", "index.js"]
