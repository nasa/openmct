<template>
    <div class="c-overlay">

        <!-- DEPRECATED, DO NOT USE! USE OverlayComponent.vue instead -->

        <div class="c-overlay__blocker"
             v-on:click="destroy">
        </div>
        <div class="c-overlay__outer">
            <button class="c-click-icon c-overlay__close-button icon-x-in-circle"
                v-on:click="destroy">
            </button>
            <div class="c-overlay__contents" ref="element"></div>
            <div class="c-overlay__button-bar" v-if="!buttons">
                <button class="c-button c-button--major"
                        v-on:click="destroy">
                    Done
                </button>
            </div>
            <div class="c-overlay__button-bar" v-if="buttons">
                <button class="c-button c-button--major"
                        v-for="(button, index) in buttons"
                        :key="index"
                        @click="buttonClickHandler(button.callback)">
                    {{button.label}}
                </button>
            </div>
        </div>
    </div>
</template>

<script>
    export default {
        inject: ['destroy', 'element', 'buttons'],
        mounted() {
            this.$refs.element.appendChild(this.element);
        },
        methods: {
            buttonClickHandler: function (method) {
                method();
                this.destroy();
            }
        }
    }
</script>
