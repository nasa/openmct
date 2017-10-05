
'use strict';

define([

], function (

) {
    var DSN_KEY = 'dsn',
        DSN_NAMESPACE = 'deep.space.network';

    function DsnPlugin() {
        return function install(openmct) {
            openmct.objects.addRoot({
                namespace: DSN_NAMESPACE,
                key: DSN_KEY
            });
        };
    }

    return DsnPlugin;
});
