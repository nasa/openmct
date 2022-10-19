<template>
<div
    ref="createButton"
    class="c-create-button--w"
>
    <button
        class="c-create-button c-button--menu c-button--major icon-plus"
        @click.prevent.stop="showCreateMenu"
    >
        <span class="c-button__label">Create</span>
    </button>
</div>
</template>

<script>
import CreateAction from '@/plugins/formActions/CreateAction';
import objectUtils from 'objectUtils';

export default {
    inject: ['openmct'],
    data: function () {

        return {
            menuItems: {},
            selectedMenuItem: {},
            opened: false
        };
    },
    computed: {
        sortedItems() {
            let items = this.getItems();

            return items.sort((a, b) => {
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
    methods: {
        getItems() {
            let keys = this.openmct.types.listKeys();

            keys.forEach(key => {
                if (!this.menuItems[key]) {
                    let typeDef = this.openmct.types.get(key).definition;

                    if (typeDef.creatable) {
                        this.menuItems[key] = {
                            cssClass: typeDef.cssClass,
                            name: typeDef.name,
                            description: typeDef.description,
                            onItemClicked: () => this.create(key)
                        };
                    }
                }
            });

            return Object.values(this.menuItems);
        },
        showCreateMenu() {
            const elementBoundingClientRect = this.$refs.createButton.getBoundingClientRect();
            const x = elementBoundingClientRect.x;
            const y = elementBoundingClientRect.y + elementBoundingClientRect.height;

            const menuOptions = {
                menuClass: 'c-create-menu'
            };

            this.openmct.menus.showSuperMenu(x, y, this.sortedItems, menuOptions);
        },
        create(key) {
            // Hack for support.  TODO: rewrite create action.
            // 1. Get contextual object from navigation
            // 2. Get legacy type from legacy api
            // 3. Instantiate create action with type, parent, context
            // 4. perform action.
            return this.openmct.objects.get(this.openmct.router.path[0].identifier)
                .then((currentObject) => {
                    const createAction = new CreateAction(this.openmct, key, currentObject);

                    createAction.invoke();
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
