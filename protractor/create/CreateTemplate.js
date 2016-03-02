var launch = require('../common/Launch'),
    create = require('../common/create');

function CreateTemplate(name, expectEditMode) {
    this.name = name;
    this.expectEditMode = !!expectEditMode;
}

CreateTemplate.prototype.describe = function (nested) {
    describe("Create " + this.name, function () {
        beforeEach(launch);
        beforeEach(create.bind(this, this.name));

        it(this.expectEditMode ? "initiates Edit mode" : "does not initiate Edit mode", function () {
            expect(element(by.css('.s-status-editing')).isPresent())
                .toBe(this.expectEditMode);
        }.bind(this));

        it(!this.expectEditMode ? "shows a dialog" : "does not show a dialog", function () {
            expect(element(by.css('.overlay')).isPresent())
                .toBe(!this.expectEditMode);
        }.bind(this));

        if (this.expectEditMode) {
            describe("when saved", function () {
                var overlay;

                beforeEach(function () {
                    element(by.css('.t-save')).click();
                    overlay = element(by.css('.overlay'));
                });

                it("shows a dialog", function () {
                    expect(overlay.isPresent()).toBe(true);
                });

                describe("and confirmed", function () {
                    beforeEach(function () {
                        overlay.all(by.css('.bottom-bar .s-btn'))
                            .filter(function (element) {
                                return element.getText().then(function (text) {
                                    return text === 'OK';
                                });
                            })
                            .click();
                    });

                    it("dismisses the dialog", function () {
                        expect(element(by.css('.overlay')).isPresent())
                            .toBe(false);
                    });
                });

                describe("and cancelled", function () {
                    beforeEach(function () {
                        overlay.all(by.css('.bottom-bar .s-btn'))
                            .filter(function (element) {
                                return element.getText().then(function (text) {
                                    return text === 'Cancel';
                                });
                            })
                            .click();
                    });

                    it("dismisses the dialog", function () {
                        expect(element(by.css('.overlay')).isPresent())
                            .toBe(false);
                    });
                });
            });
        }

        if (nested) {
            nested();
        }
    }.bind(this));
};

module.exports = CreateTemplate;
