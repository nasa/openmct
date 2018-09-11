<template>
    <div class="l-main-view-browse-bar">
        <a class="l-bar__nav-to-parent-button c-icon-button icon-pointer-left"></a>
        <div class="l-bar__object-name--w icon-folder">
            <span class="l-bar__object-name u-input-inline">Object Name</span>
        </div>
        <div class="l-bar__context-available"></div>


        <div class="l-bar__view-switcher c-menu-button--w">
            <div class="c-menu-button icon-thumbs-strip">
                Grid
            </div>
            <MenuPlaceholder v-if="showMenu"></MenuPlaceholder>
        </div>


    </div>
</template>

<script>
    import MenuPlaceholder from '../controls/CreateButton.vue';

    export default {
        components: {
            MenuPlaceholder
        }
    }
</script>

<style scoped>

</style>