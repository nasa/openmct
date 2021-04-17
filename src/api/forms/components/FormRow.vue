<template>
<div class="form-row c-form__row validates"
     :class="rowClass"
     @onChange="onChange"
>
    <div class="c-form__row__label label flex-elem"
         :title="row.description"
    >
        {{ row.name }}
    </div>
    <div class="c-form__row__controls controls flex-elem">
        <div v-if="row.control && row.control !== 'locator'"
             class="c-form__controls-wrapper wrapper"
        >
            <component
                :is="getComponent"
                :key="row.key"
                :ref="`form-control-${row.key}`"
                :model="row"
                :value="row.value"
                :required="isRequired"
                @onChange="onChange"
            />
        </div>
    </div>
</div>
</template>

<script>
import AutoCompleteField from "@/api/forms/components/controls/AutoCompleteField.vue";
import Composite from "@/api/forms/components/controls/Composite.vue";
import NumberField from "@/api/forms/components/controls/NumberField.vue";
import SelectField from '@/api/forms/components/controls/SelectField.vue';
import TextField from "@/api/forms/components/controls/TextField.vue";

const CONTROL_TYPE_VIEW_MAP = {
    'autocomplete': AutoCompleteField,
    'composite': Composite,
    'numberfield': NumberField,
    'select': SelectField,
    'textfield': TextField,
};

export default {
    name: 'FormRow',
    components: CONTROL_TYPE_VIEW_MAP,
    props: {
        cssClass: {
            type: String,
            default: '',
            required: true
        },
        first: {
            type: Boolean,
            default: false,
            required: true
        },
        row: {
            type: Object,
            required: true
        }
    },
    data() {
        return {
            valid: true
        };
    },
    computed: {
        getComponent() {
            return CONTROL_TYPE_VIEW_MAP[this.row.control];
        },
        isRequired() {
            //TODO: Check if field is required
            return false;
        },
        rowClass() {
            let cssClass = this.cssClass;

            if (this.first === true) {
                cssClass = `${cssClass} first`;
            }

            if (this.row.required) {
                cssClass = `${cssClass} req`;
            }

            if (this.row.layout === 'controls-first') {
                cssClass = `${cssClass} l-controls-first`;
            }

            if (this.row.layout === 'controls-under') {
                cssClass = `${cssClass} l-controls-under`;
            }

            if (this.valid === true) {
                cssClass = `${cssClass} valid`;
            } else {
                cssClass = `${cssClass} invalid`;
            }

            return cssClass;
        }
    },
    methods: {
        // Check if an element is defined; the map step of isNonEmpty
        isDefined(element) {
            return typeof element !== 'undefined';
        },

        /**
         * Check if an array contains anything other than
         * undefined elements.
         * @param {Array} value the array to check
         * @returns {boolean} true if any non-undefined
         *          element is in the array
         * @memberof platform/forms.CompositeController#
         */
        isNonEmpty(value) {
            return Array.isArray(value) && value.some(this.isDefined);
        },
        onChange(data) {
            this.$emit('onChange', data);
        }
    }
};
</script>
