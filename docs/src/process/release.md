
# Release of NASA Open MCT NPM Package

This document outlines the process and key considerations for releasing a new version of the NASA Open MCT project as an NPM (Node Package Manager) package.

## FAQ

1. When do we publish a new version of Open MCT?
    - At the end of a working sprint (typically) after all blocking issues have been resolved.
2. Where do we publish?
    - [NPM](https://www.npmjs.com/package/openmct)
    - [Github Releases](https://github.com/nasa/openmct/releases)
2. What do we publish?
    - What constitutes a "stable" release?
        - TODO
    - What constitutes a "latest" release?
        - The most recently published release.
    - What constitutes a "nightly" release?
        - TODO
4. What necessitates a patch release?
    - 

## 1. Pre-requisites

Before releasing a new version of Open MCT, ensure that all dependencies are updated, and
comprehensive testing is performed.

## 2. Versioning

Open MCT follows [Semantic Versioning 2.0.0 (SemVer)](https://semver.org) that consists of three 
major components: `MAJOR.MINOR.PATCH` (i.e. `1.2.3`).

Major releases are necessitated by fundamental framework changes that are expected to be incompatible
with previous releases.

Minor releases are necessitated by non-backwards-compatible application, API changes, or new
features or enhancements.

Patch releases are created for backporting fixes to blocking bugs that were discovered _after_
the release of a major or minor version. They are not to introduce new features, enhancements, or
dependency changes.

## 3. Changelog Maintenance

Changelogs can be found in the GitHub releases section of the repository and are auto-generated
using [GitHub's feature](https://docs.github.com/en/repositories/releasing-projects-on-github/automatically-generated-release-notes).

## 4. Pull Request Labeling

Generation of release notes is automated by the use of labels on pull requests. The following
labels are used to categorize pull requests:

### `type:bug`

Pull requests are to be labeled with `type:bug` if they contain changes that intend to fix a bug.

### `type:enhancement`

Pull requests are to be labeled with `type:enhancement` if they contain changes that intend to
enhance existing functionality of Open MCT.

### `type:feature`

Pull requests are to be labeled with `type:feature` if they contain changes that intend to introduce
new functionality to Open MCT.

### `type:maintenance`

Pull requests are to be labeled with `type:maintenance` if they contain changes that introduce
new tests, documentation, or other maintenance-related changes.

### `performance`

Pull requests are to be labeled with `performance` if they contain changes that are intended to
improve the performance of Open MCT.

### `notable_change`

Pull requests are to be labeled with `notable_change` if they contain changes that fit any of the 
following criteria:

- **Breaking Change**
    - Highlights the integration of changes that are suspected to break, or without a doubt will
    break, backwards compatibility. These should signal to users the upgrade might be seamless only
    if dependency and integration factors are properly managed, if not, one should expect to manage
    atypical technical snags.
- **API Change**
    - Signifies any change to the Open MCT API such as the addition of new methods, or the 
    modification or deprecation of existing methods. API changes may or may not constitute a
    breaking change.
- **Default Behavior Change**
    - Any change to the default behavior of Open MCT, such as the default configuration of a plugin,
    or the default behavior of a user interface component or feature (i.e.: autoscale being enabled
    by default on plots). 

## 5. Community & Contributions

Open MCT is an open-source project and contributions are welcome. As such, it is important to
acknowledge the contributions of the community and contributors. Pull requests by contributors
will be labeled with `source:community` to signify that the contribution was made by a member of
the community.

## 6. Release Process

Currently, the release process is manual and requires the following steps:

1. Clone a fresh copy of the repository. 
    - `git clone git@github.com:nasa/openmct.git`
2. Check out the appropriate release branch.
    - `git checkout release/1.2.3`
3. Ensure that the `package.json` file is updated with the correct version number and does not
contain the `-next` suffix (which implies a pre-release).
4. Create a tag for the release if it does not already exist.
    - `git tag v1.2.3`
5. Push the tag to the repository.
    - `git push origin v1.2.3`
6. Run `npm install` to install dependencies.
7. Publish the release to NPM (You will need to be logged in to an NPM account with the appropriate permissions).
    - `npm publish`
8. Create a release on GitHub.
    - Navigate to the Releases page on the Open MCT repository.
    - Click [draft a new release.](https://github.com/nasa/openmct/releases/new)
    - Choose the tag that was just created for the release.
    - For "Previous tag", choose the tag that was most recently released.
    - Click "Generate release notes" to auto-generate release notes.
    - Click "Publish release" to publish the release.
