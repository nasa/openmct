define(['lodash'], function (_) {
    function Provider(compositor) {
        function invoke(factory) {
            return factory();
        }

        this.compositor = compositor;
        this.instantiated = false;
        this.factories = [];
        this.decorators = [];

        this.get = _.memoize(function () {
            return this.decorators.reduce(function (instance, decorator) {
                return decorator(instance);
            }, this.compositor(this.factories.map(function (factory) {
                return factory();
            })));
        }.bind(this));
    }

    Provider.prototype.register = function (factory, options) {
        this.factories.push(factory);
    };

    Provider.prototype.decorate = function (decorator, options) {
        this.decorators.push(decorator);
    };

    Provider.prototype.compose = function (compositor, options) {
        this.compositor = compositor;
    };

    return Provider;
});