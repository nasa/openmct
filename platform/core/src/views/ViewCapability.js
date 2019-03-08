define(
    [],
    function () {
     /**
      * A `view` capability can be used to retrieve an array of
      * all views (or, more specifically, the declarative metadata
      * thereabout) which are applicable to a specific domain
      * object.
      *
      * @memberof platform/core
      * @implements {Capability}
      * @constructor
      */
     function ViewCapability(viewService, domainObject) {
          this.viewService = viewService;
          this.domainObject = domainObject;
      }

      /**
       * Get all view definitions which are applicable to
       * this object.
       * @returns {View[]} an array of view definitions
       *          which are applicable to this object.
       * @memberof platform/core.ViewCapability#
       */
      ViewCapability.prototype.invoke = function () {
          return this.viewService.getViews(this.domainObject);
      };

     return ViewCapability;
    }
);
