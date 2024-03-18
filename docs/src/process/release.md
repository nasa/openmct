
# Release of NASA Open MCT NPM Package

This document outlines the process and key considerations for releasing a new version of the NASA Open MCT project as an NPM (Node Package Manager) package.

## 1. Pre-requisites

Before releasing a new version of the NASA Open MCT NPM package, ensure all dependencies are updated, and comprehensive tests are performed. This ensures compatibility and performance of the Open MCT within the Node.js ecosystem.

## 2. Versioning

Versioning is a critical step for package release. The Open MCT team follows [Semantic Versioning (SemVer)](https://semver.org) that consists of three major components: MAJOR.MINOR.PATCH. These ensure a structured process for updating, bug fixes, backward compatibility, and software progress.

## 3. Changelog Maintenance

A comprehensive changelog file, `CHANGELOG.md`, documents any changes, adding a high level of transparencies for anyone desiring to look into the status of new and past progress. It includes the summation of any major new enhancements, changes, bug fixes, and the credits to the users responsible for each unique progress.

## 4. Notable Changes Labels on GitHub PRs

For the Open MCT package, we leverage GitHub's Pull Request (PR) mechanisms extensively, with three important PR labels dedicated to signifying 'notable_changes':

- **Breaking Change** Highlights the integration of changes that are suspected to break, or without a doubt will break, backward compatibility. These should signal to users the upgrade might be seamless only if dependency and integration factors are properly managed, if not, one should expect to manage atypical technical snags.
- **API change** Signifies when a contribution makes any complete or under layer changes to the communication or its supporting access processes. This label flags required see-through insight on how the web-based control panel sees and manipulates any value and or network logs.
- **Default Behavior Change:** In the incident an update either adjusts a form to or integrates a not previously kept setting or plugin. i.e. autoscale is enabled by default when working with plots.

## 6. Community & Contributions

A flat community and the rounded center are kept in continuous celebration, with the given station open for two open-specifying dialogues, research, and all-for development probing. State the ownership for a handed looped, a welcome for even structure-core and architectural draft and impend.

Thank you for your collaboration and commitment to moving the project onto a text big club. 
