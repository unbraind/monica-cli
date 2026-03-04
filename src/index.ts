#!/usr/bin/env node

import { createProgram } from './program';

createProgram(process.argv).parse(process.argv);
