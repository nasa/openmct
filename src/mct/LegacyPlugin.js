define(['./Plugin'], function (Plugin) {
    function LegacyPlugin(
        bundleDefinition,
        registryLocator,
        serviceLocator
    ) {
        function resolve(extension) {
            var depends = extension.depends || [],
                dependencies = depends.map(function (name) {
                    return serviceLocator.locate(name);
                });
            return extension.implementation ?
                _.spread(_.partial)(
                    [extension.implementation].concat(dependencies)
                ) : extension;
        }

        function initializer() {
            var extensions = bundleDefinition.extensions || {};

            Object.keys(extensions).forEach(function (category) {
                var registry = registryLocator.locate(category);

                function register(extension) {
                    registry.register(function () {
                        return resolve(extension);
                    }, { priority: extension.priority });
                }

                extensions[category].forEach(extension);
            });
        }

        Plugin.call(this, initializer);
    }

    return LegacyPlugin;
});
