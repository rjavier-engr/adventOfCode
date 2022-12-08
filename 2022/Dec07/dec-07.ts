/**
 * @file
 * @description Solution for Advent of Code 2022 Day 7 Problem. See details
 * at https://adventofcode.com/2022/day/7.
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
  `${__dirname}/../../../inputs/2022/Dec07/input.txt`
);
// const TEST_INPUT_PATH = path.normalize(
//   `${__dirname}/../../../inputs/2022/Dec07/test.txt`
// );
const FILESYSTEM_MAX_SIZE = 70000000; // 70 Million.

/** @description Class used to track running total across all recursions. */
class TotalTracker {
  /** @description Tracks the current running total. */
  private runningTotal: number = 0;

  /** @description Getter for the current running total value. */
  getCurrentTotal(): number {
    return this.runningTotal;
  }

  /**
   * @description Adds to the current running total.
   * @param amount The amount to add.
   */
  add(amount: number): void {
    this.runningTotal += amount;
  }
}

/** @description Class that represents a file. */
class File {
  /** @description The name of the file. */
  readonly name: string;

  /** @description The size of the file. */
  readonly size: number;

  /**
   * @ctor
   * @param name The name of the file.
   * @param size The size of the file.
   */
  constructor(name: string, size: number) {
    this.name = name;
    this.size = size;
  }
}

/** @descriptoin Class that represents a file system directory. */
class Folder {
  /** @description The name of the directory. */
  readonly name: string;

  /** @description A reference to the container of its contents. */
  readonly content: Map<string, File | Folder>;

  /**
   * @ctor
   * @param name The name to give the directory.
   */
  constructor(name: string) {
    this.name = name;
    this.content = new Map<string, File | Folder>();
  }
}

/**
 * @description Class to represent the digital twin of a file system and
 * preform common file system operations on the digital twin.
 */
export class FileSystem {
  /** @description The root directory. */
  private readonly root: Folder = new Folder('/');

  /** @description Tracks where the user is within the file system. */
  private ref: Folder;

  /**
   * @description Refers to the parent directory of the directory currently
   * pointed to by ref.
   */
  private parent: Folder[] = [];

  /** @ctor */
  constructor() {
    // At instantiation, start at root.
    this.ref = this.root;
  }

  /**
   * @description Getter for the file system root.
   */
  getRoot(): Folder {
    return this.root;
  }

  /**
   * @description Helper to load file contents into this filesystem instance
   * as its digital twin.
   * @param str The input string to parse.
   */
  load(str: string): void {
    // Parse each command line by line, replicating the steps outlined by
    // the input to construct our digital twin.
    let line = '';
    let lineNum = 0;
    let isListingDir = false; // tracks whether input is printing ls output.
    for (let i = 0; i < str.length; i++) {
      const char = str[i];
      if (char === '\n') {
        // Determine what the line is.
        if (line.indexOf('$ ') === 0) {
          // It is a command.
          // Luckily for us, we only need to support two 2-letter commands
          const command = line.substring(2, 4);
          const arg = line.length > 4 ? line.substring(5) : null;

          switch (command) {
            case 'cd': {
              if (!arg) {
                throw new Error(
                  `Expected destination, got '${arg}'.`
                );
              }
              this.changeDirectory(arg);
              break;
            }
            case 'ls': {
              isListingDir = true; // mark next line as start of ls output.
              break;
            }
            default: {
              throw new Error(
                `Unsupported command '${command}' from line:\n${line}`
              );
            }
          }
        } else if (isListingDir) {
          // At this point, we must add whatever we saw listed in the file-
          // system digital twin.
          let item: File | Folder;
          const dividerIndex = line.indexOf(' ');
          const itemName = line.substring(dividerIndex + 1);
          if (line.indexOf('dir') === 0) {
            // for directory
            item = new Folder(itemName);
          } else {
            // for file
            const size = parseInt(line.substring(0, dividerIndex));
            item = new File(itemName, size);
          }
          const addResult = this.add(item);
          if (!addResult) {
            throw new Error(
              `Fatal error: FileSystem.add() failed at line ${lineNum}` +
                `:\n${line}`
            );
          }
        }

        // Reset
        line = '';
        lineNum++;
      } else {
        // If input just finished listing directory contents, update state.
        if (char === '$' && isListingDir) {
          isListingDir = false;
        }

        // Add char to line
        line += char;
      }
    }

    // At the end of the loading sequence, take the caller back to root
    // before finishing.
    this.changeDirectory('/');
  }

