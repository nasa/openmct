define(function () {
    /**
     * @typedef TypeDefinition
     * @memberof module:openmct.Type~
     * @property {Metadata} metadata displayable metadata about this type
     * @property {function (object)} [initialize] a function which initializes
     *           the model for new domain objects of this type
     * @property {boolean} [creatable] true if users should be allowed to
     *           create this type (default: false)
     */

    /**
     * A Type describes a kind of domain object that may appear or be
     * created within Open MCT.
     *
     * @param {module:opemct.Type~TypeDefinition} definition
     * @class Type
     * @memberof module:openmct
     */
    function Type(definition) {
        this.definition = definition;
    }

    /**
     * Check if a domain object is an instance of this type.
     * @param domainObject
     * @returns {boolean} true if the domain object is of this type
     * @memberof module:openmct.Type#
     * @method check
     */
    Type.prototype.check = function (domainObject) {
        // Depends on assignment from MCT.
        return domainObject.type === this.key;
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
        def.properties = this.definition.form;

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
