<template>
<div class="c-create-button--w">
    <button
        class="c-create-button c-button--menu c-button--major icon-plus"
        @click="open"
    >
        <span class="c-button__label">Create</span>
    </button>
    <div
        v-if="opened"
        class="c-create-menu c-super-menu"
    >
        <div class="c-super-menu__menu">
            <ul>
                <li
                    v-for="(item, index) in sortedItems"
                    :key="index"
                    :class="item.class"
                    :aria-label="item.name"
                    role="button"
                    tabindex="0"
                    @mouseover="showItemDescription(item)"
                    @click="create(item)"
                >
                    {{ item.name }}
                </li>
            </ul>
        </div>
        <div class="c-super-menu__item-description">
            <div :class="['l-item-description__icon', 'bg-' + selectedMenuItem.class]"></div>
            <div class="l-item-description__name">
                {{ selectedMenuItem.name }}
            </div>
            <div class="l-item-description__description">
                {{ selectedMenuItem.title }}
            </div>
        </div>
    </div>
</div>
</template>

<script>
import CreateAction from '../../../platform/commonUI/edit/src/creation/CreateAction';
import objectUtils from 'objectUtils';

export default {
    inject: ['openmct'],
    data: function () {
        let items = [];

        this.openmct.types.listKeys().forEach(key => {
            let menuItem = this.openmct.types.get(key).definition;

            if (menuItem.creatable) {
                let menuItemTemplate = {
                    key: key,
                    name: menuItem.name,
                    class: menuItem.cssClass,
                    title: menuItem.description
                };

                items.push(menuItemTemplate);
            }
        });

        return {
            items: items,
            selectedMenuItem: {},
            opened: false
        };
    },
    computed: {
        sortedItems() {
            return this.items.slice().sort((a, b) => {
                if (a.name < b.name) {
                    return -1;
                } else if (a.name > b.name) {
                    return 1;
                } else {
                    return 0;
                }
            });
        }
    },
    destroyed() {
        document.removeEventListener('click', this.close);
    },
    methods: {
        open: function () {
            if (this.opened) {
                return;
            }

            this.opened = true;
            setTimeout(() => document.addEventListener('click', this.close));
        },
        close: function () {
            if (!this.opened) {
                return;
            }

            this.opened = false;
            document.removeEventListener('click', this.close);
        },
        showItemDescription: function (menuItem) {
            this.selectedMenuItem = menuItem;
        },
        create: function (item) {
            // Hack for support.  TODO: rewrite create action.
            // 1. Get contextual object from navigation
            // 2. Get legacy type from legacy api
            // 3. Instantiate create action with type, parent, context
            // 4. perform action.
            return this.openmct.objects.get(this.openmct.router.path[0].identifier)
                .then((currentObject) => {
                    let legacyContextualParent = this.convertToLegacy(currentObject);
                    let legacyType = this.openmct.$injector.get('typeService').getType(item.key);
                    let context = {
                        key: "create",
                        domainObject: legacyContextualParent // should be same as parent object.
                    };
                    let action = new CreateAction(
                        legacyType,
                        legacyContextualParent,
                        context,
                        this.openmct
                    );

                    return action.perform();
                });
        },
        convertToLegacy(domainObject) {
            let keyString = objectUtils.makeKeyString(domainObject.identifier);
            let oldModel = objectUtils.toOldFormat(domainObject);

            return this.openmct.$injector.get('instantiate')(oldModel, keyString);
        }
    }
};
</script>
