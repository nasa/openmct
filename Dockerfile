FROM node:latest

RUN git clone https://github.com/nasa/openmct.git

WORKDIR /openmct

RUN npm install

RUN npm start

EXPOSE 8080:8080
