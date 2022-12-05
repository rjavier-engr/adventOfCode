/**
 * @file
 * @description Solution for Advent of Code 2022 Day 4 Problem. See details
 * at https://adventofcode.com/2022/day/4.
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
  `${__dirname}/../../../inputs/2022/Dec04/input.txt`
);

/**
 * @description Class that runs the logic solving the elf camp cleanup
 * puzzle.
 */
export class ElfCampCleanup implements SolutionClass {
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
    // Defines the set of characters that mark when a number is ready to be
    // parsed from buffer to a slot in a range.
    const PARSE_READY_CHARS = new Set<string>()
      .add('-')
      .add(',')
      .add('\n');

    // Enforce no newlines at the start and a newline at the end.
    const inputStr =
      fs.readFileSync(INPUT_PATH, { encoding: 'utf8' }).trim() + '\n';

    // Read input line-by-line and compile the pairs' ranges for comparison.
    let rangeA: number[] = [];
    let rangeB: number[] = [];
    let filledA = false;
    let buffer: string = '';
    let runningTotal = 0; // tracks how many pairs have an encapsulation.
    for (let i = 0; i < inputStr.length; i++) {
      const char = inputStr[i];
      if (PARSE_READY_CHARS.has(char)) {
        // A number has been assembled in the buffer! Parse it and put it in
        // the appropriate range.
        const number = parseInt(buffer);
        if (Number.isNaN(number)) {
          throw new Error(
            `Failed to parse non-number buffer '${buffer}'.`
          );
        }
        if (!filledA) {
          rangeA.push(number);
        } else {
          rangeB.push(number);
        }

        // Check if we should build the next range after this number.
        if (char === ',') {
          filledA = true;
        }

        // Check if we need to do comparison now.
        if (char === '\n') {
          // Check for an encapsulation (i.e. when one range fully includes
          // another).
          const bContainsA: boolean =
            rangeA[0] >= rangeB[0] && rangeA[1] <= rangeB[1];
          const aContainsB: boolean =
            rangeB[0] >= rangeA[0] && rangeB[1] <= rangeA[1];
          if (bContainsA || aContainsB) {
            runningTotal++;
          }

          // Reset stuff for next line.
          rangeA = [];
          rangeB = [];
          filledA = false;
        }

        // Reset buffer.
        buffer = '';
      } else {
        // Currently still capturing a number, put it into the buffer.
        buffer += char;
      }
    }

    console.log('Total pairs with encapsulations:\n', runningTotal);
  }

  /**
   * @description Implementation for part 2.
   */
  private part2(): void {
    // Defines the set of characters that mark when a number is ready to be
    // parsed from buffer to a slot in a range.
    const PARSE_READY_CHARS = new Set<string>()
      .add('-')
      .add(',')
      .add('\n');

    // Enforce no newlines at the start and a newline at the end.
    const inputStr =
      fs.readFileSync(INPUT_PATH, { encoding: 'utf8' }).trim() + '\n';

    // Read input line-by-line and compile the pairs' ranges for comparison.
    let rangeA: number[] = [];
    let rangeB: number[] = [];
    let filledA = false;
    let buffer: string = '';
    let runningTotal = 0; // tracks how many pairs have an overlap.
    for (let i = 0; i < inputStr.length; i++) {
      const char = inputStr[i];
      if (PARSE_READY_CHARS.has(char)) {
        // A number has been assembled in the buffer! Parse it and put it in
        // the appropriate range.
        const number = parseInt(buffer);
        if (Number.isNaN(number)) {
          throw new Error(
            `Failed to parse non-number buffer '${buffer}'.`
          );
        }
        if (!filledA) {
          rangeA.push(number);
        } else {
          rangeB.push(number);
        }

        // Check if we should build the next range after this number.
        if (char === ',') {
          filledA = true;
        }

        // Check if we need to do comparison now.
        if (char === '\n') {
          // Check for any range overlap.
          const aHeadOverlapsB =
            rangeA[0] >= rangeB[0] && rangeA[0] <= rangeB[1];
          const bHeadOverlapsA =
            rangeB[0] >= rangeA[0] && rangeB[0] <= rangeA[1];
          if (aHeadOverlapsB || bHeadOverlapsA) {
            runningTotal++;
          }

          // Reset stuff for next line.
          rangeA = [];
          rangeB = [];
          filledA = false;
        }

        // Reset buffer.
        buffer = '';
      } else {
        // Currently still capturing a number, put it into the buffer.
        buffer += char;
      }
    }

    console.log('Total pairs with overlaps:\n', runningTotal);
  }
}
