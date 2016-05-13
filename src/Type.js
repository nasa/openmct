define(function () {
    function Type(name, metadata, baseTypes) {
        this.baseTypes = baseTypes;
        this.typeName = name;
        this.typeMetadata = metadata;
    }

    Type.prototype.name = function () {
        return this.typeName;
    };

    Type.prototype.metadata = function () {
        return this.typeMetadata;
    };

    Type.prototype.objectify = function (model, id) {

    };

    Type.prototype.representer = function (factory, region) {

    };

    Type.prototype.action = function (factory, context) {

    };

    return Type;
});
