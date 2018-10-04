<template>
    <div class="c-togglebutton">
        <input type="checkbox"
               :id="id"
               :name="name"
               :value="value"
               :required="required"
               :disabled="disabled"
               @change="onChange"
               :checked="state">
        <label :for="id">
            <div class="c-togglebutton__on"
                :class="innerClassOn"></div>
            <div class="c-togglebutton__off"
                :class="innerClassOff"></div>
        </label>
    </div>
    
</template>

<style lang="scss">
    @import "~styles/sass-base";

    .c-togglebutton {
        $d: 14px;
        display: flex;
        align-items: center;

        label {
            display: flex;
            align-items: center;
            justify-content: center;

            .c-togglebutton__on {
                display: none;
            }
        }

        input {
            opacity: 0;
            position: absolute;

            &:checked + label {
                .c-togglebutton__on {
                    display: block;
                }
                .c-togglebutton__off {
                    display: none;
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
    Toggle button control, based on checkboxCustom. Use just like a checkbox in HTML.
    Requires inner-class-on and -off attributes to be passed.
    Supports checked and disabled attributes.
    Example usage:
    <toggle-button checked
                    class="c-click-icon"
                    inner-class-on="icon-grid-snap-to"
                    inner-class-off="icon-grid-snap-no"></toggle-button>
     */
    export default {
        model: {
            prop: 'modelValue',
            event: 'input'
        },

        props: {
            innerClassOn: {
                type: String,
                default: null,
                required: true
            },
            innerClassOff: {
                type: String,
                default: null,
                required: true
            },
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
            },
            stateClass() {
                return this.onClass;
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