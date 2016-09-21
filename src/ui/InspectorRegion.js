define([], function () {
    function InspectorRegion(element, selection, inspectors) {
        this.element = element;
        this.selection = selection;
        this.inspectors = inspectors;
        this.active = false;

        this.onSelectionChange = this.onSelectionChange.bind(this);
    }

    InspectorRegion.prototype.onSelectionChange = function (item) {

    };

    InspectorRegion.prototype.activate = function () {
        if (this.active) {
            this.deactivate();
        }

        this.selection.on('change', this.onSelectionChange);

        this.active = true;
    };

    InspectorRegion.prototype.deactivate = function () {
        if (!this.active) {
            return;
        }

        this.selection.off('change', this.onSelectionChange);

        this.active = false;
    };

    return InspectorRegion;
});
