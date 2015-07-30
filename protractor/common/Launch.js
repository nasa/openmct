/*global module,browser*/

module.exports = function launch() {
    'use strict';
    browser.ignoreSynchronization = true;
    browser.get('http://localhost:1984/');
    browser.sleep(2000);  // 20 seconds
};
