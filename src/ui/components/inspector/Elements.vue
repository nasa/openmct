<template>
<div></div>
</template>

<script>
export default {
    inject: ['openmct'],
    mounted() {
        let openmct = this.openmct;
        let $injector = openmct.$injector;
        let angular = openmct.$angular;

        let templateLinker = $injector.get('templateLinker');

        let templateMap = {};
        $injector.get('templates[]').forEach((t) => {
            templateMap[t.key] = templateMap[t.key] || t;
        });

        let $rootScope = $injector.get('$rootScope');
        this.$scope = $rootScope.$new();

        templateLinker.link(
            this.$scope,
            angular.element(this.$el),
            templateMap.elementsPool
        );
    },
    destroyed() {
        this.$scope.$destroy();
    }
}
</script>
