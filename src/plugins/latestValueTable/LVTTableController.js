define([
    './LVTTableRowController'
], function (
    LVTTableRowController
) {

    function LVTTableController(domainObject, openmct) {
        this.domainObject = domainObject;
        this.openmct = openmct;
        this.rowControllers = {};
        this.composition = openmct.composition.get(domainObject);
        this.composition.on('add', this.addChild, this);
        this.composition.on('remove', this.removeChild, this);
        this.data = {
            headers: [
                'Name',
                'Timestamp',
                'Value'
            ],
            rows: [

            ]
        };
        this.composition.load();
    }

    LVTTableController.prototype.addChild = function (childObject) {
        var rowController = new LVTTableRowController(childObject, this.openmct);
        this.rowControllers[rowController.id] = rowController;
        this.data.rows.push(rowController.data);
    };

    LVTTableController.prototype.removeChild = function (identifier) {
        var childId = JSON.stringify(identifier);
        var rowController = this.rowControllers[childId];
        rowController.destroy();
        this.data.rows.splice(this.data.rows.indexOf(rowController.data), 1);
    };

    LVTTableController.prototype.destroy = function () {
        this.composition.off('add', this.addChild, this);
        this.composition.off('remove', this.removeChild, this);
        delete this.composition;
        Object.keys(this.rowControllers).forEach(function (childId) {
            this.rowControllers[childId].destroy();
        }, this);
    };

    return LVTTableController;
});
