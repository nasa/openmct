<template>
<div
    class="c-menu"
    :class="[options.menuClass, 'c-super-menu']"
>
    <ul
        v-if="options.actions.length && options.actions[0].length"
        role="menu"
        class="c-super-menu__menu"
    >
        <template
            v-for="(actionGroups, index) in options.actions"
        >
            <div
                :key="index"
                role="group"
            >
                <li
                    v-for="action in actionGroups"
                    :key="action.name"
                    role="menuitem"
                    :class="[action.cssClass, action.isDisabled ? 'disabled' : '']"
                    :title="action.description"
                    :data-testid="action.testId || false"
                    @click="action.onItemClicked"
                    @mouseover="toggleItemDescription(action)"
                    @mouseleave="toggleItemDescription()"
                >
                    {{ action.name }}
                </li>
                <div
                    v-if="index !== options.actions.length - 1"
                    :key="index"
                    role="separator"
                    class="c-menu__section-separator"
                >
                </div>
                <li
                    v-if="actionGroups.length === 0"
                    :key="index"
                >
                    No actions defined.
                </li>
            </div></template>
    </ul>

    <ul
        v-else
        class="c-super-menu__menu"
        role="menu"
    >
        <li
            v-for="action in options.actions"
            :key="action.name"
            role="menuitem"
            :class="action.cssClass"
            :title="action.description"
            :data-testid="action.testId || false"
            @click="action.onItemClicked"
            @mouseover="toggleItemDescription(action)"
            @mouseleave="toggleItemDescription()"
        >
            {{ action.name }}
        </li>
        <li v-if="options.actions.length === 0">
            No actions defined.
        </li>
    </ul>

    <div class="c-super-menu__item-description">
        <div :class="['l-item-description__icon', 'bg-' + hoveredItem.cssClass]"></div>
        <div class="l-item-description__name">
            {{ hoveredItem.name }}
        </div>
        <div class="l-item-description__description">
            {{ hoveredItem.description }}
        </div>
    </div>
</div>
</template>

<script>
export default {
    inject: ['options'],
    data: function () {
        return {
            hoveredItem: {}
        };
    },
    methods: {
        toggleItemDescription(action = {}) {
            const hoveredItem = {
                name: action.name,
                description: action.description,
                cssClass: action.cssClass
            };

            this.hoveredItem = Object.assign({}, this.hoveredItem, hoveredItem);
        }
    }
};
</script>
