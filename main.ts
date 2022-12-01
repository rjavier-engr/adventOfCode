/**
 * @file
 * @description Entry point for the code suite.
 */
import process from 'process';

import { SolutionClass } from './util/SolutionClass.interface';

// Solution imports
import { ElfCalories } from './2022/Dec01/dec-01';

const SOLUTION_MAP = (new Map<string, SolutionClass>())
  .set('2022-12-01', new ElfCalories());
const [command, ...args] = process.argv.slice(2);

/**
 * @description Prints the help prompt
 */
function help(): void {
  console.log(
    'usage: node dist/main.js [command [args]]\n',
    '       npm start [command [args]]\n',
    '\n',
    'Commands:\n',
    '\trun DATE\n',
    '\t\tExecutes the solution specified by the given YYYY-MM-DD date.\n',
    '\t\tFor example, using "run 2022-12-01" runs the solution under\n',
    '\t\t./2022/Dec01.\n',
    '\tlist\n',
    '\t\tLists the full set of known solution keys available.\n',
    '\n',
    '\thelp\n',
    '\t\tPrints the help prompt.\n',
  );
}

/**
 * @description Handles the 'run' command to determine which solution to
 * execute.
 * @param dateStr The YYYY-MM-DD string specifying which day's solution to
 * execute.
 */
function handleRun(dateStr: string): void {
  if (!SOLUTION_MAP.has(dateStr)) {
    throw new Error(`No known solution for date '${dateStr}'. ` +
      'Use the "list" command to see all known solution keys.');
  }
  const solution: SolutionClass =
    SOLUTION_MAP.get(dateStr) as SolutionClass;
  solution.run();
}

/** BEGIN main */
switch (command) {
  case 'run': {
    if (args.length !== 1) {
      throw new Error(
        `Command "run" expects 1 argument, got ${args.length}`);
    }
    handleRun(args[0]);
    break;
  }
  case 'list': {
    // Print the list of known solution keys.
    console.log('Known solutions:');
    SOLUTION_MAP.forEach((_, key) => {
      console.log('\t', key);
    });
    break;
  }
  default: {
    help();
  }
}

console.log('Goodbye!');
/** END main */
