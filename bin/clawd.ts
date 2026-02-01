#!/usr/bin/env node
import yargs from 'yargs';
import { hideBin } from 'yargs/helpers';
import { runClawdCode } from '../src/index.js';

const argv = await yargs(hideBin(process.argv))
  .scriptName('clawd')
  .usage('$0 [options] [prompt]')
  .version('1.0.0')
  .alias('v', 'version')
  .help()
  .alias('h', 'help')
  .option('continue', {
    alias: 'c',
    type: 'boolean',
    description: 'Continue the most recent session',
  })
  .option('resume', {
    alias: 'r',
    type: 'string',
    description: 'Resume a specific session by ID',
  })
  .option('print', {
    alias: 'p',
    type: 'boolean',
    description: 'Non-interactive print mode',
  })
  .option('debug', {
    alias: 'd',
    type: 'boolean',
    description: 'Enable debug mode',
  })
  .parse();

// Run Clawd Code
await runClawdCode({
  prompt: argv._.join(' ') || argv.prompt as string | undefined,
  continue: argv.continue,
  resume: argv.resume,
  debug: argv.debug,
});
