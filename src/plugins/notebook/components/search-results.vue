<template>
<div>
    <header>Search Reults</header>
    <div v-for="(result, index) in results"
         :key="index"
    >
        <Result :result="result" />
    </div>
</div>
</template>

<script>
import Result from './result.vue';

export default {
    inject: ['openmct', 'domainObject'],
    components: {
        Result
    },
    props:{
        results: {
            type: Array,
            default() {
                return [];
            }
        }
    },
    data() {
        return {}
    },
    watch: {
        results(newResults) {}
    },
    mounted() {
    }
}
</script>
