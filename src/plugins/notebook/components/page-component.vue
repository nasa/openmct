<template>
<div :class="['page', {'selected': page.isSelected}]">
    <span contenteditable="true"
          :data-id="page.id"
          @click="selectPage"
          @blur="updateName"
    >
        {{ page.name.length ? page.name : `Unnamed ${page.pageTitle}` }}
    </span>
    <button class="c-icon-button icon-trash"
            :data-id="page.id"
            @click="deletePage"
    ></button>
</div>
</template>

<script>
import { EVENT_DELETE_PAGE, EVENT_RENAME_PAGE, EVENT_SELECT_PAGE } from '../notebook-constants';

export default {
    props: {
        page: {
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
        deletePage() {
            const yes = confirm('Delete?');
            const target = event.target;
            const id = target.dataset.id;
            if (!id || !yes) {
                return;
            }

            this.$emit(EVENT_DELETE_PAGE, id);
        },
        updateName(event) {
            const name = event.target.textContent.toString();
            if (this.page.name === name) {
                return;
            }

            if (name === '') {
                return;
            }

            this.$emit(EVENT_RENAME_PAGE, Object.assign(this.page, { name }));
        },
        selectPage(event) {
            const target = event.target;
            const id = target.dataset.id;
            if (!id) {
                return;
            }

            this.$emit(EVENT_SELECT_PAGE, id);
        }
    }
}
</script>
