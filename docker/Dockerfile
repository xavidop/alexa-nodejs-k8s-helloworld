FROM node:12.18-alpine
WORKDIR /usr/src
COPY ./app/ .
RUN npm install
EXPOSE 3000
ENTRYPOINT ["npm", "start"]