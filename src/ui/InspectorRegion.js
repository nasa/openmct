define([], function () {
    function InspectorRegion(element, selection, inspectors) {
        this.element = element;
        this.selection = selection;
        this.inspectors = inspectors;
        this.active = false;
    }

    InspectorRegion.prototype.activate = function () {
        if (this.active) {
            this.deactivate();
        }


        
        this.active = true;
    };

    InspectorRegion.prototype.deactivate = function () {
        if (!this.active) {
            return;
        }



        this.active = false;
    }

    return InspectorRegion;
});