  /**
   * @description Helper to log directory with padding to represent tree
   * hierarchy.
   * @param entity The item to print.
   * @param level The filesystem tree depth of the
   */
  private printEntityAtLevel(
    entity: File | Folder,
    level: number
  ): void {
    // Start at 1 to avoid root padding.
    let padding = '';
    for (let i = 0; i < level; i++) {
      padding += '  ';
    }
    const typeSpecifier =
      entity instanceof File
        ? `(file, size=${entity.size})`
        : '(dir)';
    console.log(`${padding}- ${entity.name} ${typeSpecifier}`);
  }

  /**
   * @description Determines the current size of the filesystem at runtime.
   * @param start The foler to acquire the disk space of.
   * @return The total amount of disk space units consumed by the filesystem
   * at the current point in time.
   */
  calculateDiskUsage(start: Folder): number {
    // Similarly to the `print()` function, we will be using an iterative
    // variation of the DFS approach.
    let runningTotal = 0;
    const stack: (File | Folder)[] = [start];
    while (stack.length > 0) {
      const top = stack[stack.length - 1];
      if (top instanceof Folder) {
        // Remove folder from stack, then lay its contents on top.
        const folder = stack.pop() as Folder;
        folder.content.forEach((fileOrFolder: File | Folder) => {
          stack.push(fileOrFolder);
        });
      } else if (top instanceof File) {
        // Add its size to the total, then remove from queue since we no
        // longer need it for the calculation.
        runningTotal += (top as File).size;
        stack.pop();
      }
    }
    return runningTotal;
  }

  /**
   * @description Prints the current filesystem.
   */
  print(): void {
    // Print in the same style as the puzzle's prompt. Use iterative DFS to
    // avoid dealing with stack-overflow issues for the easier recursion
    // print implementation.
    const stack: (File | Folder)[] = [this.root];
    let contentsAtLevel: number[] = [1];
    while (stack.length > 0) {
      const top = stack[stack.length - 1];
      // Decrement item count of current folder appropriately to mark that
      // we are processing one file/folder.
      contentsAtLevel[contentsAtLevel.length - 1]--;

      if (top instanceof Folder) {
        // Print directory. Depth is determined by size of stack.
        this.printEntityAtLevel(top, contentsAtLevel.length);

        // Remove the folder from the stack, and instead lay its contents on
        // the top. This way, we don't need to worry about tracking when a
        // folder is empty, since it will empty on its own when all folders
        // (even nested ones) are evntually replaced with their contents in
        // the stack.
        const folder = stack.pop() as Folder;
        contentsAtLevel.push(folder.content.size);
        const reversalQueue: (File | Folder)[] = [];
        folder.content.forEach((fileOrFolder: File | Folder) => {
          reversalQueue.unshift(fileOrFolder);
        });
        reversalQueue.forEach(item => {
          stack.push(item);
        });
      } else if (top instanceof File) {
        // Print file. Depth is determined by size of stack.
        this.printEntityAtLevel(top, contentsAtLevel.length);

        // Once a file is printed, there's nowhere deeper to go, and we've
        // already used this file. Pop it off the and don't worry about it
        // again.
        stack.pop();
      }

      // Reduce padding if we have just finish the now current folder.
      if (
        contentsAtLevel.length > 0 &&
        contentsAtLevel[contentsAtLevel.length - 1] < 1
      ) {
        contentsAtLevel.pop();
      }
    }
  }

  /**
   * @description Helper to change directory to the given directory name.
   * @param dest The target directory to enter. If '..' is given, moves up
   * the directory tree if there is somewhere to go. If '/' is given, moves
   * directly to the root directory.
   * @return The directory you end up in after changing directories.
   */
  changeDirectory(dest: string): Folder {
    // Go to root
    if (dest === '/') {
      this.ref = this.root;
      this.parent = [];
    }

    // Go up if we can.
    else if (dest === '..' && this.parent.length > 0) {
      this.ref = this.parent.pop()! as Folder;
    }

    // Else go down if we can.
    else if (
      this.ref.content.has(dest) &&
      this.ref.content.get(dest)! instanceof Folder
    ) {
      this.parent.push(this.ref);
      this.ref = this.ref.content.get(dest)! as Folder;
    }
    return this.ref;
  }

