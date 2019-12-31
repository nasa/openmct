<template>
<section v-show="isEditing"
         id="test-data"
         class="test-data"
>
    <div class="c-cs__ui__header">
        <span class="c-cs__ui__header-label">Test Data</span>
        <span
            class="is-enabled flex-elem"
            :class="['c-cs__disclosure-triangle', { 'c-cs__disclosure-triangle--expanded': expanded }]"
            @click="expanded = !expanded"
        ></span>
    </div>
    <div v-if="expanded"
         class="c-cs__ui_content"
    >
        <label class="checkbox custom">
            <input type="checkbox"
                   class="t-test-data-checkbox"
            >
            <span>Apply Test Data</span>
        </label>
        <div class="t-test-data-config">
            <div class="c-cs-editui__conditions widget-condition">
                <label>
                    <span>Set</span>
                    <select>
                        <option>- Select Input -</option>
                    </select>
                </label>
            </div>
            <div class="c-cs-editui__conditions widget-condition">
                <label>
                    <span>Set</span>
                    <select>
                        <option>- Select Input -</option>
                    </select>
                </label>
            </div>
        </div>
    </div>
</section>
</template>

<script>
export default {
    inject: ['openmct'],
    props: {
        isEditing: Boolean
    },
    data() {
        return {
            expanded: true
        };
    },
    methods: {

    }
}
</script>
