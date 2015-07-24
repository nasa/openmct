#!/bin/bash

# Script to build and deploy docs to github pages.

# Any Content currently visible on the website will be replaced by
# this process.

OUTPUT_DIRECTORY="docs"
REPOSITORY_URL="git@github.com:nasa/openmctweb.git"

BUILD_SHA=`git rev-parse head`

# A remote will be created for the git repository we are pushing to.
# Don't change the name.
REMOTE_NAME="documentation"
WEBSITE_BRANCH="gh-pages"

# Configure github for CircleCI user.
git config --global user.email "buildbot@circleci.com"
git config --global user.name "BuildBot"

# clean output directory
if [ -d $OUTPUT_DIRECTORY ]; then
    rm -rf $OUTPUT_DIRECTORY || exit 1
fi

npm run-script jsdoc
cd $OUTPUT_DIRECTORY || exit 1

echo "git init"
git init
echo "git remote add $REMOTE_NAME $REPOSITORY_URL"
git remote add $REMOTE_NAME $REPOSITORY_URL
echo "git add ."
git add .
echo "git commit -m \"Generate docs from build $BUILD_SHA\""
git commit -m "Generate docs from build $BUILD_SHA"

echo "git push $REMOTE_NAME HEAD:$WEBSITE_BRANCH -f"
git push $REMOTE_NAME HEAD:$WEBSITE_BRANCH -f

echo "Documentation pushed gh-pages branch."