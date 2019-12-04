<template>
<div
    class="l-shell"
    :class="{
        'is-editing': isEditing
    }"
>
    <div
        class="l-shell__head"
        :class="{
            'l-shell__head--expanded': headExpanded,
            'l-shell__head--minify-indicators': !headExpanded
        }"
    >
        <CreateButton class="l-shell__create-button" />
        <indicators class="l-shell__head-section l-shell__indicators" />
        <button
            class="l-shell__head__collapse-button c-button"
            @click="toggleShellHead"
        ></button>
        <notification-banner />
        <div class="l-shell__head-section l-shell__controls">
            <button
                class="c-icon-button c-icon-button--major icon-new-window"
                title="Open in a new browser tab"
                target="_blank"
                @click="openInNewTab"
            ></button>
            <button
                :class="['c-icon-button c-icon-button--major', fullScreen ? 'icon-fullscreen-collapse' : 'icon-fullscreen-expand']"
                :title="`${fullScreen ? 'Exit' : 'Enable'} full screen mode`"
                @click="fullScreenToggle"
            ></button>
        </div>
        <app-logo />
    </div>
    <multipane
        class="l-shell__main"
        type="horizontal"
    >
        <pane
            class="l-shell__pane-tree"
            handle="after"
            label="Browse"
            collapsable
        >
            <mct-tree class="l-shell__tree" />
        </pane>
        <pane class="l-shell__pane-main">
            <browse-bar
                ref="browseBar"
                class="l-shell__main-view-browse-bar"
            />
            <toolbar
                v-if="toolbar"
                class="l-shell__toolbar"
            />
            <object-view
                ref="browseObject"
                class="l-shell__main-container"
                :show-edit-view="true"
                data-selectable
            />
            <component
                :is="conductorComponent"
                class="l-shell__time-conductor"
            />
        </pane>
        <pane
            class="l-shell__pane-inspector l-pane--holds-multipane"
            handle="before"
            label="Inspect"
            collapsable
        >
            <Inspector
                ref="inspector"
                :is-editing="isEditing"
            />
        </pane>
    </multipane>
</div>
</template>

