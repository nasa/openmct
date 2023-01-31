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
            const createAction = new CreateAction(this.openmct, key, this.openmct.router.path[0]);

            createAction.invoke();
        }
    }
};
</script>
