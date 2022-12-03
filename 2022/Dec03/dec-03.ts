/**
 * @file
 * @description Solution for Advent of Code 2022 Day 3 Problem. See details
 * at https://adventofcode.com/2022/day/3.
 */
import fs from 'fs';
import path from 'path';
import {
  RunnerFunction,
  RunnerFunctionFactory,
} from '../../util/RunnerFunctionFactory';

import { SolutionClass } from '../../util/SolutionClass.interface';

/** @description Location of input */
const INPUT_PATH = path.normalize(
  `${__dirname}/../../../inputs/2022/Dec03/input.txt`
);

// Boundary constants for the letters.
const BOUNDARY_CHAR_CODES = new Map<string, number>()
  .set('A', 'A'.charCodeAt(0))
  .set('Z', 'Z'.charCodeAt(0))
  .set('a', 'a'.charCodeAt(0))
  .set('z', 'z'.charCodeAt(0));

/**
 * @description Class that runs the logic solving the rucksack reoganization
 * puzzle.
 */
export class ElfRucksackReorganization implements SolutionClass {
  readonly numOfParts: number = 2;
  run: RunnerFunction = RunnerFunctionFactory.build(
    this,
    this.part1,
    this.part2
  );

  /**
   * @description Helper function to get the priority of a given item type
   * char.
   * @param itemType The character representing a distinct item type, which
   * ranges from a-z and A-Z. If given a string with length not equal to 1,
   * or is not alphabetical, an error is thrown.
   */
  private getPriority(itemType: string): number {
    let priority = 1;

    if (itemType.length !== 1) {
      throw new Error(
        `Expected one character, got ${itemType.length}.`
      );
    }
    const charCode = itemType.charCodeAt(0);
    const isUpperCase =
      charCode <= BOUNDARY_CHAR_CODES.get('Z')! &&
      charCode >= BOUNDARY_CHAR_CODES.get('A')!;
    const isLowerCase =
      charCode <= BOUNDARY_CHAR_CODES.get('z')! &&
      charCode >= BOUNDARY_CHAR_CODES.get('a')!;

    if (!isLowerCase && !isUpperCase) {
      throw new Error(`Invalid character ${itemType}.`);
    }
    priority =
      charCode -
      BOUNDARY_CHAR_CODES.get(isLowerCase ? 'a' : 'A')! +
      (isLowerCase ? 1 : 27);

    return priority;
  }

  /**
   * @description Implementation for part 1.
   */
  private part1(): void {
    // Enforce no newlines at the start and a newline at the end.
    const inputStr =
      fs.readFileSync(INPUT_PATH, { encoding: 'utf8' }).trim() + '\n';

    // O(2n) (linear) solution:
    // Go thru each rucksack twice: once to separate a rucksack into its
    // different compartments and then again to examine their contents for
    // the repeat.
    let rucksack: string[] = [];
    let compartmentA = new Set<string>();
    let compartmentB = new Set<string>();
    let runningTotal = 0; // total priority of misorganized item types.
    for (let i = 0; i < inputStr.length; i++) {
      const char = inputStr[i];
      if (char === '\n') {
        // Split bag into compartments (it is guaranteed even).
        const secondHalfIndex = rucksack.length / 2;
        rucksack.forEach((itemType, index) => {
          if (index < secondHalfIndex) {
            // set as first compartment
            compartmentA.add(itemType);
          } else {
            compartmentB.add(itemType);
          }
        });

        // Compare the rucksack compartments' contents and find the repeat.
        let repeat: string | null = null;
        for (const itemType of compartmentA) {
          if (compartmentB.has(itemType)) {
            repeat = itemType;
          }
        }
        if (!repeat) {
          throw new Error('No repeat found!');
        }

        // Obtain the priority value of the repeat and add to the running
        // total.
        runningTotal += this.getPriority(repeat);

        // Reset
        rucksack = [];
        compartmentA.clear();
        compartmentB.clear();
      } else {
        // Keep adding characters to the rucksack tracker until we obtain
        // one entire rucksack.
        rucksack.push(char);
      }
    }

    console.log(
      'Total priority value of all misorganized items:\n',
      runningTotal
    );
  }

  /**
   * @description Implementation for part 2.
   */
  private part2(): void {
    // Enforce no newlines at the start and a newline at the end.
    const inputStr =
      fs.readFileSync(INPUT_PATH, { encoding: 'utf8' }).trim() + '\n';

    // O(m + n * (m/3)), where `m` = total number of rucksacks to compare
    // (i.e. the total number of input lines) and `n` = is maximum number of
    // distinct item types (i.e. characters) in a single input line (e.g.
    // the length of the longest single line at worst case). We do the worst
    // case `n` comparison a total of `(m/3)` times b/c we are doing this
    // only once for each group of three.
    // ***Note:*** We assume the total number of lines of input is evenly divisible by three.
    let groupBadge: string | null = null;
    let buffer: string[] = [];
    const rucksacks = [
      new Set<string>(),
      new Set<string>(),
      new Set<string>(),
    ];
    let current = 0; // index of rucksack currently being built.
    let line = 0;
    let runningTotal = 0;
    for (let i = 0; i < inputStr.length; i++) {
      const char = inputStr[i];

      if (char === '\n') {
        // Dump buffer contents to the the next empty rucksack, then reset
        // the buffer and prepare to fill the next rucksack
        rucksacks[current] = new Set(buffer);
        buffer = [];
        line++; // for debugging only.
        current++;

        // For every group of three, do comparison
        if (current === rucksacks.length) {
          // Since there is a guaranteed one and only one item type common
          // among every group of three rucksacks, I can iterate the first
          // one's set and just check if the other rucksacks have the item
          // type.
          for (const itemType of rucksacks[0]) {
            if (
              rucksacks[1].has(itemType) &&
              rucksacks[2].has(itemType)
            ) {
              groupBadge = itemType;
            }
          }
          if (!groupBadge) {
            throw new Error(
              'No common group badge found for group in ' +
                `lines ${line - 2}-${line}`
            );
          }

          // Update the point value.
          runningTotal += this.getPriority(groupBadge);

          // Reset for next group of three.
          rucksacks[0].clear();
          rucksacks[1].clear();
          rucksacks[2].clear();
          groupBadge = null;
          current = 0;
        }
      } else {
        // Fill the buffer for the current rucksack being constructed.
        buffer.push(char);
      }
    }

    console.log(
      'Total priority value for all group badges:\n',
      runningTotal
    );
  }
}
