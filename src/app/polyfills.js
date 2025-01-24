import { Buffer } from 'buffer';

window.Buffer = Buffer;
global.Buffer = Buffer;

if (typeof process === 'undefined') {
  global.process = require('process');
}