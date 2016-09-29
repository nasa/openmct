define(['zepto'], function ($) {
    function InspectorRegion(element, selection, inspectors) {
        this.element = element;
        this.selection = selection;
        this.inspectors = inspectors;
        this.active = false;

        this.onSelectionChange = this.onSelectionChange.bind(this);
    }

    InspectorRegion.prototype.onSelectionChange = function (item) {
        var $element = $(this.element);
        var providers = this.inspectors.get(item);

        $element.empty();

        if (factories.length > 0) {
            providers[0].view(item).show(this.element);
        }
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
