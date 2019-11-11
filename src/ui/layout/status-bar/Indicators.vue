<!--
 Open MCT, Copyright (c) 2014-2018, United States Government
 as represented by the Administrator of the National Aeronautics and Space
 Administration. All rights reserved.
 Open MCT is licensed under the Apache License, Version 2.0 (the
 "License"); you may not use this file except in compliance with the License.
 You may obtain a copy of the License at
 http://www.apache.org/licenses/LICENSE-2.0.
 Unless required by applicable law or agreed to in writing, software
 distributed under the License is distributed on an "AS IS" BASIS, WITHOUT
 WARRANTIES OR CONDITIONS OF ANY KIND, either express or implied. See the
 License for the specific language governing permissions and limitations
 under the License.
 Open MCT includes source code licensed under additional open source
 licenses. See the Open Source Licenses file (LICENSES.md) included with
 this source code distribution or the Licensing information page available
 at runtime from the About dialog for additional information.
-->
<template>
</template>

<style lang="scss">
    @import "~styles/sass-base";

    .c-indicator {
        @include cControl();
        @include cClickIconButtonLayout();
        button { text-transform: uppercase; }

        background: none !important;
        border-radius: $controlCr;
        overflow: visible;
        position: relative;
        text-transform: uppercase;


        &.no-minify {
            // For items that cannot be minified
            display: flex;
            flex-flow: row nowrap;
            align-items: center;

            > *,
            &:before {
                flex: 1 1 auto;
            }

            &:before {
                margin-right: $interiorMarginSm;
            }
        }

        &:not(.no-minify) {
            &:before {
                margin-right: 0 !important;
            }
        }
    }

    .c-indicator__label {
        // Label element. Appears as a hover bubble element when Indicators are minified;
        // Appears as an inline element when not.
        display: inline-block;
        transition:none;
        white-space: nowrap;

        a,
        button,
        s-button,
        .c-button {
            // Make <a> in label look like buttons
            transition: $transIn;
            background: transparent;
            border: 1px solid rgba($colorIndicatorMenuFg, 0.5);
            border-radius: $controlCr;
            box-sizing: border-box;
            color: inherit;
            font-size: inherit;
            height: auto;
            line-height: normal;
            padding: 0 2px;
            &:hover {
                background: rgba($colorIndicatorMenuFg, 0.1);
                border-color: rgba($colorIndicatorMenuFg, 0.75);
                color: $colorIndicatorMenuFgHov;
            }
        }

        [class*='icon-'] {
            // If any elements within label include the class 'icon-*' then deal with their :before's
            &:before {
                font-size: 0.8em;
                margin-right: $interiorMarginSm;
            }
        }
    }

    .c-indicator__count {
        display: none; // Only displays when Indicator is minified, see below
    }

    [class*='minify-indicators'] {
        // All styles for minified Indicators should go in here
        .c-indicator:not(.no-minify) {
            @include hover() {
                background: $colorIndicatorBgHov;
                .c-indicator__label {
                    box-shadow: $colorIndicatorMenuBgShdw;
                    transform: scale(1.0);
                    transition: all 100ms ease-out 100ms;
                }
            }
            .c-indicator__label {
                transition: all 250ms ease-in 200ms;
                background: $colorIndicatorMenuBg;
                color: $colorIndicatorMenuFg;
                border-radius: $controlCr;
                right: 0;
                top: 130%;
                padding: $interiorMargin $interiorMargin;
                position: absolute;
                transform-origin: 90% 0;
                transform: scale(0.0);
                overflow: visible;
                z-index: 50;

                &:before {
                    // Infobubble-style arrow element
                    content: '';
                    display: block;
                    position: absolute;
                    bottom: 100%;
                    right: 8px;
                    @include triangle('up', $size: 4px, $ratio: 1, $color: $colorIndicatorMenuBg);
                }
            }

            .c-indicator__count {
                display: inline-block;
                margin-left: $interiorMarginSm;
            }
        }
    }

    /* Mobile */
    // Hide the clock indicator when we're phone portrait
    body.phone.portrait {
        .c-indicator.t-indicator-clock {
            display: none;
        }
    }
</style>

<script>
    export default {
        inject: ['openmct'],

        mounted() {
            this.openmct.indicators.indicatorObjects.forEach((indicator) => {
                this.$el.appendChild(indicator.element);
            });
        }
    }
</script>
