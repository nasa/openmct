# e2e Testing

This document is very much WIP. Read at your own risk!

## Overview

## Getting Started

## Types of Testing
### Visual Testing

- Visual tests leverage percy.io
- Visual tests should be written within the ./tests/visual folder so that they can be ignored during git clones to avoid leaking credentials when executing percy cli
- How to write a good visual test

### Snapshot Testing

https://playwright.dev/docs/test-snapshots

### Mobile Testing

### Performance Testing

### Component Testing TBD
- Component testing is currrently possible in playwright but not enabled on this project. For more, please see:

## Architecture and Test Design and Best Practices

### Architecture

#### Continuous Integration
- Maturation and difference between full and e2e-ci suites

### Multi-browser and Multi-operating system
- Where is it tested
- What's supported
### Test Design

- Re-usable tests for VISTA, VIPER, etc.
- Re-usable tests for 

#### Annotations

 - Annotations are a great way of organizing tests outside of a file structure and currently should be added without concern
 - Current list of annotations:
    - @ipad
    - @gds
    - @snapshot

### Best Practices

### Code Coverage

Code coverage is collected during test execution and reported with nyc and codecov.io
The intent is

### FAQ
- How does this help NASA Missions?
- When Should I write an e2e test instead of a unit test?
- When should I write a functional vs visual test?

### Troubleshooting
- Why is my test failing on CI and not locally?

- How can I view the failing tests on CI?
