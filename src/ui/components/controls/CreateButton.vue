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
                    <li v-for="item in createMenuItems"
                        :class="item.class"
                        :title="item.title"
                        @mouseover="showItemDescription">
                        {{ item.name }}
                    </li>
                </ul>
            </div>
            <div class="c-super-menu__item-description">
                <div class="l-item-description__icon bg-icon-plot-stacked"></div>
                <div class="l-item-description__name">Name</div>
                <div class="l-item-description__description">
                    A timer that counts up or down to a datetime.
                    Timers can be started, stopped and reset whenever needed,
                    and support a variety of display formats.
                    Each Timer displays the same value to all users.
                    Timers can be added to Display Layouts.</div>
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
        },
        data: function() {
            return {
                createMenuItems: [
                    { name: 'Folder', class: 'icon-folder', title: 'Details will go here' },
                    { name: 'Display Layout', class: 'icon-layout', title: 'Details will go here' },
                    { name: 'Fixed Position Display', class: 'icon-box-with-dashed-lines', title: 'Details will go here' },
                    { name: 'Overlay Plot', class: 'icon-plot-overlay', title: 'Details will go here' },
                    { name: 'Stacked Plot', class: 'icon-plot-stacked', title: 'Details will go here' },
                    { name: 'Telemetry Table', class: 'icon-tabular-realtime', title: 'Details will go here' },
                    { name: 'Clock', class: 'icon-clock', title: 'Details will go here' },
                    { name: 'Timer', class: 'icon-timer', title: 'Details will go here' },
                    { name: 'Web Page', class: 'icon-page', title: 'Details will go here' },
                    { name: 'Event Message Generator', class: 'icon-folder-new', title: 'Details will go here' },
                    { name: 'Hyperlink', class: 'icon-chain-links', title: 'Details will go here' },
                    { name: 'Notebook', class: 'icon-notebook', title: 'Details will go here' },
                    { name: 'State Generator', class: 'icon-telemetry', title: 'Details will go here' },
                    { name: 'Sine Wave Generator', class: 'icon-telemetry', title: 'Details will go here' },
                    { name: 'Example Imagery', class: 'icon-image', title: 'Details will go here' },
                    { name: 'Summary Widget', class: 'icon-summary-widget', title: 'Details will go here' }
                ]
            }
        }
    }
</script>
