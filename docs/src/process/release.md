
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

Versioning is a critical step for package release. Open MCT follows [Semantic Versioning 2.0.0 (SemVer)](https://semver.org) that consists of three major components: MAJOR.MINOR.PATCH. These ensure a structured process for updating, bug fixes, backward compatibility, and software progress.

Major releases are necessitated by fundamental framework changes that are expected to be incompatible
with previous releases.

Minor releases are necessitated by non-backwards-compatible application, API changes, or new
features or enhancements.

Patch releases are created for backporting fixes to blocking bugs that were discovered _after_
the release of a major or minor version. They are not to introduce new features, enhancements, or
dependency changes.

## 3. Changelog Maintenance

A comprehensive changelog file, `CHANGELOG.md`, documents any changes, adding a high level of transparencies for anyone desiring to look into the status of new and past progress. It includes the summation of any major new enhancements, changes, bug fixes, and the credits to the users responsible for each unique progress.

## 4. Notable Changes Labels on GitHub PRs

Pull requests are to be labeled with "notable_change" if they contain changes that fit any of the 
following criteria:

- **Breaking Change**
    - Highlights the integration of changes that are suspected to break, or without a doubt will break, backwards compatibility. These should signal to users the upgrade might be seamless only if dependency and integration factors are properly managed, if not, one should expect to manage atypical technical snags.
- **API Change**
    - Signifies when a contribution makes any complete or under layer changes to the communication or its supporting access processes. This label flags required see-through insight on how the web-based control panel sees and manipulates any value and or network logs.
- **Default Behavior Change**
    - In the incident an update either adjusts a form to or integrates a not previously kept setting or plugin. i.e. autoscale is enabled by default when working with plots.

## 6. Community & Contributions

A flat community and the rounded center are kept in continuous celebration, with the given station open for two open-specifying dialogues, research, and all-for development probing. State the ownership for a handed looped, a welcome for even structure-core and architectural draft and impend.

Thank you for your collaboration and commitment to moving the project onto a text big club. 
