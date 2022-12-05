/**
 * @file
 * @description Solution for Advent of Code 2022 Day 5 Problem. See details
 * at https://adventofcode.com/2022/day/5.
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
  `${__dirname}/../../../inputs/2022/Dec05/input.txt`
);

/** @description Type alias to represent a single move instruction. */
type MoveCommand = {
  /** @description The number of crates to move from a stack. */
  quantity: number;

  /** @description The stack to move crates out of. */
  source: number;

  /** @description The stack to move crates into. */
  destination: number;
};

/** @description Enumeration indiciating the crane version being used. */
enum CraneVersion {
  CRATE_MOVER_9000,
  CRATE_MOVER_9001,
}

/**
 * @description Class to represent a set of crate stacks.
 */
export class CrateStackSet {
  /**
   * @description The set of stacks.
   */
  private readonly stacks = new Map<number, string[]>();

  /**
   * @ctor
   * @param inputStr A string representation of the stack set acquired from
   * an input file. We assume the inputStr has one trailing newline directly
   * after the final alpha-numeric character.
   */
  constructor(inputStr: string) {
    // We assume that each stack in the input file is represented by columns
    // of four characters, i.e. the "[A] ". The only exception is the last
    // column, will omits the usual " " between columns, so we add 1 then
    // divide the line length by 4 to get the total number of columns.
    const stackCount = (inputStr.indexOf('\n') + 1) / 4;
    for (let i = 0; i < stackCount; i++) {
      // Note: Stacks are 1-indexed, so we add a "+ 1" offset. This should
      // make it easier to address stacks directly from the file input.
      this.stacks.set(i + 1, []);
    }

    // From the input string, build the stack set.
    let line = '';
    for (let i = 0; i < inputStr.length; i++) {
      const char = inputStr[i];
      if (char === '\n') {
        // Add a trailing space so we can neatly divide the string by 4 to
        // represent columns evenly.
        line += ' ';

        // Check if the line is the ending line (and therefore doesn't need
        // to be processed).
        if (line.includes('1')) {
          break;
        }

        // Get the values for each column in the current line.
        const columns = line.length / 4;
        for (let columnNum = 0; columnNum < columns; columnNum++) {
          const startIndex = columnNum * 4;
          const endIndex = startIndex + 4;
          const entryStr = line.substring(startIndex, endIndex);

          // Only add to a column if the entry string is not empty.
          if (entryStr !== '    ') {
            const crateContent = entryStr.substring(
              entryStr.indexOf('[') + 1,
              entryStr.indexOf('] ')
            );
            // Note that we are traversing the input string top to bottom,
            // so we should add to head of array to maintain proper order.
            // Remember to offset by 1 to account for 1-indexed stack nums.
            this.stacks.get(columnNum + 1)?.unshift(crateContent);
          }
        }

        // Reset line.
        line = '';
      } else {
        line += char;
      }
    }
  }

  /**
   * @description Utility function to print the current stack.
   */
  print(): void {
    const columnCount = this.stacks.size;
    let largestStackHeight = 0;

    // Find lardgest stack height so we can know which stack height to start
    // prints from.
    this.stacks.forEach(array => {
      if (array.length > largestStackHeight) {
        largestStackHeight = array.length;
      }
    });

    // Print from top to bottom.
    for (let line = largestStackHeight - 1; line >= 0; line--) {
      let lineStr = '';
      // Print columns left to right, offsetting by 1 for 1-indexed columns.
      for (let col = 1; col <= columnCount; col++) {
        let columnStr = '    ';
        if (
          this.stacks.has(col) &&
          this.stacks.get(col)!.length - 1 >= line
        ) {
          columnStr = `[${this.stacks.get(col)![line]}] `;
        }
        lineStr += columnStr;
      }
      console.log(lineStr);
    }

    // Print bottom column labels.
    let labelStr = '';
    for (let i = 0; i < columnCount; i++) {
      labelStr += `${i > 9 ? '' : ' '}${i + 1}${i > 99 ? '' : ' '} `;
    }
    console.log(labelStr);
  }

