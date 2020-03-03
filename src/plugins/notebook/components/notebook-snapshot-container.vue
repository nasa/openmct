<template>
<div>
    <header>
        <h1>Notebook Snapshots</h1>
        <button @click="close">X</button>
    </header>
    <article>
        <div>{{ snapshots }}</div>
    </article>
</div>
</template>

<script>
// import NotebookEmbed from './notebook-embed.vue';

export default {
    inject: ['openmct'],
    components: {
        // NotebookEmbed
    },
    props: {
        destroy: {
            type: Function,
            default() {
                return () => {};
            }
        },
        snapshots: {
            type: Array,
            default() {
                return [];
            }
        }
    },
    mounted() {
        console.log('snapshots', this.snapshots);
    },
    methods: {
        close() {
            console.log('close');
            this.destroy();
        }
    }
}
</script>
