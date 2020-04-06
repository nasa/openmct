<template>
<div class="c-list__item js-list__item"
     :class="[{ 'is-selected': page.isSelected, 'is-notebook-default' : (defaultPageId === page.id) }]"
     :data-id="page.id"
     @click="selectPage"
>
    <span class="c-list__item__name js-list__item__name"
          :data-id="page.id"
          @keydown.enter="updateName"
          @blur="updateName"
    >{{ page.name.length ? page.name : `Unnamed ${pageTitle}` }}</span>
    <a class="c-list__item__menu-indicator icon-arrow-down"
       @click="toggleActionMenu"
    ></a>
    <div class="hide-menu hidden">
        <div class="menu-element context-menu-wrapper mobile-disable-select">
            <div class="c-menu">
                <ul>
                    <li v-for="action in actions"
                        :key="action.name"
                        :class="action.cssClass"
                        @click="action.perform(page.id)"
                    >
                        {{ action.name }}
                    </li>
                </ul>
            </div>
        </div>
    </div>
</div>
</template>

<script>
import { togglePopupMenu } from '../utils/popup-menu';
import RemoveDialog from '../utils/removeDialog';

export default {
    inject: ['openmct'],
    props: {
        defaultPageId: {
            type: String,
            default() {
                return '';
            }
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
            actions: []
        }
    },
    watch: {
        page(newPage) {
            this.toggleContentEditable(newPage);
        }
    },
    mounted() {
        this.initRemoveDialog();
        this.toggleContentEditable();
    },
    destroyed() {
    },
    methods: {
        deletePage(id) {
            this.$emit('deletePage', id);
        },
        initRemoveDialog() {
            const buttons = [
                { label: "No" },
                {
                    label: "Yes",
                    emphasis: true,
                    clicked: this.deletePage.bind(this)
                }
            ];
            const cssClass = 'icon-trash';
            const iconClass = "error";
            const message = 'This action will delete this page and all of its entries. Do you want to continue?';
            const name = `Delete ${this.pageTitle}`;

            const removeDialog = new RemoveDialog(this.openmct, {
                buttons,
                cssClass,
                iconClass,
                message,
                name
            });

            const removeAction = removeDialog.getRemoveAction();

            this.actions = this.actions.concat(removeAction);
        },
        selectPage(event) {
            const target = event.target;
            const page = target.closest('.js-list__item');
            const input = page.querySelector('.js-list__item__name');

            if (page.className.indexOf('is-selected') > -1) {
                input.contentEditable = true;
                input.classList.add('c-input-inline');
                return;
            }

            const id = target.dataset.id;
            if (!id) {
                return;
            }

            this.$emit('selectPage', id);
        },
        toggleActionMenu(event) {
            event.preventDefault();
            togglePopupMenu(event, this.openmct);
        },
        toggleContentEditable(page = this.page) {
            const pageTitle = this.$el.querySelector('span');
            pageTitle.contentEditable = page.isSelected;
        },
        updateName(event) {
            const target = event.target;
            const name = target.textContent.toString();
            target.contentEditable = false;
            target.classList.remove('c-input-inline');

            if (this.page.name === name) {
                return;
            }

            if (name === '') {
                return;
            }

            this.$emit('renamePage', Object.assign(this.page, { name }));
        }
    }
}
</script>
