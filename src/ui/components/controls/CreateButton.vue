<template>
    <div class="c-create-button--w">
        <div class="c-create-button c-menu-button c-button--major icon-plus"
             @click="toggleCreateMenu">
            Create
        </div>
        <div class="c-menu"
             v-if="showCreateMenu">
            <ul>
                <li v-for="item in menuItems"
                    :class="item.class">
                    {{ item.name }}
                </li>
            </ul>
        </div>



        <div class="c-create-menu menu super-menu l-create-menu"
             v-if="XshowCreateMenu">
            <div class="w-menu" ng-controller="CreateMenuController">
                <div class="col menu-items">
                    <ul>
                        <li ng-repeat="createAction in createActions" ng-click="createAction.perform()">
                            <a ng-mouseover="representation.activeMetadata = createAction.getMetadata()"
                               ng-mouseleave="representation.activeMetadata = undefined"
                               class="menu-item-a (( createAction.getMetadata().cssClass ))">
                                ((createAction.getMetadata().name))
                            </a>
                        </li>
                    </ul>
                </div>
                <div class="col menu-item-description">
                    <div class="desc-area icon (( representation.activeMetadata.cssClass ))"></div>
                    <div class="w-title-desc">
                        <div class="desc-area title">
                            ((representation.activeMetadata.name))
                        </div>
                        <div class="desc-area description">
                            ((representation.activeMetadata.description))
                        </div>
                    </div>
                </div>
            </div>
        </div>
    </div>
</template>

<style lang="scss">
    @import "~styles/sass-base";
    @import "~styles/controls";

    .c-create-button {
        &--w {
            // Wrapper for Create button and menu
            overflow: visible;
        }

        font-size: 1.1em;
    }

    .c-create-menu {
        z-index: 70;
    }

</style>

<script>
    export default {
        props: {
            showCreateMenu: {
                type: Boolean,
                default: false
            },
        },
        methods: {
            toggleCreateMenu: function () {
                this.showCreateMenu = !this.showCreateMenu;
            },
        },
        data: function() {
            return {
                menuItems: [
                    { name: 'Open In New Tab', class: 'icon-new-window', title: 'Open in a new browser tab' },
                    { name: 'Preview', class: 'hide-in-t-main-view icon-eye-open', title: 'Preview in large dialog' },
                    { name: 'Edit Properties...', class: 'major icon-pencil', title: 'Edit properties of this object.' },
                    { name: 'Duplicate', class: 'icon-duplicate', title: 'Duplicate object to another location.' },
                    { name: 'Create Link', class: 'icon-link', title: 'Create Link to object in another location.' },
                    { name: 'Export as JSON', class: 'icon-export', title: 'Export as JSON' },
                    { name: 'Import from JSON', class: 'icon-import', title: 'Import from JSON' }
                ]
            }
        }
    }
</script>
