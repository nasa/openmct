/*****************************************************************************
* Open MCT, Copyright (c) 2014-2019, United States Government
* as represented by the Administrator of the National Aeronautics and Space
* Administration. All rights reserved.
*
* Open MCT is licensed under the Apache License, Version 2.0 (the
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
* Open MCT includes source code licensed under additional open source
* licenses. See the Open Source Licenses file (LICENSES.md) included with
* this source code distribution or the Licensing information page available
* at runtime from the About dialog for additional information.
*****************************************************************************/
<template>
    <div>
        <h1>Open MCT Third Party Licenses</h1>
        <p>This software includes components released under the following licenses:</p>
        <div v-for="(pkg, key) in packages" :key="key" class="l-license">
            <h2 class="l-license-name">{{key}}</h2>
            <div class="l-license-details">
                <span class="l-license-title">Author</span>
                <span class="l-license-author">{{pkg.publisher}}</span> | 
                <span class="l-license-title">License(s)</span>
                <span class="l-license-description">{{pkg.licenses}}</span> | 
                <span class="l-license-title">Repository</span>
                <span class="l-license-url"><a :href="pkg.repository" target="_blank">{{pkg.repository}}</a></span>
            </div>
            <div class="l-license-text">
                <p>{{pkg.licenseText}}</p>
            </div>
        </div>
    </div>
</template>
<style lang="sass">
</style>
<script>
import packages from './third-party-licenses.json';

export default {
    data() {
        return {
            packages: packages
        }
    }
}
</script>
 