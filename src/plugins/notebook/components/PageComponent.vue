<template>
<div
    class="c-list__item js-list__item"
    :class="[{
        'is-selected': isSelected,
        'is-notebook-default' : (defaultPageId === page.id),
        'icon-lock' : page.isLocked
    }]"
    :data-id="page.id"
    @click="selectPage"
>
    <template v-if="!page.isLocked">
        <div
            class="c-list__item__name js-list__item__name"
            :class="[{ 'c-input-inline': isSelected }]"
            :data-id="page.id"
            :contenteditable="isSelected"
            @keydown.escape="updateName"
            @keydown.enter="updateName"
            @blur="updateName"
        >{{ pageName }}</div>
        <PopupMenu
            :popup-menu-items="popupMenuItems"
        />
    </template>
    <template v-else>
        <div
            class="c-list__item__name js-list__item__name"
            :data-id="page.id"
            :contenteditable="false"
        >{{ pageName }}</div>
    </template>
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
        defaultPageId: {
            type: String,
            default() {
                return '';
            }
        },
        selectedPageId: {
            type: String,
            required: true
        },
        page: {
            type: Object,
            required: true
        },
        pageTitle: {
            type: String,
            default() {
                return '';
            }
        }
    },
    data() {
        return {
            popupMenuItems: [],
            removeActionString: `Delete ${this.pageTitle}`
        };
    },
    computed: {
        isSelected() {
            return this.selectedPageId === this.page.id;
        },
        pageName() {
            return this.page.name.length ? this.page.name : `Unnamed ${this.pageTitle}`;
        }
    },
    mounted() {
        this.addPopupMenuItems();
    },
    methods: {
        addPopupMenuItems() {
            const removePage = {
                cssClass: 'icon-trash',
                name: this.removeActionString,
                callback: this.getRemoveDialog.bind(this)
            };

            this.popupMenuItems = [removePage];
        },
        deletePage(success) {
            if (!success) {
                return;
            }

            this.$emit('deletePage', this.page.id);
        },
        getRemoveDialog() {
            const message = 'Other users may be editing entries in this page, and deleting it is permanent. Do you want to continue?';
            const options = {
                name: this.removeActionString,
                callback: this.deletePage.bind(this),
                message
            };
            const removeDialog = new RemoveDialog(this.openmct, options);
            removeDialog.show();
        },
        selectPage(event) {
            const { target: { dataset: { id } } } = event;

            if (this.isSelected || !id) {
                return;
            }

            this.$emit('selectPage', id);
        },
        renamePage(target) {
            if (!target) {
                return;
            }

            target.textContent = target.textContent ? target.textContent.trim() : `Unnamed ${this.pageTitle}`;

            if (this.page.name === target.textContent) {
                return;
            }

            this.$emit('renamePage', Object.assign(this.page, { name: target.textContent }));
        },
        updateName(event) {
            const { target, keyCode, type } = event;

            if (keyCode === KEY_ESCAPE) {
                target.textContent = this.page.name;
            } else if (keyCode === KEY_ENTER || type === 'blur') {
                this.renamePage(target);
            }

            target.scrollLeft = '0';

            target.blur();
        }
    }
};
</script>
