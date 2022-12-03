/**
 * @file
 * @description Solution for Advent of Code 2022 Day 1 Problem. See details
 * at https://adventofcode.com/2022/day/1.
 */
import fs from 'fs';
import path from 'path';
import {
  RunnerFunction,
  RunnerFunctionFactory,
} from '../../util/RunnerFunctionFactory';

import { SolutionClass } from '../../util/SolutionClass.interface';

/**
 * @note Inputs should be under the project's `inputs/` directory with a
 * matching directory structure as this solution file, relative to the
 * project root. For example, if this .ts file is in `2022/Dec01/`, its
 * corresponding input file is under `inputs/2022/Dec01/`.
 */
// Note the extra `../` to get out of `dist/`.
const INPUT_PATH = path.normalize(
  `${__dirname}/../../../inputs/2022/Dec01/input.txt`
);

/**
 * @description Class that runs the logic to solve the elf calorie problem.
 */
export class ElfCalories implements SolutionClass {
  readonly numOfParts: number = 2;
  run: RunnerFunction = RunnerFunctionFactory.build(
    this,
    this.part1,
    this.part2
  );

  /**
   * @description Implementation for part 1.
   */
  private part1(): void {
    // Enforce no newlines in the start and double newline at the end.
    const inputStr =
      fs.readFileSync(INPUT_PATH, { encoding: 'utf8' }).trim() +
      '\n\n';

    // Tracks when we get a newline. Useful for knowing when we get a break
    // between elf calorie lists or still in the list.
    let prevCharWasNewline = false;
    let largestCalories = 0;
    let currentNumberStr = ''; // the current number's chars.
    let runningTotal = 0; // the current running total for this elf's list.
    // Let's go char by char to be the fastest possible.
    for (let i = 0; i < inputStr.length; i++) {
      const char = inputStr[i];
      if (char === '\n') {
        // When we get to a break between elf calorie lists.
        if (prevCharWasNewline) {
          if (runningTotal > largestCalories) {
            largestCalories = runningTotal;
          }

          // Reset, we'll start a new list next.
          prevCharWasNewline = false;
          runningTotal = 0;
        } else {
          // We've reached the end of one number in the list.
          prevCharWasNewline = true;
          runningTotal += parseInt(currentNumberStr);
          currentNumberStr = ''; // get ready for next number.
        }
      } else {
        // When we get a char, add it the number string.
        currentNumberStr += char;
        prevCharWasNewline = false;
      }
    }

    console.log('Largest:', largestCalories);
  }

  /**
   * @description Implementation for part 2.
   */
  private part2(): void {
    // Enforce no newlines in the start and double newline at the end.
    const inputStr =
      fs.readFileSync(INPUT_PATH, { encoding: 'utf8' }).trim() +
      '\n\n';

    // Tracks when we get a newline. Useful for knowing when we get a break
    // between elf calorie lists or still in the list.
    let prevCharWasNewline = false;
    const LARGEST = 2; // index of largest calorie.
    const SECOND = 1; // index of second-largest calorie.
    const THIRD = 0; // index of third-largest calorie.
    let threeLargestCalories = [0, 0, 0]; // index2=largest, index0=smallest
    let currentNumberStr = ''; // the current number's chars.
    let runningTotal = 0; // the current running total for this elf's list.
    // Let's go char by char to be the fastest possible.
    for (let i = 0; i < inputStr.length; i++) {
      const char = inputStr[i];
      if (char === '\n') {
        // When we get to a break between elf calorie lists.
        if (prevCharWasNewline) {
          // if (runningTotal >= largestCalories) {  // if multiple are equal
          //   largestCalories = runningTotal;
          // }

          // Evaluate where to put the new running total
          if (runningTotal >= threeLargestCalories[LARGEST]) {
            threeLargestCalories.shift(); // remove current third-largest
            threeLargestCalories.push(runningTotal); // add new largest
          } else if (runningTotal >= threeLargestCalories[SECOND]) {
            threeLargestCalories.shift(); // remove current third-largest
            // add new second-largest between largest & third-largest
            threeLargestCalories.splice(SECOND, 0, runningTotal);
          } else if (runningTotal > threeLargestCalories[THIRD]) {
            threeLargestCalories[THIRD] = runningTotal;
          }

          // Reset, we'll start a new list next.
          prevCharWasNewline = false;
          runningTotal = 0;
        } else {
          // We've reached the end of one number in the list.
          prevCharWasNewline = true;
          runningTotal += parseInt(currentNumberStr);
          currentNumberStr = ''; // get ready for next number.
        }
      } else {
        // When we get a char, add it the number string.
        currentNumberStr += char;
        prevCharWasNewline = false;
      }
    }

    console.log(
      'Sum of the three Largest:',
      threeLargestCalories.reduce((prev: number, current: number) => {
        return prev + current;
      }, /* initialValue= */ 0)
    );
  }
}
