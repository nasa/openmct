<template>
    <label class="c-toggle-switch">
        <input type="checkbox"
                :id="id"
                :checked="checked"
                @change="onUserSelect($event)"/>
        <span class="c-toggle-switch__slider"></span>
    </label>
</template>

<style lang="scss">
    .c-toggle-switch {
        $d: 12px;
        $m: 2px;
        $br: $d/1.5;
        cursor: pointer;
        overflow: hidden;
        display: inline;
        vertical-align: middle;

        &__slider {
            background: $colorBtnBg; // TODO: make discrete theme constants for these colors
            border-radius: $br;
            //box-shadow: inset rgba($colorBtnFg, 0.4) 0 0 0 1px;
            display: inline-block;
            height: $d + ($m*2);
            position: relative;
            transform: translateY(2px); // TODO: get this to work without this kind of hack!
            width: $d*2 + $m*2;

            &:before {
                // Knob
                background: $colorBtnFg; // TODO: make discrete theme constants for these colors
                border-radius: floor($br * 0.8);
                box-shadow: rgba(black, 0.4) 0 0 2px;
                content: '';
                display: block;
                position: absolute;
                height: $d; width: $d;
                top: $m; left: $m; right: auto;
                transition: transform 100ms ease-in-out;
            }
        }

        input {
            opacity: 0;
            width: 0;
            height: 0;

            &:checked {
                + .c-toggle-switch__slider {
                    background: $colorKey; // TODO: make discrete theme constants for these colors
                    &:before {
                        transform: translateX(100%);
                    }
                }
            }
        }
    }

</style>

<script>
    export default {
        inject: ['openmct'],
        props: {
            id: String,
            checked: Boolean
        },
        methods: {
            onUserSelect(event) {
                this.$emit('change', event.target.checked);
            }
        }
    }
</script>