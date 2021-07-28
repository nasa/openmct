<template>
<div class="form-row c-form__row"
     :class="[{ 'first': first }]"
     @onChange="onChange"
>
    <div v-if="row.name"
         class="c-form-row__label"
         :title="row.description"
    >
        {{ row.name }}
    </div>
    <div class="c-form-row__state-indicator"
         :class="rowClass"
    >
    </div>
    <div v-if="row.control"
         class="c-form-row__controls"
    >
        <component
            :is="getComponent"
            :key="row.key"
            :ref="`form-control-${row.key}`"
            :model="row"
            @onChange="onChange"
        />
    </div>
</div>
</template>

<script>
import AutoCompleteField from "@/api/forms/components/controls/AutoCompleteField.vue";
import ClockDisplayFormatField from "@/api/forms/components/controls/ClockDisplayFormatField.vue";
import Datetime from "@/api/forms/components/controls/Datetime.vue";
import FileInput from "@/api/forms/components/controls/FileInput.vue";
import Locator from "@/api/forms/components/controls/Locator.vue";
import NumberField from "@/api/forms/components/controls/NumberField.vue";
import SelectField from '@/api/forms/components/controls/SelectField.vue';
import TextAreaField from "@/api/forms/components/controls/TextAreaField.vue";
import TextField from "@/api/forms/components/controls/TextField.vue";

const CONTROL_TYPE_VIEW_MAP = {
    'autocomplete': AutoCompleteField,
    'composite': ClockDisplayFormatField,
    'datetime': Datetime,
    'file-input': FileInput,
    'locator': Locator,
    'numberfield': NumberField,
    'select': SelectField,
    'textarea': TextAreaField,
    'textfield': TextField
};

export default {
    name: 'FormRow',
    components: {
        AutoCompleteField,
        ClockDisplayFormatField,
        Datetime,
        FileInput,
        Locator,
        NumberField,
        SelectField,
        TextAreaField,
        TextField
    },
    inject: ['openmct', 'domainObject'],
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
            valid: undefined,
            visited: false
        };
    },
    computed: {
        getComponent() {
            return CONTROL_TYPE_VIEW_MAP[this.row.control];
        },
        rowClass() {
            let cssClass = this.cssClass;

            if (this.row.required) {
                cssClass = `${cssClass} req`;
            }

            if (this.visited && this.valid !== undefined) {
                if (this.valid === true) {
                    cssClass = `${cssClass} valid`;
                } else {
                    cssClass = `${cssClass} invalid`;
                }
            }

            return cssClass;
        }
    },
    mounted() {
        if (this.row.required) {
            const data = {
                model: this.row,
                value: this.row.value
            };

            this.onChange(data, false);
        }
    },
    methods: {
        onChange(data, visited = true) {
            this.visited = visited;

            const valid = this.validateRow(data);
            this.valid = valid;
            data.invalid = !valid;

            this.$emit('onChange', data);
        },
        validateRow(data) {
            let valid = true;
            if (this.row.required) {
                valid = data.value !== undefined && data.value !== null && data.value !== '';
            }

            const pattern = data.model.pattern;
            if (valid && pattern) {
                const regex = new RegExp(pattern);
                valid = regex.test(data.value);
            }

            const validate = data.model.validate;
            if (valid && validate) {
                valid = validate(this.domainObject, data);
            }

            return Boolean(valid);
        }
    }
};
</script>
