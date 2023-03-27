<template>
<div
    class="c-list__item js-list__item"
    :class="[{ 'is-selected': isSelected, 'is-notebook-default' : (defaultSectionId === section.id) }]"
    :data-id="section.id"
    @click="selectSection"
>
    <span
        class="c-list__item__name js-list__item__name"
        :class="[{ 'c-input-inline': isSelected && !section.isLocked }]"
        :data-id="section.id"
        :contenteditable="isSelected && !section.isLocked"
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
import { KEY_ENTER, KEY_ESCAPE } from '../utils/notebook-key-code';
import RemoveDialog from '../utils/removeDialog';
import PopupMenu from './PopupMenu.vue';

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
            const { target: { dataset: { id } } } = event;

            if (this.isSelected || !id) {
                return;
            }

            this.$emit('selectSection', id);
        },
        renameSection(target) {
            if (!target) {
                return;
            }

            target.textContent = target.textContent ? target.textContent.trim() : `Unnamed ${this.sectionTitle}`;

            if (this.section.name === target.textContent) {
                return;
            }

            this.$emit('renameSection', Object.assign(this.section, { name: target.textContent }));
        },
        updateName(event) {
            const { target, keyCode, type } = event;

            if (keyCode === KEY_ESCAPE) {
                target.textContent = this.section.name;
            } else if (keyCode === KEY_ENTER || type === 'blur') {
                this.renameSection(target);
            }

            target.scrollLeft = '0';

            target.blur();
        }
    }
};
</script>
