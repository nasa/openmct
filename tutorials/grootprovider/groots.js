define(function () {
    return function grootPlugin(mct) {
        var ROOT_KEY = {
            namespace: 'groot',
            identifier: 'groot'
        };

        var GROOT_ROOT = {
            name: 'I am groot',
            type: 'folder',
            composition: [
                {
                    namespace: 'groot',
                    identifier: 'arms'
                },
                {
                    namespace: 'groot',
                    identifier: 'legs'
                },
                {
                    namespace: 'groot',
                    identifier: 'torso'
                }
            ]
        };

        var GrootProvider = {
            get: function (key) {
                if (key.identifier === 'groot') {
                    return Promise.resolve(GROOT_ROOT);
                }
                return Promise.resolve({
                    name: 'Groot\'s ' + key.identifier
                });
            }
        };

        mct.Objects.addRoot(ROOT_KEY);

        mct.Objects.addProvider('groot', GrootProvider);

        return mct;
    };
});
