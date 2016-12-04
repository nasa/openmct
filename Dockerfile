FROM node:6

RUN mkdir -p /usr/src/app
WORKDIR /usr/src/app

COPY package.json /usr/src/app/
RUN npm install --no-optional
COPY . /usr/src/app

EXPOSE 8080

# Build the app.
RUN echo '{ "allow_root": true }' > "/root/.bowerrc" && \
    npm run prepublish

CMD [ "npm", "start" ]
