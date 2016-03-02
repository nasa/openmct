/*global module,element,by,browser*/

module.exports = function create(name) {
    var createButton = element.all(
            by.css('[ng-click="createController.toggle()"]')
        );

    createButton.click();

    return browser.wait(function () {
            return element(by.css('[ng-click="createAction.perform()"]'))
                .isPresent();
        }, 1000)
        .then(function () {
            return element.all(by.css('[ng-click="createAction.perform()"]'))
                .filter(function (el) {
                    return el.getText().then(function (text) {
                        return text.indexOf(name) > -1;
                    });
                })
                .click();
        });
};