define([

], function (

) {


    var PROVIDER_REGISTRY = [];

    function getProvider (object) {
        return PROVIDER_REGISTRY.filter(function (p) {
            return p.appliesTo(object);
        })[0];
    };

    function composition(object) {
        var provider = getProvider(object);

        if (!provider) {
            return;
        }

        return new CompositionCollection(object, provider);
    };

    composition.addProvider = function (provider) {
        PROVIDER_REGISTRY.unshift(provider);
    };

    window.MCT = window.MCT || {};
    window.MCT.composition = composition;

    function CompositionCollection(domainObject, provider) {
        this.domainObject = domainObject;
        this.provider = provider;
    };

    CompositionCollection.prototype.add = function (child, skipMutate) {
        if (!this._children) {
            throw new Error("Must load composition before you can add!");
        }
        // we probably should not add until we have loaded.
        // todo: should we modify parent?
        if (!skipMutate) {
            this.provider.add(this.domainObject, child);
        }
        this.children.push(child);
        this.emit('add', child);
    };

    CompositionCollection.prototype.load = function () {
        return this.provider.load(this.domainObject)
            .then(function (children) {
                this._children = [];
                children.map(function (c) {
                    this.add(c, true);
                }, this);
                this.emit('load');
                // Todo: set up listener for changes via provider?
            }.bind(this));
    };

    CompositionCollection.prototype.remove = function (child) {
        var index = this.children.indexOf(child);
        if (index === -1) {
            throw new Error("Unable to remove child: not found in composition");
        }
        this.provider.remove(this.domainObject, child);
        this.children.splice(index, 1);
        this.emit('remove', index, child);
    };

    var DefaultCompositionProvider = {
        appliesTo: function (domainObject) {
            return !!domainObject.composition;
        },
        load: function (domainObject) {
            return Promise.all(domainObject.composition.map(MCT.objects.get));
        },
        add: function (domainObject, child) {
            domainObject.composition.push(child.key);
        }
    };

    composition.addProvider(DefaultCompositionProvider);

    function Injector() {
        console.log('composition api injected!');
    }

    return Injector;

});
