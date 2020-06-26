FROM node:latest

RUN git clone https://github.com/nasa/openmct.git

WORKDIR /openmct

RUN npm install

# npm start

EXPOSE 8080
