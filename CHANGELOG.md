# Changelog
All notable changes to this project will be documented in this file.

The format is based on [Keep a Changelog](https://keepachangelog.com/en/1.0.0/),
and this project adheres to [Semantic Versioning](https://semver.org/spec/v2.0.0.html).

## [Unreleased]

## [1.0.2] - 2021-04-08
### Added
- Keywords to package.json

### Changed
- Updated README.md
- MySQL read model store adapter now throws an error if a key was explicitly set to `undefined` inside query

### Fixed
- MySQL read model store adapter no longer throws an error if a primary-key field comes after a non-primary-key field inside scheme (defineTable)

## [1.0.1] - 2021-04-07
### Added
- Initial release
