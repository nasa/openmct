define(function () {
    /**
     * @typedef TypeDefinition
     * @property {Metadata} metadata displayable metadata about this type
     * @property {function (object)} [initialize] a function which initializes
     *           the model for new domain objects of this type
     * @property {boolean} [creatable] true if users should be allowed to
     *           create this type (default: false)
     */

    /**
     *
     * @param {TypeDefinition} definition
     * @constructor
     */
    function Type(definition) {
        this.definition = definition;
        this.views = {};
    }

    Type.prototype.view = function (region, factory) {
        if (arguments.length > 1) {
            this.views[region] = factory;
        }
        return this.views[region];
    };

    /**
     * Get a definition for this type that can be registered using the
     * legacy bundle format.
     * @private
     */
    Type.prototype.toLegacyDefinition = function () {
        var def = {};
        def.name = this.definition.metadata.label;
        def.glyph = this.definition.metadata.glyph;
        def.description = this.definition.metadata.description;

        if (this.definition.initialize) {
            def.model = {};
            this.definition.initialize(def.model);
        }

        if (this.definition.creatable) {
            def.features = ['creation'];
        }
        return def;
    };

    return Type;
});
