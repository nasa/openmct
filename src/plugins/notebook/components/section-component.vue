<template>
<div :class="['section', {'selected': section.isSelected}]">
    <span contenteditable="true"
          :data-id="section.id"
          @blur="updateName"
          @click="selectSection"
    >
        {{ section.name.length ? section.name : `Unnamed ${section.sectionTitle}` }}
    </span>
    <button class="c-icon-button icon-trash"
            :data-id="section.id"
            @click="deleteSection"
    ></button>
</div>
</template>

<style lang="scss">

</style>

<script>
import { EVENT_DELETE_SECTION, EVENT_RENAME_SECTION, EVENT_SELECT_SECTION } from '../notebook-constants';

export default {
    props: {
        section: {
            type: Object,
            required: true
        }
    },
    data() {
        return {
        }
    },
    mounted() {
    },
    destroyed() {
    },
    methods: {
        deleteSection(event) {
            const yes = confirm('Delete?');
            const target = event.target;
            const id = target.dataset.id;
            if (!id || !yes) {
                return;
            }

            this.$emit(EVENT_DELETE_SECTION, id);
        },
        selectSection(event) {
            const target = event.target;
            const id = target.dataset.id;
            if (!id) {
                return;
            }

            this.$emit(EVENT_SELECT_SECTION, id);
        },
        updateName(event) {
            const name = event.target.textContent.trim();
            if (this.section.name === name) {
                return;
            }

            if (name === '') {
                return;
            }

            this.$emit(EVENT_RENAME_SECTION, Object.assign(this.section, { name }));
        }
    }
}
</script>
