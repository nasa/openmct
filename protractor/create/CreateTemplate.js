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
                beforeEach(function () {
                    element(by.css('.t-save')).click();
                });

                it("shows a dialog", function () {
                    expect(element(by.css('.overlay')).isPresent()).toBe(true);
                });
            });
        }

        if (nested) {
            nested();
        }
    }.bind(this));
};

module.exports = CreateTemplate;
