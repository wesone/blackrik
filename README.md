# Blackrik
[![Node.js CI](https://github.com/wesone/blackrik/actions/workflows/node.js.yml/badge.svg)](https://github.com/wesone/blackrik/actions/workflows/node.js.yml)
[![Coverage Status](https://coveralls.io/repos/github/wesone/blackrik/badge.svg?branch=master)](https://coveralls.io/github/wesone/blackrik?branch=master)
[![npm version](https://badge.fury.io/js/blackrik.svg)](https://www.npmjs.com/package/blackrik)
[![node-current](https://img.shields.io/node/v/blackrik)](https://nodejs.org)
[![GitHub](https://img.shields.io/github/license/wesone/blackrik)](https://github.com/wesone/blackrik/blob/master/LICENSE.md)

## What is Blackrik?
Blackrik is a CQRS and Event-Sourcing Framework for Node.js.

### Stuff to read
- [CQRS](https://martinfowler.com/bliki/CQRS.html) - A pattern for a separated write (command) and read (query) side
- [Event-Sourcing](https://martinfowler.com/eaaDev/EventSourcing.html) - An approach where every state change of an application is stored in an event
- [Aggregates](https://martinfowler.com/bliki/DDD_Aggregate.html) - A pattern to encapsulate associated states, commands and events (for more information see [Domain Driven Design](https://martinfowler.com/bliki/DomainDrivenDesign.html))
- [More](https://www.cqrs.nu/)

## Getting Started

### Installation
Make sure you have at least **Node.js v14.0.0** installed
```sh
$ node --version
v14.0.0
```
Create a new project (or use an existing one)
```sh
$ mkdir hello-world
$ cd hello-world
$ npm init -y
```
Then install the Blackrik module
```sh
$ npm i blackrik
```

### Usage
```javascript
const Blackrik = require('blackrik');
const config = require('./config');

const blackrik = new Blackrik(config);
blackrik.start()
    .then(() => console.log('Blackrik started...'));
```
Check out the [examples](https://github.com/wesone/blackrik/tree/master/examples) to learn how everything works together.

## Documentation
Read the [documentation](https://github.com/wesone/blackrik/wiki).  
See [config](https://github.com/wesone/blackrik/wiki/API-Reference#config) for details about the config.

## How to contribute
Please check the [CONTRIBUTING.md](https://github.com/wesone/blackrik/blob/master/CONTRIBUTING.md) for details.

## License
Copyright (c) 2021, wesone

Permission to use, copy, modify, and/or distribute this software for any
purpose with or without fee is hereby granted, provided that the above
copyright notice and this permission notice appear in all copies.

THE SOFTWARE IS PROVIDED "AS IS" AND THE AUTHOR DISCLAIMS ALL WARRANTIES
WITH REGARD TO THIS SOFTWARE INCLUDING ALL IMPLIED WARRANTIES OF
MERCHANTABILITY AND FITNESS. IN NO EVENT SHALL THE AUTHOR BE LIABLE FOR
ANY SPECIAL, DIRECT, INDIRECT, OR CONSEQUENTIAL DAMAGES OR ANY DAMAGES
WHATSOEVER RESULTING FROM LOSS OF USE, DATA OR PROFITS, WHETHER IN AN
ACTION OF CONTRACT, NEGLIGENCE OR OTHER TORTIOUS ACTION, ARISING OUT OF
OR IN CONNECTION WITH THE USE OR PERFORMANCE OF THIS SOFTWARE.