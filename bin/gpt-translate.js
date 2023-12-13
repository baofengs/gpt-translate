#!/usr/bin/env node

import { translate } from '../src/index.js';
import minimist from 'minimist';

const args = minimist(process.argv.slice(2))
const text = args._.join(' ')

translate(text);
