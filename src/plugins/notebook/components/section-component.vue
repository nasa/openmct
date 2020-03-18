<template>
<div class="c-list__item js-list__item"
     :class="[{ 'is-selected': section.isSelected, 'is-notebook-default' : (defaultSectionId === section.id) }]"
     :data-id="section.id"
     @click="selectSection"
>
    <span class="c-list__item__name js-list__item__name"
          :data-id="section.id"
          @keydown.enter="updateName"
          @blur="updateName"
    >{{ section.name.length ? section.name : `Unnamed ${sectionTitle}` }}</span>
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
                        @click="action.perform(section.id)"
                    >
                        {{ action.name }}
                    </li>
                </ul>
            </div>
        </div>
    </div>
</div>
</template>

<style lang="scss">
</style>

<script>
import { togglePopupMenu } from '../utils/popup-menu';

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
            actions: [this.deleteSectionAction()]
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
        deleteSectionAction() {
            const self = this;

            return {
                name: `Delete ${this.sectionTitle}`,
                cssClass: 'icon-trash',
                perform: function (id) {
                    const dialog = self.openmct.overlays.dialog({
                        iconClass: "error",
                        message: 'This action will delete this section and all of its pages and entries. Do you want to continue?',
                        buttons: [
                            {
                                label: "No",
                                callback: () => {
                                    dialog.dismiss();
                                }
                            },
                            {
                                label: "Yes",
                                emphasis: true,
                                callback: () => {
                                    self.$emit('deleteSection', id);
                                    dialog.dismiss();
                                }
                            }
                        ]
                    });
                }
            };
        },
        selectSection(event) {
            const target = event.target;
            const section = target.closest('.js-list__item');
            const input = section.querySelector('.js-list__item__name');

            if (section.className.indexOf('is-selected') > -1) {
                input.contentEditable = true;
                input.classList.add('c-input-inline');
                return;
            }

            const id = target.dataset.id;

            if (!id) {
                return;
            }

            this.$emit('selectSection', id);
        },
        toggleActionMenu(event) {
            togglePopupMenu(event, this.openmct);
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

            this.$emit('renameSection', Object.assign(this.section, { name }));
        }
    }
}
</script>
