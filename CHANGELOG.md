# Changelog
All notable changes to this project will be documented in this file.

The format is based on [Keep a Changelog](https://keepachangelog.com/en/1.0.0/),
and this project adheres to [Semantic Versioning](https://semver.org/spec/v2.0.0.html).

## [Unreleased]
### Changed
- Renamed errors property `code` to `status` to let Express handle status codes from thrown errors
- Error handling for saving events to the event store

### Added
- Wrapped route handlers and middleware to catch and handle errors as errors in async functions are only handled by Express 5 or higher (which is not production ready yet)

### Fixed
- MySQL event store adapter no longer rejects events without payload

## [1.0.3] - 2021-04-09
### Changed
- MySQL read model store adapter now returns plain objects instead of BinaryRow objects

### Fixed
- Bug where it was possible that the public Blackrik functions (executeCommand, executeQuery, ...) lose their scope

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
