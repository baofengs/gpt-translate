#!/usr/bin/env node

import { translate } from '../src/index.js';

const text = process.argv[2] || '';
translate(text);
