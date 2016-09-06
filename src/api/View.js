define([], function () {

    /**
     * A View is used to provide displayable content, and to react to
     * associated life cycle events.
     *
     * @interface
     * @memberof module:openmct
     */
    function View() {

    }

    /**
     * Populate the supplied DOM element with the contents of this view.
     *
     * View implementations should use this method to attach any
     * listeners or acquire other resources that are necessary to keep
     * the contents of this view up-to-date.
     *
     * @param {HTMLElement} container the DOM element to populate
     * @method show
     * @memberof module:openmct.View#
     */
    View.prototype.show = function (container) {

    };

    /**
     * Release any resources associated with this view.
     *
     * View implementations should use this method to detach any
     * listeners or release other resources that are no longer necessary
     * once a view is no longer used.
     *
     * @method destroy
     * @memberof module:openmct.View#
     */
    View.prototype.destroy = function () {

    };

    /**
     * Exposes types of views in Open MCT.
     *
     * @interface ViewProvider
     * @memberof module:openmct
     */

    /**
     * Check if this provider can supply views for a domain object.
     * @method canView
     * @memberof module:openmct.ViewProvider#
     * @param {module:openmct.DomainObject} domainObject the domain object
     *        to be viewed
     * @returns {boolean} true if this domain object can be viewed using
     *          this provider
     */

    /**
     * Provide a view of this domain object.
     * @method view
     * @memberof module:openmct.ViewProvider#
     * @param {module:openmct.DomainObject} domainObject the domain object
     *        to be viewed
     * @returns {module:openmct.View} a view of this domain object
     */

    /**
     * Get metadata associated with this view provider. This may be used
     * to populate the user interface with options associated with this
     * view provider.
     *
     * @method metadata
     * @memberof module:openmct.ViewProvider#
     * @returns {module:openmct.ViewProvider~ViewMetadata} view metadata
     */

    /**
     * @typedef ViewMetadata
     * @memberof module:openmct.ViewProvider~
     * @property {string} name the human-readable name of this view
     * @property {string} key a machine-readable name for this view
     * @property {string} [description] a longer-form description (typically
     *           a single sentence or short paragraph) of this kind of view
     * @property {string} cssclass the CSS class to apply to labels for this
     *           view (to add icons, for instance)
     */

    return View;
});
