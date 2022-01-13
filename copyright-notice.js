/*****************************************************************************
 * Open MCT, Copyright (c) 2014-2022, United States Government
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
//SPLIT
const { resolve } = require('path');
const { readdir, readFile} = require('fs').promises;
const path = require('path');

async function getCopyrightString() {
    // eslint-disable-next-line no-undef
    const copyrightFile = await (await readFile(__filename, 'UTF-8')).toString();
    const justTheNotice = copyrightFile.split('//SPLIT')[0];

    return justTheNotice;
}

async function* getFilesRecursively(directoryToSearch, directoriesToSkip, extensionsToInclude) {
    const fileOrDirectoryEntries = await readdir(directoryToSearch, { withFileTypes: true });
    for (const fileOrDirectoryEntry of fileOrDirectoryEntries) {
        const resolvedFileOrDirectoryEntry = resolve(directoryToSearch, fileOrDirectoryEntry.name);
        const extension = path.extname(resolvedFileOrDirectoryEntry);
        if (fileOrDirectoryEntry.isDirectory() && !directoriesToSkip.includes(directoriesToSkip)) {
            yield* getFilesRecursively(resolvedFileOrDirectoryEntry, directoriesToSkip, extensionsToInclude);
        } else if (extension && extensionsToInclude.includes(extension)) {
            yield resolvedFileOrDirectoryEntry;
        } else {
            console.debug(`🔃 skipping ${resolvedFileOrDirectoryEntry}`);
        }
    }
}

function replaceCopyrightInSingleFile(file, copyrightNotice) {
    console.debug(`🖲 replacing ${file}`);
}

async function replaceAllCopyrightWithCurrentYear(directoryToStartIn, directoriesToSkip, extensionsToInclude) {
    const copyrightNotice = getCopyrightString();
    for await (const foundFile of getFilesRecursively(directoryToStartIn, directoriesToSkip, extensionsToInclude)) {
        replaceCopyrightInSingleFile(foundFile, copyrightNotice);
    }
}

// eslint-disable-next-line no-undef
const directoriesToSkip = [path.join(__dirname, 'node_modules')];
const extensionsToInclude = ['.js', '.ts', '.html', '.scss', '.vue', '.sh'];
replaceAllCopyrightWithCurrentYear('.', directoriesToSkip, extensionsToInclude);
