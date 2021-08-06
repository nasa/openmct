<template>
<button
    class="c-popup-menu-button c-disclosure-button"
    title="popup menu"
    @click="showMenuItems"
>
</button>
</template>

<script>
import MenuItems from './MenuItems.vue';
import Vue from 'vue';

export default {
    inject: ['openmct'],
    props: {
        domainObject: {
            type: Object,
            default() {
                return {};
            }
        },
        popupMenuItems: {
            type: Array,
            default() {
                return [];
            }
        }
    },
    data() {
        return {
            menuItems: null
        };
    },
    mounted() {
    },
    methods: {
        calculateMenuPosition(event, element) {
            let eventPosX = event.clientX;
            let eventPosY = event.clientY;

            let menuDimensions = element.getBoundingClientRect();
            let overflowX = (eventPosX + menuDimensions.width) - document.body.clientWidth;
            let overflowY = (eventPosY + menuDimensions.height) - document.body.clientHeight;

            if (overflowX > 0) {
                eventPosX = eventPosX - overflowX;
            }

            if (overflowY > 0) {
                eventPosY = eventPosY - overflowY;
            }

            return {
                x: eventPosX,
                y: eventPosY
            };
        },
        hideMenuItems() {
            document.body.removeChild(this.menuItems.$el);
            this.menuItems.$destroy();
            this.menuItems = null;
            document.removeEventListener('click', this.hideMenuItems);

            return;
        },
        showMenuItems($event) {
            const menuItems = new Vue({
                components: {
                    MenuItems
                },
                provide: {
                    popupMenuItems: this.popupMenuItems
                },
                template: '<MenuItems />'
            });
            this.menuItems = menuItems;

            menuItems.$mount();
            const element = this.menuItems.$el;
            document.body.appendChild(element);

            const position = this.calculateMenuPosition($event, element);
            element.style.left = `${position.x}px`;
            element.style.top = `${position.y}px`;

            setTimeout(() => {
                document.addEventListener('click', this.hideMenuItems);
            }, 0);
        }
    }
};
</script>
