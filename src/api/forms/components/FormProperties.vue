<template>
<form name="mctForm"
      novalidate
      class="form c-form"
      autocomplete="off"
>
    <div class="c-overlay__top-bar">
        <div class="c-overlay__dialog-title">{{model.title}}</div>
        <div class="c-overlay__dialog-hint hint">All fields marked <span class="req icon-asterisk"></span> are required.</div>
    </div>
    <span v-for="section in model.sections"
          :key="section.name"
          class="l-form-section c-form__section"
          :class="section.cssClass"
    >
        <h2 class="c-form__header"
            ng-if="section.name"
        >
            {{ section.name }}
        </h2>
        <div v-for="(row, index) in section.rows"
             :key="row.name"
        >
            <FormRow :css-class="section.cssClass"
                      :first="index < 1"
                      :row="row"
                      @onChange="onChange"
            />
        </div>
    </span>
</form>
</template>

<script>
import FormRow from "@/api/forms/components/FormRow.vue";
export default {
    components: {
        FormRow
    },
    props: {
        model: {
            type: Object,
            required: true
        },
        value: {
            type: Object,
            required: false,
            default() {
                return {};
            }
        }
    },
    methods: {
        onChange(data) {
            this.$emit('onChange', data);
        }
    }
};
</script>
