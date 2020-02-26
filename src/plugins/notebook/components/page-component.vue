<template>
    <div class="c-list-item"
         :class="{'selected': page.isSelected}">
    <span contenteditable="true"
          :data-id="page.id"
          @click="selectPage"
          @blur="updateName"
    >
        {{ page.name.length ? page.name : `Unnamed ${page.pageTitle}` }}
    </span>
    <button class="c-icon-button icon-trash"
            :data-id="page.id"
            title="Delete Page"
            @click="deletePage"
    >
    </button>
</div>
</template>

<script>
import { EVENT_DELETE_PAGE, EVENT_RENAME_PAGE, EVENT_SELECT_PAGE } from '../notebook-constants';

export default {
    inject: ['openmct'],
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
            const self = this;
            const target = event.target;
            const id = target.dataset.id;

            if (!id) {
                return;
            }

            var dialog = self.openmct.overlays.dialog({
                iconClass: "alert",
                message: 'This action will delete this page and all of its entries. Do you want to continue?',
                buttons: [{
                    label: "No",
                    callback: function () {
                        dialog.dismiss();
                    }
                },
                {
                    label: "Yes",
                    emphasis: true,
                    callback: function () {
                        self.$emit(EVENT_DELETE_PAGE, id);
                        dialog.dismiss();
                    }
                }]
            });
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
