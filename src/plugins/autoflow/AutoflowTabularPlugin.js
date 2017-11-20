define([
    './AutoflowTabularView'
], function (
    AutoflowTabularView
) {
    return function (options) {
        return function (openmct) {
            var views = (openmct.mainViews || openmct.objectViews);

            views.addProvider({
                name: "Autoflow Tabular",
                key: "autoflow",
                cssClass: "icon-packet",
                description: "A tabular view of packet contents.",
                canView: function (d) {
                    return !options || (options.type === d.type);
                },
                view: function (domainObject) {
                    return new AutoflowTabularView(
                        domainObject,
                        openmct,
                        document
                    );
                }
            });
        };
    };
});

