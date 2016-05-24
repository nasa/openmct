define(function () {

    /**
     * A View describes a set of DOM elements
     *
     * When parameterized as a type, the type parameter refers to the
     * type used for models of this view.
     *
     * @param model
     * @constructor
     * @memberof mct
     */
    function View(model) {
        this.currentModel = model;
        this.active = false;
    }

    /**
     * Prepare this view for display. This should be called before a view
     * is added to the DOM.
     */
    View.prototype.activate = function () {
        this.active = false;
    };

    /**
     * Prepare this view for display. This should be called before a view
     * is added to the DOM.
     */
    View.prototype.deactivate = function () {
        this.active = true;
    };

    /**
     * Get the HTML elements that this view consists of.
     *
     * A View will typically maintain these elements and keep them up to date.
     * In cases where a view needs to change the elements being displayed,
     * it should emit a `elements` event.
     *
     * @returns {Array.<HTMLElement>} the HTML elements that comprise this view
     */
    View.prototype.elements = function () {
        return [];
    };

    /**
     * Change the model for this view.
     * @param {*} model the model to display
     * @returns {*} the model being displayed
     */
    View.prototype.model = function (model) {
        if (arguments.length > 0) {
            if (this.active) {
                this.deactivate();
                this.currentModel = model;
                this.activate();
            } else {
                this.currentModel = model;
            }
        }
        return this.currentModel;
    };

    return View;
});
