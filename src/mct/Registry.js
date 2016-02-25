define(['./Provider', 'lodash'], function (Provider, _) {
    function Registry() {
        Provider.call(this, _.identity);
    }

    Registry.prototype = Object.create(Provider.prototype);

    return Registry;
});