  /**
   * @description Helper to add a file or directory to the current one.
   * @param fileOrDir The thing to insert in the current directory.
   * @return True on success, false otherwise.
   */
  add(fileOrDir: File | Folder): boolean {
    let success = false;
    if (!this.ref.content.has(fileOrDir.name)) {
      success = true;
      this.ref.content.set(fileOrDir.name, fileOrDir);
    }
    return success;
  }
}

/**
 * @description Recursively called function to DFS down the filesystem tree.
 * @param folder The current folder to check.
 * @param tracker A container to track the running total at the end of each
 * directory size calculation stage.
 * @return total The total size of all things in this folder.
 */
function getSizeSumFrom100kMaxDirsRecurse(
  folder: Folder,
  tracker: TotalTracker
): number {
  let totalAtThisStage = 0;
  folder.content.forEach((fileOrFolder: File | Folder) => {
    if (fileOrFolder instanceof Folder) {
      totalAtThisStage += getSizeSumFrom100kMaxDirsRecurse(
        fileOrFolder as Folder,
        tracker
      );
    } else {
      totalAtThisStage += (fileOrFolder as File).size;
    }
  });

  // Only add the number to the running total if it does not exceed 100,000
  // in size.
  if (totalAtThisStage <= 100000) {
    tracker.add(totalAtThisStage);
  }
  return totalAtThisStage;
}

/**
 * @description Helper to calculate the total size of all directories (even
 * including previously-counted subdirectories) that are no more than 100k
 * in size.
 * @param root The filesystem root to start from
 * @return The total size of all those directories combined (even including
 * previously-counted subdirectories).
 */
function getSizeSumFrom100kMaxDirs(root: Folder): number {
  // Keep the running total in an object so that a JS reference is passed to
  // each recursion instead of a copy.
  const totalTracker: TotalTracker = new TotalTracker();
  getSizeSumFrom100kMaxDirsRecurse(root, totalTracker);
  return totalTracker.getCurrentTotal();
}

/**
 * @description Class that runs the logic solving the elf no space left on
 * device puzzle.
 */
export class ElfNoSpaceOnDevice implements SolutionClass {
  readonly numOfParts: number = 2;
  run: RunnerFunction = RunnerFunctionFactory.build(
    this,
    this.part1,
    this.part2
  );

  /**
   * @description A digital twin of the filesystem represented by the puzzle
   * input.
   */
  filesystem: FileSystem = new FileSystem();

  /** @ctor */
  constructor() {
    // Ensure no newline at head and only a trailing newline.
    const str =
      fs.readFileSync(INPUT_PATH, { encoding: 'utf8' }).trim() + '\n';
    this.filesystem.load(str);
  }

  /**
   * @description Implementation for part 1.
   */
  private part1(): void {
    // We can solve this with recursion. Recursively call a function at each
    // node (i.e. folder) to tally up total item sum (i.e. current level
    // items + deeper ones) for that node. Each recursion will return its
    // own calculated total (including nested subfolders).
    const total = getSizeSumFrom100kMaxDirs(
      this.filesystem.getRoot()
    );
    console.log(
      `Total size of all folders with size <= 100,000 (repeating nested ` +
        `folders):\n${total}`
    );
  }

  /**
   * @description Implementation for part 2.
   */
  private part2(): void {
    const total = 0;

    // First we must grab the current total file system usage.
    const currentSpaceUsed = this.filesystem.calculateDiskUsage(
      this.filesystem.getRoot()
    );
    console.log(`Current disk space used: ${currentSpaceUsed}`);

    // TODO(me): With the total, we now know the minimum amount of disk
    // space we need to free to enable to device update. Find one such
    // folder that is as close to that as possible.
    console.log(
      `Size of smallest folder that frees up at least 30,000,000 units ` +
        `of disk space if deleted:\n${total}`
    );
  }
}
