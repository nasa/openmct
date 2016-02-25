define(['./Provider', 'lodash'], function (Provider, _) {
    function ServiceProvider(compositor) {
        Provider.call(this, compositor || _.head);
    }

    ServiceProvider.prototype = Object.create(Provider.prototype);

    return ServiceProvider;
});