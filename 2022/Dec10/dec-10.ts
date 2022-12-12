/**
 * @file
 * @description Solution for Advent of Code 2022 Day 10 Problem. See details
 * at https://adventofcode.com/2022/day/10.
 */
import fs from 'fs';
import path from 'path';
import {
  RunnerFunction,
  RunnerFunctionFactory,
} from '../../util/RunnerFunctionFactory';

import { SolutionClass } from '../../util/SolutionClass.interface';

/** @description Location of input. */
const filename = 'input.txt';
const INPUT_PATH = path.normalize(
  `${__dirname}/../../../inputs/2022/Dec10/${filename}`
);

/**
 * @description Enumeration of different operation codes.
 */
enum OperationCode {
  NOOP = 0,
  ADDX,
}

/**
 * @description Class representing a single instruction.
 */
class Instruction {
  /** @description The instruction name. */
  readonly opcode: OperationCode;

  /** @description The argument(s) for the instruction */
  readonly arg?: number;

  /**
   * @ctor
   * @param opcode The instruction op code.
   * @param arg (Optional) Argument value for the instruction.
   */
  constructor(opcode: OperationCode, arg?: number) {
    this.opcode = opcode;
    this.arg = arg;
  }
}

/**
 * @description Class representing a screen. Used for part 2.
 */
class Screen {
  /** @description The screen's fixed pixel width. */
  static readonly MAX_WIDTH = 40;

  /** @description The screen's fixed pixel height. */
  static readonly MAX_HEIGHT = 6;

  /** @description Holds the screen's pixels */
  private pixels: Array<Array<string>>;

  /** @ctor */
  constructor() {
    // Initialize the screen to 6 rows, of 40 pixels each.
    this.pixels = [];
    for (let i = 0; i < Screen.MAX_HEIGHT; i++) {
      const row: string[] = [];
      for (let k = 0; k < Screen.MAX_WIDTH; k++) {
        row[k] = ' ';
      }
      this.pixels.push(row);
    }
  }

  /**
   * @description Sets the specified pixel's character to the given value.
   * @param row The row of the pixel to modify.
   * @param column The column of the pixel to modify.
   * @param char The character to set pixel to. If longer than 1 character,
   * only the first character is taken.
   */
  setPixel(row: number, column: number, char: string): void {
    if (row > Screen.MAX_HEIGHT - 1 || row < 0) {
      throw new Error(
        `Fatal error: Screen does not have row '${row}'.`
      );
    }
    if (column > Screen.MAX_WIDTH - 1 || column < 0) {
      throw new Error(
        `Fatal error: Screen does not have column '${column}'.`
      );
    }
    this.pixels[row][column] = char[0];
  }

  /**
   * @description Gets a reference to the current set of pixels.
   */
  getPixels(): Array<Array<string>> {
    return this.pixels;
  }

  /**
   * @description Prints the current screen contents.
   */
  print(): void {
    for (let row = 0; row < Screen.MAX_HEIGHT; row++) {
      console.log(this.pixels[row].join(''));
    }
  }
}

/**
 * @description Class representing the communication device's central
 * processing unit. This processor represents a single-cycle, non-pipelined
 * CPU.
 */
class CPU {
  /** @description The register file. A map of register names to values. */
  private registerFile = new Map<string, number>().set('X', 1);

  /**
   * @description Indicates whether the CPU is busy still running a command
   * during this cycle.
   */
  private busy: boolean = false;

  /**
   * @description Tracks how many operations (i.e. cycles) remain before the
   * CPU is free to process the next instruction.
   */
  private opCount: number = 0;

  /**
   * @description The instruction that the CPU is currently busy with.
   */
  private queuedOp: Instruction | null = null;

  /**
   * @description Tracks the current cycle number (e.g. how many ticks since
   * startup).
   */
  private cycle: number = 0;

  /**
   * @description The instruction memory queue.
   */
  private readonly instructions: Instruction[] = [];

  /**
   * @description The internal instruction execution queue, which accounts
   * for any delays in each instruction by inserting noops for however many
   * cycles an instruction takes to finish. This queue is unshifted at each
   * cycle.
   */
  private readonly actions: Instruction[] = [];

  /**
   * @description Loads instructions from an input string sequence into the
   * instruction memory queue.
   * @param str The input string to parse. Expects newline after each line,
   * including the last one.
   */
  load(str: string): void {
    let buffer: string[] = [];
    for (let i = 0; i < str.length; i++) {
      const char = str[i];
      if (char === '\n') {
        const line = buffer.join('');
        const tokens: string[] = line.split(' ');
        const command = tokens[0];
        let instruction: Instruction;
        switch (command) {
          case 'noop': {
            instruction = new Instruction(OperationCode.NOOP);
            break;
          }
          case 'addx': {
            instruction = new Instruction(
              OperationCode.ADDX,
              parseInt(tokens[1])
            );
            break;
          }
          default: {
            throw new Error(
              `Fatal error: Unsupported command '${command}'`
            );
          }
        }
        this.instructions.push(instruction);

        // Reset line
        buffer = [];
      } else {
        buffer.push(char);
      }
    }
  }

