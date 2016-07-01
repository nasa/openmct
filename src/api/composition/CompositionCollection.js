define([
    'EventEmitter',
    'lodash',
    '../objects/object-utils'
], function (
    EventEmitter,
    _,
    objectUtils
) {

    function CompositionCollection(domainObject, provider) {
        EventEmitter.call(this);
        this.domainObject = domainObject;
        this.provider = provider;
        this.provider.on(
            this.domainObject,
            'add',
            this.onProviderAdd,
            this
        );
        this.provider.on(
            this.domainObject,
            'remove',
            this.onProviderRemove,
            this
        );
    };

    CompositionCollection.prototype = Object.create(EventEmitter.prototype);

    CompositionCollection.prototype.onProviderAdd = function (child) {
        this.add(child, true);
    };

    CompositionCollection.prototype.onProviderRemove = function (child) {
        this.remove(child, true);
    };

    CompositionCollection.prototype.indexOf = function (child) {
        return _.findIndex(this._children, function (other) {
            return objectUtils.equals(child, other);
        });
    };

    CompositionCollection.prototype.contains = function (child) {
        return this.indexOf(child) !== -1;
    };

    CompositionCollection.prototype.add = function (child, skipMutate) {
        if (!this._children) {
            throw new Error("Must load composition before you can add!");
        }
        if (this.contains(child)) {
            if (skipMutate) {
                return; // don't add twice, don't error.
            }
            throw new Error("Unable to add child: already in composition");
        }
        this._children.push(child);
        this.emit('add', child);
        if (!skipMutate) {
            // add after we have added.
            this.provider.add(this.domainObject, child);
        }
    };

    CompositionCollection.prototype.load = function () {
        return this.provider.load(this.domainObject)
            .then(function (children) {
                this._children = [];
                children.map(function (c) {
                    this.add(c, true);
                }, this);
                this.emit('load');
            }.bind(this));
    };

    CompositionCollection.prototype.remove = function (child, skipMutate) {
        if (!this.contains(child)) {
            if (skipMutate) {
                return;
            }
            throw new Error("Unable to remove child: not found in composition");
        }
        var index = this.indexOf(child);
        var removed = this._children.splice(index, 1)[0];
        this.emit('remove', index, child);
        if (!skipMutate) {
            // trigger removal after we have internally removed it.
            this.provider.remove(this.domainObject, removed);
        }
    };

    CompositionCollection.prototype.destroy = function () {
        this.provider.off('add', this.onProviderAdd, this);
        this.provider.off('remove', this.onProviderRemove, this);
    };

    return CompositionCollection
});
