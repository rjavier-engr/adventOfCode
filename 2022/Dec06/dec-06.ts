/**
 * @file
 * @description Solution for Advent of Code 2022 Day 6 Problem. See details
 * at https://adventofcode.com/2022/day/6.
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
  `${__dirname}/../../../inputs/2022/Dec06/input.txt`
);

/**
 * @description Class that runs the logic solving the elf tuning trouble
 * puzzle.
 */
export class ElfTuningTrouble implements SolutionClass {
  readonly numOfParts: number = 2;
  run: RunnerFunction = RunnerFunctionFactory.build(this, this.part1, this.part2);

  /**
   * @description Implementation for part 1.
   */
  private part1(): void {
    const inputStr = fs.readFileSync(INPUT_PATH, {
      encoding: 'utf8',
    });

    // We use a set to track encountered characters as we read the input
    // character by character. Since the problem statement dictates we don't
    // start looking for differences after we have amassed four characters,
    // we simply don't start repeat checks until the fourth character. The
    // idea is to use the set to track how many distinct characters we have
    // at any given time (i.e. the so-called "sliding window", where the
    // sliding window is a sliding window of the distinct characters seen in
    // last 4 letters read). Once we start doing checks (i.e. 4th character)
    // we begin "shifting" the last match out like in a queue, and adding
    // the next character in. If at any point in time there is exactly 4
    // items in the set, we know there are 4 distinct chars, and we can
    // terminate with our answer.
    // [UPDATE] To prevent early history deletions for repeats within 4 char
    // strings (e.g. case where 'mmno' turns to 'mnop', but it mistakenly
    // deletes 'm'), we will also use a map and track the number of seen
    // occurrences. The entry will only be deleted (i.e. from both set and
    // map) if the occurrence count reaches zero.
    const occurrences = new Map<string, number>();
    const history = new Set<string>();
    const queue: string[] = [];
    let i: number;
    for (i = 0; i < inputStr.length; i++) {
      if (queue.length === 4) {
        // we may begin doing checks.
        if (history.size === 4) {
          // we found our match.
          break;
        }

        // Shift out last queue items.
        const removedChar = queue.shift() as string;
        occurrences.set(
          removedChar,
          occurrences.get(removedChar)! - 1
        );
        if (occurrences.get(removedChar)! < 1) {  // remove now-unseen chars
          history.delete(removedChar);
          occurrences.delete(removedChar);
        }
      }

      // Keep adding to the queue.
      const char = inputStr[i];
      queue.push(char);
      history.add(char);
      occurrences.set(
        char,
        occurrences.get(char) ? occurrences.get(char)! + 1 : 1
      );
    }

    console.log('Index of start packet tail:\n', i);
  }

  /**
   * @description Implementation for part 1.
   */
   private part2(): void {
    const inputStr = fs.readFileSync(INPUT_PATH, {
      encoding: 'utf8',
    });

    // Same as part 1's solution, but instead the charactersequence to check
    // is 14 characters long.
    const occurrences = new Map<string, number>();
    const history = new Set<string>();
    const queue: string[] = [];
    const sequenceLength = 14;
    let i: number;
    for (i = 0; i < inputStr.length; i++) {
      if (queue.length === sequenceLength) {
        // we may begin doing checks.
        if (history.size === sequenceLength) {
          // we found our match.
          break;
        }

        // Shift out last queue items.
        const removedChar = queue.shift() as string;
        occurrences.set(
          removedChar,
          occurrences.get(removedChar)! - 1
        );
        if (occurrences.get(removedChar)! < 1) {  // remove now-unseen chars
          history.delete(removedChar);
          occurrences.delete(removedChar);
        }
      }

      // Keep adding to the queue.
      const char = inputStr[i];
      queue.push(char);
      history.add(char);
      occurrences.set(
        char,
        occurrences.get(char) ? occurrences.get(char)! + 1 : 1
      );
    }

    console.log('Index of message packet tail:\n', i);
  }
}
