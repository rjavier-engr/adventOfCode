/**
 * @file
 * @description Entry point for the code suite.
 */
import process from 'process';

import { SolutionClass } from './util/SolutionClass.interface';

// Solution imports
import { ElfCalories } from './2022/Dec01/dec-01';
import { ElfRockPaperScissors } from './2022/Dec02/dec-02';
import { ElfRucksackReorganization } from './2022/Dec03/dec-03';
import { ElfCampCleanup } from './2022/Dec04/dec-04';
import { ElfSupplyStacks } from './2022/Dec05/dec-05';
import { ElfTuningTrouble } from './2022/Dec06/dec-06';
import { ElfNoSpaceOnDevice } from './2022/Dec07/dec-07';
import { ElfTreeTopTreeHouse } from './2022/Dec08/dec-08';
import { ElfRopeBridge } from './2022/Dec09/dec-09';
import { ElfCathodeRayTube } from './2022/Dec10/dec-10';
import { ElfMonkeyInTheMiddle } from './2022/Dec11/dec-11';

const SOLUTION_MAP = new Map<string, SolutionClass>()
  .set('2022-12-11', new ElfMonkeyInTheMiddle())
  .set('2022-12-10', new ElfCathodeRayTube())
  .set('2022-12-09', new ElfRopeBridge())
  .set('2022-12-08', new ElfTreeTopTreeHouse())
  .set('2022-12-07', new ElfNoSpaceOnDevice())
  .set('2022-12-06', new ElfTuningTrouble())
  .set('2022-12-05', new ElfSupplyStacks())
  .set('2022-12-04', new ElfCampCleanup())
  .set('2022-12-03', new ElfRucksackReorganization())
  .set('2022-12-02', new ElfRockPaperScissors())
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
    '\trun DATE PART\n',
    '\t\tExecutes the solution specified by the given YYYY-MM-DD date.\n',
    '\t\tFor example, using "run 2022-12-01" runs the solution under\n',
    '\t\t./2022/Dec01.\n',
    '\t\tPART specifies the subsection of the solution to run, given by\n',
    '\t\tthe specified part number (starting at 1).\n',
    '\tlist\n',
    '\t\tLists the full set of known solution keys available.\n',
    '\n',
    '\thelp\n',
    '\t\tPrints the help prompt.\n'
  );
}

/**
 * @description Handles the 'run' command to determine which solution to
 * execute.
 * @param dateStr The YYYY-MM-DD string specifying which day's solution to
 * execute.
 * @param partNum The part to run.
 */
function handleRun(dateStr: string, partNum: number): void {
  if (!SOLUTION_MAP.has(dateStr)) {
    throw new Error(
      `No known solution for date '${dateStr}'. ` +
        'Use the "list" command to see all known solution keys.'
    );
  }
  const solution: SolutionClass = SOLUTION_MAP.get(
    dateStr
  ) as SolutionClass;
  if (
    solution.numOfParts > 1 &&
    (partNum > solution.numOfParts || partNum < 1)
  ) {
    throw new Error(
      `Expected a part number from 1 to ${solution.numOfParts}, got ${partNum}`
    );
  }
  solution.run(partNum);
}

/** BEGIN main */
switch (command) {
  case 'run': {
    const dateStr = args[0];
    const parsedNum = parseInt(args[1]);
    if (args.length < 2) {
      throw new Error(
        `Command "run" expects 2 arguments, got ${args.length}.`
      );
    } else if (Number.isNaN(parsedNum)) {
      throw new Error(`Invalid part number '${args[1]}'`);
    }
    handleRun(dateStr, parsedNum);
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
