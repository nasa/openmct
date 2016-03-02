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

        if (nested) {
            nested();
        }
    }.bind(this));
};

module.exports = CreateTemplate;