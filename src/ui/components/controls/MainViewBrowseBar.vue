<template>
    <div class="l-browse-bar">
        <div class="l-browse-bar__start">
            <a class="l-browse-bar__nav-to-parent-button c-icon-button icon-pointer-left"></a>
            <div v-bind:class="['l-browse-bar__object-name--w', type.cssClass]">
                <span 
                    class="l-browse-bar__object-name c-input-inline"
                    v-on:blur="updateName" 
                    contenteditable>
                    {{ domainObject.name }}
                </span>
            </div>
            <div class="l-browse-bar__context-actions c-disclosure-button"></div>
        </div>

        <div class="l-browse-bar__end">
            <div class="l-browse-bar__view-switcher c-menu-button--w c-menu-button--menus-left"
                 v-if="domainObjectViews.length > 1">
                <div v-bind:class="['c-menu-button', currentView.cssClass]"
                     title="Switch view type"
                     @click="toggleViewMenu">
                    <span class="c-button__label">{{ currentView.name }}</span>
                </div>
                <div class="c-menu" v-if="showViewMenu">
                    <ul>
                        <li v-for="(view,index) in domainObjectViews"
                            @click="updateViewParams(view)"
                            :key="index"
                            :class="view.cssClass"
                            :title="view.title">
                            {{ view.name }}
                        </li>
                    </ul>
                </div>
            </div>
            <!-- Action buttons -->
            <div class="l-browse-bar__actions">
                <div class="l-browse-bar__action c-button icon-eye-open" title="Preview"></div>
                <div class="l-browse-bar__action c-button icon-notebook" title="New Notebook entry"></div>
                <div class="l-browse-bar__action c-button c-button--major icon-pencil" title="Edit"></div>
            </div>
        </div>
    </div>
</template>

<script>
    import MenuPlaceholder from '../controls/ContextMenu.vue';

    export default {
        inject: ['openmct'],
        props: {
            editNameEnabled: {
                type: Boolean,
                default: false
            }
        },
        methods: {
            toggleViewMenu: function (event) {
                event.stopPropagation();
                this.showViewMenu = !this.showViewMenu;
            },
            updateName: function (event) {
                if (event.target.innerText !== this.domainObject.name) {
                    this.openmct.objects.mutate(this.domainObject, 'name', event.target.innerText);
                }
            },
            updateViewParams: function (view) {
                this.openmct.router.updateParams({view: view.key});
            },
            updateCurrentView: function (viewKey) {
                viewKey = viewKey || this.openmct.router.getParams().view;
                
                if (viewKey) {
                    this.currentView = this.domainObjectViews.find((view) => view.key === viewKey) || {};
                }
            }
        },
        data: function () {
            return {
                showViewMenu: false,
                domainObject: {},
                domainObjectViews: [],
                currentView: {}
            }
        },
        components: {
            MenuPlaceholder
        },
        computed: {
            type() {
                return this.openmct.types.get(this.domainObject.type).definition;
            }
        },
        mounted: function () {
            this.$root.$on('main-view-domain-object', (domainObject) => {
                this.legacyObject = domainObject;
                this.domainObject = domainObject.useCapability('adapter');
                this.domainObjectViews = domainObject.useCapability('view');

                this.updateCurrentView();
            });

            document.addEventListener('click', () => {
                if (this.showViewMenu) {
                    this.showViewMenu = false;
                }
            });

            this.openmct.router.on('change:params', (params) => {this.updateCurrentView(params.view)});
        }
    }
</script>

<style lang="scss">
    @import "~styles/sass-base";

    /******************************* START */

    .l-browse-bar {
        display: flex;
        align-items: center;
        justify-content: space-between;

        [class*="__"] {
            // Removes extraneous horizontal white space
            display: inline-flex;
        }

        &__start {
            display: flex;
            align-items: center;
            flex: 1 1 auto;
            font-size: 1.4em;
            margin-right: $interiorMargin;
            min-width: 0; // Forces interior to compress when pushed on
        }

        &__end {
            display: flex;
            align-items: center;
            flex: 0 0 auto;

            [class*="__"] + [class*="__"] {
                margin-left: $interiorMarginSm;
            }
        }

        &__nav-to-parent-button,
        &__disclosure-button {
            flex: 0 0 auto;
        }

        &__nav-to-parent-button {
            // This is an icon-button
            $p: $interiorMarginLg;
            margin-right: $interiorMargin;
            padding-left: $p;
            padding-right: $p;
        }

        &__object-name--w {
            align-items: center;
            display: flex;
            flex: 0 1 auto;
            min-width: 0;

            &:before {
                // Icon
                opacity: 0.5;
                margin-right: $interiorMargin;
            }
        }

        &__object-name {
            flex: 0 1 auto;
        }
    }
</style>
