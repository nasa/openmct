/*****************************************************************************
* Open MCT Web, Copyright (c) 2014-2018, United States Government
* as represented by the Administrator of the National Aeronautics and Space
* Administration. All rights reserved.
*
* Open MCT Web is licensed under the Apache License, Version 2.0 (the
* "License"); you may not use this file except in compliance with the License.
* You may obtain a copy of the License at
* http://www.apache.org/licenses/LICENSE-2.0.
*
* Unless required by applicable law or agreed to in writing, software
* distributed under the License is distributed on an "AS IS" BASIS, WITHOUT
* WARRANTIES OR CONDITIONS OF ANY KIND, either express or implied. See the
* License for the specific language governing permissions and limitations
* under the License.
*
* Open MCT Web includes source code licensed under additional open source
* licenses. See the Open Source Licenses file (LICENSES.md) included with
* this source code distribution or the Licensing information page available
* at runtime from the About dialog for additional information.
*****************************************************************************/
<template>
    <div class="c-clock-symbol">
        <div class="hand-little"></div>
        <div class="hand-big"></div>
    </div>
</template>

<style lang="scss">
    @keyframes clock-hands {
        0% { transform: translate(-50%, -50%) rotate(0deg); }
        100% { transform: translate(-50%, -50%) rotate(360deg);  }
    }

    @keyframes clock-hands-sticky {
        0% { transform: translate(-50%, -50%) rotate(0deg); }
        7% { transform: translate(-50%, -50%) rotate(0deg); }
        8% { transform: translate(-50%, -50%) rotate(30deg); }
        15% { transform: translate(-50%, -50%) rotate(30deg); }
        16% { transform: translate(-50%, -50%) rotate(60deg); }
        24% { transform: translate(-50%, -50%) rotate(60deg); }
        25% { transform: translate(-50%, -50%) rotate(90deg); }
        32% { transform: translate(-50%, -50%) rotate(90deg); }
        33% { transform: translate(-50%, -50%) rotate(120deg); }
        40% { transform: translate(-50%, -50%) rotate(120deg); }
        41% { transform: translate(-50%, -50%) rotate(150deg); }
        49% { transform: translate(-50%, -50%) rotate(150deg); }
        50% { transform: translate(-50%, -50%) rotate(180deg); }
        57% { transform: translate(-50%, -50%) rotate(180deg); }
        58% { transform: translate(-50%, -50%) rotate(210deg); }
        65% { transform: translate(-50%, -50%) rotate(210deg); }
        66% { transform: translate(-50%, -50%) rotate(240deg); }
        74% { transform: translate(-50%, -50%) rotate(240deg); }
        75% { transform: translate(-50%, -50%) rotate(270deg); }
        82% { transform: translate(-50%, -50%) rotate(270deg); }
        83% { transform: translate(-50%, -50%) rotate(300deg); }
        90% { transform: translate(-50%, -50%) rotate(300deg); }
        91% { transform: translate(-50%, -50%) rotate(330deg); }
        99% { transform: translate(-50%, -50%) rotate(330deg); }
        100% { transform: translate(-50%, -50%) rotate(360deg); }
    }


    .c-clock-symbol {
        $c: $colorBtnBg; //$colorObjHdrIc;
        $d: 18px;
        height: $d;
        width: $d;
        position: relative;

        &:before {
            font-family: symbolsfont;
            color: $c;
            content: $glyph-icon-brackets;
            font-size: $d;
            line-height: normal;
            display: block;
            width: 100%;
            height: 100%;
            z-index: 1;
        }

        // Clock hands
        div[class*="hand"] {
            $handW: 2px;
            $handH: $d * 0.4;
            animation-iteration-count: infinite;
            animation-timing-function: linear;
            transform-origin: bottom;
            position: absolute;
            height: $handW;
            width: $handW;
            left: 50%;
            top: 50%;
            z-index: 2;
            &:before {
                background: $c;
                content: '';
                display: block;
                position: absolute;
                width: 100%;
                bottom: -1px;
            }
            &.hand-little {
                z-index: 2;
                animation-duration: 12s;
                transform: translate(-50%, -50%) rotate(120deg);
                &:before {
                    height: ceil($handH * 0.6);
                }
            }
            &.hand-big {
                z-index: 1;
                animation-duration: 1s;
                transform: translate(-50%, -50%);
                &:before {
                    height: $handH;
                }
            }
        }

        // Modes
        .is-realtime-mode &,
        .is-lad-mode & {
            &:before {
                // Brackets icon
                color: $colorTime;
            }
            div[class*="hand"] {
                animation-name: clock-hands;
                &:before {
                    background: $colorTime;
                }
            }
        }
    }
</style>
