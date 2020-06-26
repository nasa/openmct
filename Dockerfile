FROM node:latest

LABEL maintainer="Haisam.Ido@gmail.com"

RUN mkdir openmct
WORKDIR /openmct
ADD . .

RUN rm -rf dist
RUN rm -rf node_modules

RUN npm install

EXPOSE 8080