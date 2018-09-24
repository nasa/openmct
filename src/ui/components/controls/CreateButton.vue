<template>
    <div class="c-create-button--w">
        <div class="c-create-button c-menu-button c-button--major icon-plus"
             @click="toggleCreateMenu">
            <span class="c-button__label">Create</span>
        </div>
        <div class="c-create-menu c-super-menu"
             v-if="showCreateMenu">
            <div class="c-super-menu__menu">
                <ul>
                    <li v-for="(item, index) in items"
                        :key="index"
                        :class="item.class"
                        :title="item.title"
                        @mouseover="showItemDescription(item)">
                        {{ item.name }}
                    </li>
                </ul>
            </div>
            <div class="c-super-menu__item-description">
                <div :class="['l-item-description__icon', 'bg-' + selectedMenuItem.class]"></div>
                <div class="l-item-description__name">{{selectedMenuItem.name}}</div>
                <div class="l-item-description__description">{{selectedMenuItem.title}}</div>
            </div>
        </div>
    </div>
</template>

<style lang="scss">
    @import "~styles/sass-base";

    .c-create-button,
    .c-create-menu {
        &--w {
            // Wrapper for Create button and menu
            overflow: visible;
        }

        font-size: 1.1em;
    }

    .c-create-button .c-button__label {
        text-transform: $createBtnTextTransform;
    }

    .c-create-menu {
        max-height: 80vh;
        max-width: 500px;
        min-height: 250px;
        z-index: 70;

        [class*="__icon"] {
            filter: $colorKeyFilter;
        }

        [class*="__item-description"] {
            min-width: 200px;
        }
    }
</style>

<script>
    export default {
        inject: ['openmct'],
        props: {
            showCreateMenu: {
                type: Boolean,
                default: false
            }
        },
        methods: {
            toggleCreateMenu: function () {
                this.showCreateMenu = !this.showCreateMenu;
            },
            showItemDescription: function (menuItem) {
                this.selectedMenuItem = menuItem;
            }
        },
        data: function() {
            let items = [];

            this.openmct.types.listKeys().forEach(key => {
                let menuItem = openmct.types.get(key).definition;

                if (menuItem.creatable) {
                    let menuItemTemplate = {
                        name: menuItem.name,
                        class: menuItem.cssClass,
                        title: menuItem.description
                    };

                    items.push(menuItemTemplate);
                }
            });

            return {
                items: items,
                selectedMenuItem: {}
            }
        }
    }
</script>
