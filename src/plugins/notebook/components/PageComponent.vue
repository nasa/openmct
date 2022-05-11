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
            :data-id="page.id"
            :contenteditable="true"
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
import PopupMenu from './PopupMenu.vue';
import RemoveDialog from '../utils/removeDialog';

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
            const target = event.target;
            const id = target.dataset.id;

            if (!this.page.isLocked) {
                const page = target.closest('.js-list__item');
                const input = page.querySelector('.js-list__item__name');

                if (page.className.indexOf('is-selected') > -1) {
                    input.classList.add('c-input-inline');

                    return;
                }
            }

            if (!id) {
                return;
            }

            this.$emit('selectPage', id);
        },
        updateName(event) {
            const target = event.target;
            const name = target.textContent.toString();
            target.classList.remove('c-input-inline');

            if (name === '' || this.page.name === name) {
                return;
            }

            this.$emit('renamePage', Object.assign(this.page, { name }));
        }
    }
};
</script>
