<template>
<div class="c-ne__embed">
    <div v-if="embed.snapshot"
         class="c-ne__embed__snap-thumb"
         @click="openSnapshot(domainObject, entry, embed)"
    >
        <img :src="embed.snapshot.src">
    </div>
    <div class="c-ne__embed__info">
        <div class="c-ne__embed__name">
            <a class="c-ne__embed__link"
               :href="objectLink"
               :class="embed.cssClass"
            >{{ embed.name }}</a>
            <a class="c-ne__embed__context-available icon-arrow-down"
               @click="toggleActionMenu"
            ></a>
        </div>
        <div class="hide-menu hidden">
            <div class="menu-element context-menu-wrapper mobile-disable-select">
                <div class="c-menu">
                    <ul>
                        <li v-for="action in actions"
                            :key="action.name"
                            :class="action.cssClass"
                            @click="action.perform(embed, entry)"
                        >
                            {{ action.name }}
                        </li>
                    </ul>
                </div>
            </div>
        </div>
        <div v-if="embed.snapshot"
             class="c-ne__embed__time"
        >
            {{ formatTime(embed.createdOn, 'YYYY-MM-DD HH:mm:ss') }}
        </div>
    </div>
</div>
</template>

<script>
import Moment from 'moment';
import $ from 'zepto';
import PreviewAction from '../../../ui/preview/PreviewAction';
import objectLink from '../../../ui/mixins/object-link';
// import Painterro from 'painterro';

export default {
    inject: ['openmct', 'domainObject'],
    components: {
    },
    mixins: [objectLink],
    props: {
        embed: {
            type: Object,
            default() {
                return {};
            }
        },
        entry: {
            type: Object,
            default() {
                return {};
            }
        },
        objectPath: {
            type: Object,
            default() {
                return {};
            }
        }
    },
    data() {
        return {
            actions: [this.removeEmbedAction()],
            agentService: this.openmct.$injector.get('agentService'),
            currentEntryValue: '',
            popupService: this.openmct.$injector.get('popupService'),
            showActionMenu: false
        }
    },
    watch: {
    },
    beforeMount() {
        this.populateActionMenu();
    },
    methods: {
        formatTime(unixTime, timeFormat) {
            return Moment(unixTime).format(timeFormat);
        },
        openSnapshot() {
            console.log('openSnapshot');
        },
        populateActionMenu() {
            var self = this;
            const actions = [new PreviewAction(self.openmct)];
            self.openmct.objects.get(self.embed.type)
                .then((domainObject) => {
                    actions.forEach((action) => {
                        self.actions.push({
                            cssClass: action.cssClass,
                            name: action.name,
                            perform: () => {
                                action.invoke([domainObject].concat(self.openmct.router.path));
                            }
                        });
                    });
                });
        },
        removeEmbedAction() {
            var self = this;

            return {
                name: 'Remove Embed',
                cssClass: 'icon-trash',
                perform: function (embed, entry) {
                    var entryPosition = self.findInArray(self.domainObject.entries, entry.id),
                        embedPosition = self.findInArray(entry.embeds, embed.id);

                    var dialog = self.openmct.overlays.dialog({
                        iconClass: "alert",
                        message: 'This Action will permanently delete this embed. Do you wish to continue?',
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
                                entry.embeds.splice(embedPosition, 1);
                                var dirString = 'entries[' + entryPosition + '].embeds';

                                self.openmct.objects.mutate(self.domainObject, dirString, entry.embeds);
                                dialog.dismiss();
                            }
                        }]
                    });
                }
            };
        },
        toggleActionMenu(event) {
            event.preventDefault();

            const body = $(document.body);
            const container = $(event.target.parentElement.parentElement);
            const initiatingEvent = this.agentService.isMobile()
                ? 'touchstart'
                : 'mousedown';
            const menu = container.find('.menu-element');
            let dismissExistingMenu;

            function dismiss() {
                container.find('.hide-menu').append(menu);
                body.off(initiatingEvent, menuClickHandler);
                dismissExistingMenu = undefined;
            }

            function menuClickHandler(e) {
                window.setTimeout(() => {
                    dismiss();
                }, 100);
            }

            // Dismiss any menu which was already showing
            if (dismissExistingMenu) {
                dismissExistingMenu();
            }

            // ...and record the presence of this menu.
            dismissExistingMenu = dismiss;

            this.popupService.display(menu, [event.pageX,event.pageY], {
                marginX: 0,
                marginY: -50
            });

            body.on(initiatingEvent, menuClickHandler);
        }
    }
}
</script>
