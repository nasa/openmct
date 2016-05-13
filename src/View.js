define(function () {
    function View(model) {
        this.currentModel = model;
    }

    View.prototype.attach = function () {
    };

    View.prototype.detach = function () {
    };

    View.prototype.elements = function () {
        return [];
    };

    View.prototype.model = function (model) {
        if (arguments.length > 1) {
            this.detach();
            this.currentModel = model;
            this.attach();
        }
        return this.currentModel;
    };

    return View;
});
