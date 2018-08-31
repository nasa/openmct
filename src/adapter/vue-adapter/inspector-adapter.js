define([

], function (

) {

    class InspectorAdapter {
        constructor(layout, openmct) {
            console.log('installing inspector adapter');

            this.openmct = openmct;
            this.layout = layout;
            this.$injector = openmct.$injector;
            this.angular = openmct.$angular;

            this.objectService = this.$injector.get('objectService');
            this.templateLinker = this.$injector.get('templateLinker');
            this.$timeout = this.$injector.get('$timeout');

            this.templateMap = {};
            this.$injector.get('templates[]').forEach((t) => {
                this.templateMap[t.key] = this.templateMap[t.key] || t;
            });

            var $rootScope = this.$injector.get('$rootScope');
            this.scope = $rootScope.$new();

            this.templateLinker.link(
                this.scope,
                angular.element(layout.$refs.inspector.$refs.properties),
                this.templateMap["inspectorRegion"]
            );
            this.$timeout(function () {
                //hello!
            });
        }
    }

    return InspectorAdapter;

});
