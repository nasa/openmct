define(['lodash'], function (_) {
    'use strict';

    function Plugin(initializer, activator) {
        this.initialize = _.once(initializer || _.noop);
        this.activate = _.once(activator || _.noop);
    }

    return Plugin;
});
