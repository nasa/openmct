<template>
    <div class="c-custom-checkbox">
        <label>
            <input type="checkbox"
                   :name="options.name"
                   :checked="options.value"
                   :disabled="options.disabled"
                   @change="onChange">

            <div class="c-custom-checkbox__box"></div>
            <div class="c-custom-checkbox__label-text">
                {{options.name}}
            </div>
        </label>
    </div>
</template>

<script>
export default {
    props: {
        options: Object
    },
    methods: {
        onChange(event) {
            console.log('changed!', event);
            this.$emit('change', event.target.checked, {...this.options});
        }
    }
}
</script>
