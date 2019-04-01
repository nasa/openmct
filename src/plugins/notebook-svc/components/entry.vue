<template>
        <li class="c-notebook__entry c-ne has-local-controls"
            @dragover.prevent
            @drop="onTreeItemDrop">
            <div class="c-ne__time-and-content">
                <div class="c-ne__time">
                    <span>{{formatTime(entry.createdOn, 'YYYY-MM-DD')}}</span>
                    <span>{{formatTime(entry.createdOn, 'HH:mm:ss')}}</span>
                </div>
                <div class="c-ne__content">
                    <div class="c-ne__text c-input-inline"
                        contenteditable="true"
                        ref="contenteditable"
                        @blur="updateEntry"
                        v-html="entry.text">
                    </div>
                    <div class="c-ne__embeds">
                        <notebook-embed
                            v-for="embed in entry.embeds"
                            :key="embed.id"
                            :embed="embed"
                            :objectPath="embed.objectPath">
                        </notebook-embed>
                    </div>
                </div>
            </div>

            <div class="c-ne__local-controls--hidden">
                <button class="c-click-icon c-click-icon--major icon-trash"
                    title="Delete this entry"
                    @click="deleteEntry">
                </button>
            </div>
        </li>
</template>

<script>
import NotebookEmbed from './embed.vue';

export default {
    inject: ['openmct', 'formatTime'],
    props: ['entry'],
    components: {
        NotebookEmbed
    },
    methods: {
        updateEntry(event) {
            this.$emit('update-entry', this.entry.id, event.target.innerText);
        },
        deleteEntry() {
            this.$emit('delete-entry', this.entry.id);
        },
        onTreeItemDrop(event) {
            this.$emit('drop-embed', this.entry.id, event);
        }
    },
    mounted() {
        if (!this.entry.text) {
            this.$refs.contenteditable.focus();
        }
    }
}
</script>