<style lang="scss">
    @import "~styles/sass-base";

    /******************************* SHELL */
    .l-shell {
        position: absolute;
        top: 0; right: 0; bottom: 0; left: 0;
        display: flex;
        flex-flow: column nowrap;
        overflow: hidden;

        &__pane-tree {
            width: 40%;

            [class*="collapse-button"] {
                // For mobile, collapse button becomes menu icon
                body.mobile & {
                    @include cClickIconButton();
                    color: $colorKey !important;
                    position: absolute;
                    right: -2 * nth($shellPanePad, 2); // Needs to be -1 * when pane is collapsed
                    top: 0;
                    transform: translateX(100%);
                    width: $mobileMenuIconD;
                    z-index: 2;

                    &:before {
                        content: $glyph-icon-menu-hamburger;
                    }
                }
            }
        }

        &__pane-tree,
        &__pane-inspector,
        &__pane-main {
            .l-pane__contents {
                display: flex;
                flex-flow: column nowrap;
                overflow-x: hidden;

                > * {
                    flex: 0 0 auto;
                    + * {
                        margin-top: $interiorMarginLg;
                    }
                }
            }
        }

        body.mobile & {
            &__pane-tree {
                background: linear-gradient(90deg, transparent 70%, rgba(black, 0.2) 99%, rgba(black, 0.3));

                &[class*="--collapsed"] {
                    [class*="collapse-button"] {
                        right: -1 * nth($shellPanePad, 2);
                    }
                }
            }
        }

        body.phone.portrait & {
            &__pane-tree {
                width: calc(100% - #{$mobileMenuIconD + (2 * nth($shellPanePad, 2))});

                + .l-pane {
                    // Hide pane-main when this pane is expanded
                    opacity: 0;
                    pointer-events: none;
                }

                &[class*="--collapsed"] + .l-pane {
                    // Show pane-main when tree is collapsed
                    opacity: 1;
                    pointer-events: inherit;
                    transition: opacity 250ms ease 250ms;
                }
            }
        }

        &__head,
        &__pane-inspector {
            body.mobile & {
                display: none;
            }
        }

        &__head,
        &__status {
            flex: 0 0 auto;
            display: flex;
        }

        /******************************* HEAD */
        &__main-view-browse-bar {
            flex: 0 0 auto;
        }

        body.mobile & .l-shell__main-view-browse-bar {
            margin-left: $mobileMenuIconD; // Make room for the hamburger!
        }

        &__head {
            align-items: stretch;
            background: $colorHeadBg;
            justify-content: space-between;
            padding: $interiorMargin $interiorMargin + 2;

            > [class*="__"] + [class*="__"] {
                margin-left: $interiorMargin;
            }

            [class*='__head__collapse-button'] {
                align-self: start;
                flex: 0 0 auto;
                margin-top: 6px;

                &:before {
                    content: $glyph-icon-arrow-down;
                    font-size: 1.1em;
                }
            }

            &-section {
                // Subdivides elements across the head
                display: flex;
                flex: 0 1 auto;
                padding: 0 $interiorMargin;
            }

            &--expanded {
                .c-indicator__label {
                    transition: none !important;
                }

                [class*='__head__collapse-button'] {
                    &:before {
                        transform: rotate(180deg);
                    }
                }
            }
        }

        &__controls {
            $brdr: 1px solid $colorInteriorBorder;
            border-right: $brdr;
            border-left: $brdr;
            align-items: start;
        }

        &__create-button,
        &__app-logo {
            flex: 0 0 auto;
        }

        &__create-button { margin-right: $interiorMarginLg; }

        &__indicators {
            flex: 1 1 auto;
            flex-wrap: wrap;
            justify-content: flex-end;
            [class*='indicator-clock'] { order: 90; }

            .c-indicator .label {
                font-size: 0.9em;
            }
        }

        /******************************* MAIN AREA */
        &__main-container {
            // Wrapper for main views
            flex: 1 1 auto !important;
            height: 0; // Chrome 73 overflow bug fix
            overflow: auto;
        }

        &__tree {
            // Tree component within __pane-tree
            flex: 1 1 auto !important;
        }

        &__time-conductor {
            border-top: 1px solid $colorInteriorBorder;
            padding-top: $interiorMargin;
        }

        &__main {
            > .l-pane {
                padding: nth($shellPanePad, 1) nth($shellPanePad, 2);
            }
        }

        body.desktop & {
            &__main {
                // Top and bottom padding in container that holds tree, __pane-main and Inspector
                padding: $shellMainPad;
                min-height: 0;

                > .l-pane {
                    padding-top: 0;
                    padding-bottom: 0;
                }
            }

            &__pane-tree,
            &__pane-inspector {
                max-width: 30%;
            }

            &__pane-tree {
                width: 300px;
            }

            &__pane-inspector {
                width: 200px;
            }
        }

        &__toolbar {
            $p: $interiorMargin;
            background: $editUIBaseColor;
            border-radius: $basicCr;
            height: $p + 24px; // Need to standardize the height
            padding: $p;
        }
    }

    .is-editing {
        .l-shell__main-container {
            $m: 3px;
            box-shadow: $colorBodyBg 0 0 0 1px, $editUIAreaShdw;
            margin-left: $m;
            margin-right: $m;

            &[s-selected] {
                // Provide a clearer selection context articulation for the main edit area
                box-shadow: $colorBodyBg 0 0 0 1px, $editUIAreaShdwSelected;
            }
        }
    }

</style>

<script>
import Inspector from '../inspector/Inspector.vue';
import MctTree from './mct-tree.vue';
import ObjectView from '../components/ObjectView.vue';
import MctTemplate from '../legacy/mct-template.vue';
import CreateButton from './CreateButton.vue';
import multipane from './multipane.vue';
import pane from './pane.vue';
import BrowseBar from './BrowseBar.vue';
import Toolbar from '../toolbar/Toolbar.vue';
import AppLogo from './AppLogo.vue';
import Indicators from './status-bar/Indicators.vue';
import NotificationBanner from './status-bar/NotificationBanner.vue';

var enterFullScreen = () => {
    var docElm = document.documentElement;

    if (docElm.requestFullscreen) {
        docElm.requestFullscreen();
    } else if (docElm.mozRequestFullScreen) { /* Firefox */
        docElm.mozRequestFullScreen();
    } else if (docElm.webkitRequestFullscreen) { /* Chrome, Safari and Opera */
        docElm.webkitRequestFullscreen();
    } else if (docElm.msRequestFullscreen) { /* IE/Edge */
        docElm.msRequestFullscreen();
    }
};
var exitFullScreen = () => {
    if (document.exitFullscreen) {
        document.exitFullscreen();
    }
    else if (document.mozCancelFullScreen) {
        document.mozCancelFullScreen();
    }
    else if (document.webkitCancelFullScreen) {
        document.webkitCancelFullScreen();
    }
    else if (document.msExitFullscreen) {
        document.msExitFullscreen();
    }
}

export default {
    inject: ['openmct'],
    components: {
        Inspector,
        MctTree,
        ObjectView,
        'mct-template': MctTemplate,
        CreateButton,
        multipane,
        pane,
        BrowseBar,
        Toolbar,
        AppLogo,
        Indicators,
        NotificationBanner
    },
    data: function () {
        let storedHeadProps = window.localStorage.getItem('openmct-shell-head');
        let headExpanded = true;
        if (storedHeadProps) {
            headExpanded = JSON.parse(storedHeadProps).expanded;
        }

        return {
            fullScreen: false,
            conductorComponent: undefined,
            isEditing: false,
            hasToolbar: false,
            headExpanded
        }
    },
    computed: {
        toolbar() {
            return this.hasToolbar && this.isEditing;
        }
    },
    mounted() {
        this.openmct.editor.on('isEditing', (isEditing)=>{
            this.isEditing = isEditing;
        });

        this.openmct.selection.on('change', this.toggleHasToolbar);
    },
    methods: {
        toggleShellHead() {
            this.headExpanded = !this.headExpanded;

            window.localStorage.setItem(
                'openmct-shell-head',
                JSON.stringify(
                    {
                        expanded: this.headExpanded
                    }
                )
            );
        },
        fullScreenToggle() {
            if (this.fullScreen) {
                this.fullScreen = false;
                exitFullScreen();
            } else {
                this.fullScreen = true;
                enterFullScreen();
            }
        },
        openInNewTab(event) {
            window.open(window.location.href);
        },
        toggleHasToolbar(selection) {
            let structure = undefined;

            if (!selection || !selection[0]) {
                structure = [];
            } else {
                structure = this.openmct.toolbars.get(selection);
            }

            this.hasToolbar = structure.length > 0;
        }
    }
}
</script>
