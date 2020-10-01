FROM node:alpine

WORKDIR /openmct

COPY . ./

RUN apk update && apk upgrade \
  && apk add --no-cache git \
  && npm install \
  && npm run build:prod

EXPOSE 8080

CMD ["npm", "start"]