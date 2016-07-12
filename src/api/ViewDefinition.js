define(function () {

    /**
     * Defines a kind of view.
     * @interface
     */
    function ViewDefinition() {
    }

    /**
     * Get metadata about this view, as may be used in the user interface
     * to present options for this view.
     * @param {*} object the object to be shown in this view
     * @returns {mct.ViewMetadata} metadata about this view
     */
    ViewDefinition.prototype.metadata = function (object) {
    };

    /**
     * Instantiate a new view of this object. Callers of this method are
     * responsible for calling `canView` before instantiating views in this
     * manner.
     *
     * @param {*} object the object to be shown in this view
     * @returns {mct.View} a view of this object
     */
    ViewDefinition.prototype.view = function (object) {
    };

    /**
     * Check if this view is capable of showing this object. Users of
     * views should use this method before calling `show`.
     *
     * Subclasses should override this method to control the applicability
     * of this view to other objects.
     *
     * @param {*} object the object to be shown in this view
     * @returns {boolean} true if this view is applicable to this object
     */
    ViewDefinition.prototype.canView = function (object) {
    };

    return ViewDefinition;
});
