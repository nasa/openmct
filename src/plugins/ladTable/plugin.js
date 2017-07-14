define([
    './LADTable'
], function (
    LADTable
) {

    function LADTablePlugin() {


        return function install(openmct) {

            openmct.types.addType('view.latest-value-table', {
                name: 'Latest Value Table',
                description: 'A table that shows the latest values of all telemetry points contained within.',
                key: 'view.latest-value-table',
                cssClass: 'icon-tabular-lad',
                creatable: true,
                initialize: function (obj) {
                    obj.composition = [];
                }
            });

            openmct.mainViews.addProvider({
                name: 'Latest Value Table',
                cssClass: 'icon-tabular-lad',
                canView: function (d) {
                    return d.type === 'view.latest-value-table' && 150;
                },
                view: function (domainObject) {

                    var listView = new LADTable({
                        domainObject: domainObject,
                        openmct: openmct
                    });

                    return {
                        show: function (container) {
                            container.appendChild(listView.element);
                        },
                        destroy: function (container) {
                            listView.destroy();
                        }
                    };
                }
            });
        };
    }

    return LADTablePlugin;
});

