FROM node:latest

LABEL maintainer="haisam.ido@gmail.com"

RUN git clone --recurse-submodules -j2 https://github.com/nasa/openmct.git

WORKDIR /openmct

RUN npm install

EXPOSE 8080
