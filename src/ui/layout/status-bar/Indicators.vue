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

    .l-indicators {
        display: flex;
        align-items: center;
    }

    .c-indicator {
        @include cControl();
        @include cClickIconButtonLayout();
        button { text-transform: uppercase; }

        $br: $controlCr;
        border-radius: $br;
        overflow: visible;
        position: relative;
        text-transform: uppercase;

        .label {
            // Hover bubbles that appear when hovering on an Indicator
            display: inline-block;

            a,
            button,
            s-button,
            .c-button {
                // Make <a> in label look like buttons
                transition: $transIn;
                background: transparent;
                border: 1px solid rgba($colorIndicatorMenuFg, 0.5);
                border-radius: $br;
                box-sizing: border-box;
                color: inherit;
                font-size: inherit;
                height: auto;
                line-height: normal;
                padding: 0 2px;
                &:hover {
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

        &.no-collapse {
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

        &:not(.no-collapse) {
            &:before {
                margin-right: 0 !important;
            }

            .label {
                transition: all 250ms ease-in 100ms;
                background: $colorIndicatorMenuBg;
                color: $colorIndicatorMenuFg;
                border-radius: $br;
                left: 3px;
                top: 130%;
                padding: $interiorMargin $interiorMargin;
                position: absolute;
                transform-origin: 10px 0;
                transform: scale(0.0);
                white-space: nowrap;
                z-index: 50;

                &:before {
                    // Infobubble-style arrow element
                    content: '';
                    display: block;
                    position: absolute;
                    bottom: 100%;
                    @include triangle('up', $size: 4px, $ratio: 1, $color: $colorIndicatorMenuBg);
                }
            }

            @include hover() {
                background: $colorIndicatorBgHov;

                .label {
                    box-shadow: $colorIndicatorMenuBgShdw;
                    transform: scale(1.0);
                    transition: all 100ms ease-out 0s;
                }
            }
        }

        &.float-right {
            float: right;
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
