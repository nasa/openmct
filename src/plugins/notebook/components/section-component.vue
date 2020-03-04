<template>
<div class="c-list__item js-list__item"
     :class="[{ 'is-selected': section.isSelected, 'is-default' : (defaultSectionId === section.id) }]"
     :data-id="section.id"
     @click="selectSection"
>
    <span class="c-list__item__name js-list__item__name"
          :data-id="section.id"
          @blur="updateName"
    >
        {{ section.name.length ? section.name : `Unnamed ${section.sectionTitle}` }}
    </span>
    <button class="c-icon-button icon-trash"
            :data-id="section.id"
            title="Delete Section"
            @click="deleteSection"
    >
    </button>
</div>
</template>

<style lang="scss">
</style>

<script>
import { EVENT_DELETE_SECTION, EVENT_RENAME_SECTION, EVENT_SELECT_SECTION } from '../notebook-constants';

export default {
    inject: ['openmct'],
    props: {
        defaultSectionId: {
            type: String,
            default() {
                return '';
            }
        },
        section: {
            type: Object,
            required: true
        }
    },
    data() {
        return {
        }
    },
    watch: {
        section(newSection) {
            this.toggleContentEditable(newSection);
        }
    },
    mounted() {
        this.toggleContentEditable();
    },
    destroyed() {
    },
    methods: {
        deleteSection(event) {
            const self = this;
            const target = event.target;
            const id = target.dataset.id;

            if (!id) {
                return;
            }

            var dialog = self.openmct.overlays.dialog({
                iconClass: "alert",
                message: 'This action will delete this section and all of its pages and entries. Do you want to continue?',
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
                        self.$emit(EVENT_DELETE_SECTION, id);
                        dialog.dismiss();
                    }
                }]
            });
        },
        selectSection(event) {
            const target = event.target;
            const section = target.closest('.js-list__item');
            const input = section.querySelector('.js-list__item__name');

            if (section.className.indexOf('is-selected') > -1) {
                input.contentEditable = true;
                input.classList.add('c-input-inline');
                document.execCommand('selectAll',false,null);
                return;
            }

            const id = target.dataset.id;

            if (!id) {
                return;
            }

            this.$emit(EVENT_SELECT_SECTION, id);
        },
        toggleContentEditable(section = this.section) {
            const sectionTitle = this.$el.querySelector('span');
            sectionTitle.contentEditable = section.isSelected;
        },
        updateName(event) {
            const target = event.target;
            target.contentEditable = false;
            target.classList.remove('c-input-inline');
            const name = target.textContent.trim();

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