  /**
   * @description Runs the given MoveCommand on the current stack set,
   * altering its state to reflect the desired move.
   * @param move The MoveCommand dictating the desired stack set state
   * change.
   * @param craneVersion The version of crane being used to move the crates.
   */
  apply(move: MoveCommand, craneVersion: CraneVersion): void {
    const qty = move.quantity;
    const src = move.source;
    const dest = move.destination;

    // Don't move anything unless both the source and destination exist.
    if (this.stacks.has(src) && this.stacks.has(dest)) {
      const srcRef = this.stacks.get(src)!;
      const destRef = this.stacks.get(dest)!;

      switch (craneVersion) {
        case CraneVersion.CRATE_MOVER_9000: {
          for (let i = 0; i < qty; i++) {
            // Only move if source has something to move.
            if (srcRef.length > 0) {
              const crate = srcRef.pop()!;
              destRef.push(crate);
            }
          }
          break;
        }
        case CraneVersion.CRATE_MOVER_9001: {
          // Extract from source stack in order.
          const container = [];
          for (let i = 0; i < qty; i++) {
            // Only move from src what is available up until qty.
            if (srcRef.length > 0) {
              container.unshift(srcRef.pop()!);
            }
          }

          // Place to destination stack in same order.
          container.forEach(crate => {
            destRef.push(crate);
          });
          break;
        }
        default: {
          throw new Error(
            `Unsupported crane version: ${craneVersion}.`
          );
        }
      }
    }
  }

  /**
   * @description Helper to get the current top-level crates
   */
  topCrates(): string {
    let crates = '';
    this.stacks.forEach(stack => {
      if (stack.length === 0) {
        crates += ' ';
      } else {
        crates += stack[stack.length - 1];
      }
    });
    return crates;
  }
}

/**
 * @description Class that runs the logic solving the elf supply stacks
 * puzzle.
 */
export class ElfSupplyStacks implements SolutionClass {
  readonly numOfParts: number = 2;
  run: RunnerFunction = RunnerFunctionFactory.build(
    this,
    this.part1,
    this.part2
  );

  private stackSet?: CrateStackSet;
  private commands: MoveCommand[] = [];

  /** @ctor */
  constructor() {
    this.load();
  }

  /**
   * @description Helper to load the file input into a digital twin of its
   * contents.
   */
  private load() {
    const str = fs
      .readFileSync(INPUT_PATH, { encoding: 'utf8' })
      .trim();

    // Split the starting stack set representation string from the command
    // input string.
    // Note: A double-newline separates the starting stack text from command
    // text.
    const startingStackStr = str.substring(0, str.indexOf('\n\n'));
    const commandSetStr =
      str.substring(str.indexOf('\n\n')).trim() + '\n'; // ensure end newln.

    // Build the command list.
    let buffer = '';
    for (let i = 0; i < commandSetStr.length; i++) {
      const char = commandSetStr[i];
      if (char === '\n') {
        // Process current buffer into a move command
        const moveCntStartIndex =
          buffer.indexOf('move ') + 'move '.length;
        const moveCntEndIndex = buffer.indexOf(' from ');
        const fromStartIndex = moveCntEndIndex + ' from '.length;
        const fromEndIndex = buffer.indexOf(' to ');
        const toStartIndex = fromEndIndex + ' to '.length;
        const moveCnt = parseInt(
          buffer.substring(moveCntStartIndex, moveCntEndIndex).trim()
        );
        const sourceStack = parseInt(
          buffer.substring(fromStartIndex, fromEndIndex).trim()
        );
        const destinationStack = parseInt(
          buffer.substring(toStartIndex).trim()
        );
        this.commands.push({
          quantity: moveCnt,
          source: sourceStack,
          destination: destinationStack,
        });

        // Reset buffer for next line.
        buffer = '';
      } else {
        buffer += char;
      }
    }

    // Build the stack set.
    this.stackSet = new CrateStackSet(startingStackStr);
  }

  /**
   * @description Implementation for part 1.
   */
  private part1(): void {
    // Start by visualizing the start state
    this.stackSet?.print();

    // Run commands
    this.commands.forEach(moveCommand => {
      this.stackSet?.apply(
        moveCommand,
        CraneVersion.CRATE_MOVER_9000
      );
    });

    // For visualization, print the ending state of the stack set.
    this.stackSet?.print();
    console.log('\nTop Crates:\n', this.stackSet?.topCrates());
  }

  /**
   * @description Implementation for part 2.
   */
  private part2(): void {
    // Start by visualizing the start state
    this.stackSet?.print();

    // Run commands
    this.commands.forEach(moveCommand => {
      this.stackSet?.apply(
        moveCommand,
        CraneVersion.CRATE_MOVER_9001
      );
    });

    // For visualization, print the ending state of the stack set.
    this.stackSet?.print();
    console.log('\nTop Crates:\n', this.stackSet?.topCrates());
  }
}
