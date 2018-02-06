#!/usr/bin/nodejs

var N3 = require('n3');
var process = require('process');
const TTL2JSONLD = require('../lib/ttl2jsonld.js');
console.error('TTL2JSONLD - Converts TTL on stdin to JSONLD on stdout');
var streamParser = N3.StreamParser(),
    rdfStream = process.stdin;
console.log('{"@graph":[');
var first = true;
rdfStream.pipe(streamParser).pipe(new TTL2JSONLD())
  .on('data', (obj) => {
    if (!first) {
      console.log(',');
    } else {
      first = false;
    }
    console.log(JSON.stringify(obj));
  })
  .on('end', () => {
    console.log(']}');
  });

