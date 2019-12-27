<template>
<section id="current-output"
         class="current-output"
>
    <div class="c-sw-edit__ui__header">
        <span class="c-sw-edit__ui__header-label">Current Output</span>
    </div>
    <div class="t-test-data-config">
        <span>{{ conditionData.currentOutput }}</span>
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
            conditionData: {
                currentOutput: 'DATA_PRESENT'
            }
        };
    },
    methods: {
    }
}
</script>
