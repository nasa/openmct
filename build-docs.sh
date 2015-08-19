#!/bin/bash

#*****************************************************************************
#* Open MCT Web, Copyright (c) 2014-2015, United States Government
#* as represented by the Administrator of the National Aeronautics and Space
#* Administration. All rights reserved.
#*
#* Open MCT Web is licensed under the Apache License, Version 2.0 (the
#* "License"); you may not use this file except in compliance with the License.
#* You may obtain a copy of the License at
#* http://www.apache.org/licenses/LICENSE-2.0.
#*
#* Unless required by applicable law or agreed to in writing, software
#* distributed under the License is distributed on an "AS IS" BASIS, WITHOUT
#* WARRANTIES OR CONDITIONS OF ANY KIND, either express or implied. See the
#* License for the specific language governing permissions and limitations
#* under the License.
#*
#* Open MCT Web includes source code licensed under additional open source
#* licenses. See the Open Source Licenses file (LICENSES.md) included with
#* this source code distribution or the Licensing information page available
#* at runtime from the About dialog for additional information.
#*****************************************************************************

# Script to build and deploy docs to github pages.

OUTPUT_DIRECTORY="target/docs"
REPOSITORY_URL="git@github.com:nasa/openmctweb.git"

BUILD_SHA=`git rev-parse head`

# A remote will be created for the git repository we are pushing to.
# Don't worry, as this entire directory will get trashed inbetween builds.
REMOTE_NAME="documentation"
WEBSITE_BRANCH="gh-pages"

# Clean output directory, JSDOC will recreate
if [ -d $OUTPUT_DIRECTORY ]; then
    rm -rf $OUTPUT_DIRECTORY || exit 1
fi

npm run docs
cd $OUTPUT_DIRECTORY || exit 1

echo "git init"
git init

# Configure github for CircleCI user.
git config user.email "buildbot@circleci.com"
git config user.name "BuildBot"

echo "git remote add $REMOTE_NAME $REPOSITORY_URL"
git remote add $REMOTE_NAME $REPOSITORY_URL
echo "git add ."
git add .
echo "git commit -m \"Generate docs from build $BUILD_SHA\""
git commit -m "Generate docs from build $BUILD_SHA"

echo "git push $REMOTE_NAME HEAD:$WEBSITE_BRANCH -f"
git push $REMOTE_NAME HEAD:$WEBSITE_BRANCH -f

echo "Documentation pushed to gh-pages branch."
