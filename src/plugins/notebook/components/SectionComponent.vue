<template>
<div
    class="c-list__item js-list__item"
    :class="[{ 'is-selected': isSelected, 'is-notebook-default' : (defaultSectionId === section.id) }]"
    :data-id="section.id"
    @click="selectSection"
>
    <span
        class="c-list__item__name js-list__item__name"
        :data-id="section.id"
        contenteditable="true"
        @keydown.escape="updateName"
        @keydown.enter="updateName"
        @blur="updateName"
    >{{ sectionName }}</span>
    <PopupMenu
        v-if="!section.isLocked"
        :popup-menu-items="popupMenuItems"
    />
</div>
</template>

<script>
import PopupMenu from './PopupMenu.vue';
import RemoveDialog from '../utils/removeDialog';

export default {
    components: {
        PopupMenu
    },
    inject: ['openmct'],
    props: {
        defaultSectionId: {
            type: String,
            default() {
                return '';
            }
        },
        selectedSectionId: {
            type: String,
            required: true
        },
        section: {
            type: Object,
            required: true
        },
        sectionTitle: {
            type: String,
            default() {
                return '';
            }
        }
    },
    data() {
        return {
            popupMenuItems: [],
            removeActionString: `Delete ${this.sectionTitle}`
        };
    },
    computed: {
        isSelected() {
            return this.selectedSectionId === this.section.id;
        },
        sectionName() {
            return this.section.name.length ? this.section.name : `Unnamed ${this.sectionTitle}`;
        }
    },
    mounted() {
        this.addPopupMenuItems();
    },
    methods: {
        addPopupMenuItems() {
            const removeSection = {
                cssClass: 'icon-trash',
                name: this.removeActionString,
                callback: this.getRemoveDialog.bind(this)
            };

            this.popupMenuItems = [removeSection];
        },
        deleteSection(success) {
            if (!success) {
                return;
            }

            this.$emit('deleteSection', this.section.id);
        },
        getRemoveDialog() {
            const message = 'Other users may be editing entries in this section, and deleting it is permanent. Do you want to continue?';
            const options = {
                name: this.removeActionString,
                callback: this.deleteSection.bind(this),
                message
            };

            const removeDialog = new RemoveDialog(this.openmct, options);
            removeDialog.show();
        },
        selectSection(event) {
            const { target, target: { dataset: { id } } } = event;

            if (!this.section.isLocked) {
                const section = target.closest('.js-list__item');
                const input = section.querySelector('.js-list__item__name');

                if (section.className.indexOf('is-selected') > -1) {
                    input.classList.add('c-input-inline');

                    return;
                }
            }

            if (!id) {
                return;
            }

            this.$emit('selectSection', id);
        },
        renameSection(target) {
            if (!target) {
                return;
            }

            target.textContent = target.textContent.trim().toString();

            const name = target.textContent;

            if (name === '' || this.section.name === name) {
                return;
            }

            this.$emit('renameSection', Object.assign(this.section, { name }));
        },
        updateName(event) {
            const { target, keyCode, type } = event;

            if (keyCode === 27) {
                target.textContent = this.section.name;
            } else if (keyCode === 13 || type === 'blur') {
                this.renameSection(target);
            }

            target.scrollLeft = '0';
            target.classList.remove('c-input-inline');

            target.blur();
        }
    }
};
</script>
