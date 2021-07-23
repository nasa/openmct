// playwright.config.js
// @ts-check

/** @type {import('@playwright/test').PlaywrightTestConfig} */
const config = {
    use: {
        /*httpCredentials: {
            username: process.env.USERNAME,
            password: process.env.PASSWORD
        },*/
        baseURL: 'http://localhost:8080',
        headless: false,
        ignoreHTTPSErrors: true,
        trace: 'on',
        video: 'on'
    }
};

module.exports = config;
