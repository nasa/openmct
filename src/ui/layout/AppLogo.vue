<template>
    <div class="l-shell__app-logo"></div>
</template>
<style lang="scss">
</style>
<script>
const ABOUT_LOGO_TEMPLATE = `<mct-include key="'about-logo'"></mct-include>`;

function getAppLogo(openmct) {
    let $compile = openmct.$injector.get('$compile');
    let $rootScope = openmct.$injector.get('$rootScope');
    let $scope = $rootScope.$new(true);
    return $compile(ABOUT_LOGO_TEMPLATE)($scope)[0];
}
export default {
    inject: ['openmct'],
    mounted () {
        this.$el.appendChild(getAppLogo(openmct));
    }
}
</script>