  /**
   * @description Executes a single instruction via cycling the clock by one
   * tick.
   */
  tick(): void {
    if (!this.busy) {
      // First read the next instruction from instruction memory.
      const nextInstruction = this.instructions.shift();
      if (nextInstruction) {
        const opcode = nextInstruction.opcode;
        switch (opcode) {
          case OperationCode.NOOP: {
            break;
          }
          case OperationCode.ADDX: {
            this.busy = true;
            this.opCount = 1;
            this.queuedOp = nextInstruction;
            break;
          }
          default: {
            throw new Error(
              `Fatal error: Unrecognized operation code '${opcode}'.`
            );
          }
        }
      }
    } else {
      // Update the busy state for the CPU and conclude any actions if
      // necessary.
      if (this.opCount > 0) {
        this.opCount--;
      }
      if (this.opCount === 0) {
        // Perform the op that should now be done.
        const opcode = this.queuedOp?.opcode;
        switch (opcode) {
          case OperationCode.ADDX: {
            const newVal =
              this.registerFile.get('X')! + this.queuedOp!.arg!;
            this.registerFile.set('X', newVal);
            break;
          }
          default: {
            throw new Error(
              `Fatal error: Opcode '${opcode} does not support queued exec.`
            );
          }
        }
        this.busy = false;
      }
    }

    // At the end, advance the cycle count by 1.
    this.cycle++;
  }

  /**
   * @description Helper function to get the current cycle number.
   */
  getCycle(): number {
    return this.cycle;
  }

  /**
   * @description Checks if there are still instructions to process, or if
   * the CPU is still busy processing a long instruction.
   */
  hasAdditionalWork(): boolean {
    return this.instructions.length > 0 || this.busy;
  }

  /**
   * @description Gets the current value of register X.
   */
  getRegisterX(): number {
    return this.registerFile.get('X')!;
  }
}

/**
 * @description Class that runs the logic solving the elf cathode-ray tube
 * puzzle.
 */
export class ElfCathodeRayTube implements SolutionClass {
  readonly numOfParts: number = 2;
  run: RunnerFunction = RunnerFunctionFactory.build(
    this,
    this.part1,
    this.part2
  );

  /** @description The communication device's CPU. */
  private readonly cpu: CPU = new CPU();

  /**
   * @description The communication device's screen controller. Used only in
   * part 2.
   */
  private readonly screen: Screen = new Screen();

  /**
   * @description Implementation for part 1.
   */
  private part1(): void {
    // Ensure input has a trailing newline but no prefixed newline.
    const inputStr =
      fs.readFileSync(INPUT_PATH, { encoding: 'utf8' }).trim() + '\n';
    this.cpu.load(inputStr);

    // Run the program.
    const cyclesToCheck = new Set<number>([
      20, 60, 100, 140, 180, 220,
    ]);
    let runningTotal = 0;
    do {
      const cycle = this.cpu.getCycle() + 1; // handles zero-indexing
      if (cyclesToCheck.has(cycle)) {
        runningTotal += this.cpu.getRegisterX() * cycle;
      }
      this.cpu.tick();
    } while (this.cpu.hasAdditionalWork());

    console.log(`Total signal strength sum:\n${runningTotal}`);
  }

  /**
   * @description Implementation for part 2.
   */
  private part2(): void {
    // Ensure input has a trailing newline but no prefixed newline.
    const inputStr =
      fs.readFileSync(INPUT_PATH, { encoding: 'utf8' }).trim() + '\n';
    this.cpu.load(inputStr);

    // Run the program.
    let row = -1;
    do {
      const cycle = this.cpu.getCycle(); // use 0-index for screen pixels.
      const column = cycle % Screen.MAX_WIDTH;
      const x = this.cpu.getRegisterX();

      // Advance row whenever we enter a multiple of 40 (including at 0).
      if (column === 0) {
        row++;
      }

      // Print the pixel. If the sprite is visible (i.e. if current cycle is
      // x or its two surrounding values), print the sprite character.
      const pixel = column >= x - 1 && column <= x + 1 ? '#' : '.';

      this.screen.setPixel(row, column, pixel);
      this.cpu.tick();
    } while (this.cpu.hasAdditionalWork());

    // Print image.
    this.screen.print();
  }
}
