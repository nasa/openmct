<template>
    <div class="c-custom-checkbox">
        <input type="checkbox"
               :id="id"
               :name="name"
               :value="value"
               :required="required"
               :disabled="disabled"
               @change="onChange"
               :checked="state">
        <label :for="id">
            <div class="c-custom-checkbox__box"></div>
            <div class="c-custom-checkbox__label-text">
                <slot></slot>
            </div>
        </label>
    </div>
</template>

<style lang="scss">
    @import "~styles/sass-base";

    .c-custom-checkbox {
        $d: 14px;
        display: flex;
        align-items: center;

        label {
            @include userSelectNone();
            display: flex;
            align-items: center;
        }

        &__box {
            @include nice-input();
            display: flex;
            align-items: center;
            justify-content: center;
            line-height: $d;
            width: $d;
            height: $d;
            margin-right: $interiorMarginSm;
        }

        input {
            opacity: 0;
            position: absolute;

            &:checked + label > .c-custom-checkbox__box {
                background: $colorKey;
                &:before {
                    color: $colorKeyFg;
                    content: $glyph-icon-check;
                    font-family: symbolsfont;
                    font-size: 0.6em;
                }
            }

            &:not(:disabled) + label {
                cursor: pointer;
            }

            &:disabled + label {
                opacity: 0.5;
            }
        }
    }
</style>

<script>
    /*
    Custom checkbox control. Use just like a checkbox in HTML, except label string is passed within tag.
    Supports value, true-value, false-value, checked and disabled attributes.
    Example usage:
    <checkbox checked>Enable markers</checkbox>
     */
    export default {
        model: {
            prop: 'modelValue',
            event: 'input'
        },

        props: {
            id: {
                type: String,
                default: function () {
                    return 'checkbox-id-' + this._uid;
                },
            },
            name: {
                type: String,
                default: null,
            },
            value: {
                default: null,
            },
            modelValue: {
                default: undefined,
            },
            checked: {
                type: Boolean,
                default: false,
            },
            required: {
                type: Boolean,
                default: false,
            },
            disabled: {
                type: Boolean,
                default: false,
            },
            model: {}
        },

        computed: {
            state() {
                if (this.modelValue === undefined) {
                    return this.checked;
                }

                if (Array.isArray(this.modelValue)) {
                    return this.modelValue.indexOf(this.value) > -1;
                }

                return !!this.modelValue;
            }
        },

        methods: {
            onChange() {
                this.toggle();
            },

            toggle() {
                let value;

                if (Array.isArray(this.modelValue)) {
                    value = this.modelValue.slice(0);

                    if (this.state) {
                        value.splice(value.indexOf(this.value), 1);
                    } else {
                        value.push(this.value);
                    }
                } else {
                    value = !this.state;
                }

                this.$emit('input', value);
            }
        },

        watch: {
            checked(newValue) {
                if (newValue !== this.state) {
                    this.toggle();
                }
            }
        },

        mounted() {
            if (this.checked && !this.state) {
                this.toggle();
            }
        },
    };
</script>

