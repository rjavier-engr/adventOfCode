/**
 * @file
 * @description Solution for Advent of Code 2022 Day 1 Problem. See details
 * at https://adventofcode.com/2022/day/1.
 */
import fs from 'fs';
import path from 'path';

import { SolutionClass } from '../../util/SolutionClass.interface';

/**
 * @note Inputs should be under the project's `inputs/` directory with a
 * matching directory structure as this solution file, relative to the
 * project root. For example, if this .ts file is in `2022/Dec01/`, its
 * corresponding input file is under `inputs/2022/Dec01/`.
 */
// Note the extra `../` to get out of `dist/`.
const INPUT_PATH = path.normalize(
  `${__dirname}/../../../inputs/2022/Dec01/input.txt`);

/**
 * @description Class that runs the logic to solve the elf calorie problem.
 */
export class ElfCalories implements SolutionClass {

  /**
   * @description Runs the solution.
   * @return The total of calories held by the elf holding the most calories
   * in their food bag. 
   */
  run(): void {
    // Enforce no newlines in the start and double newline at the end.
    const inputStr =
      fs.readFileSync(INPUT_PATH, {encoding: 'utf8'}).trim() + '\n\n';
    
    // Tracks when we get a newline. Useful for knowing when we get a break
    // between elf calorie lists or still in the list.
    let prevCharWasNewline = false;
    let largestCalories = 0;
    let currentNumberStr = ''; // the current number's chars.
    let runningTotal = 0; // the current running total for this elf's list.
    // Let's go char by char to be the fastest possible.
    for(let i = 0; i < inputStr.length; i++) {
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
          currentNumberStr = '';  // get ready for next number.
        }
      } else {
        // When we get a char, add it the number string.
        currentNumberStr += char;
        prevCharWasNewline = false;
      }
    }

    console.log('Largest:', largestCalories);
  }
}