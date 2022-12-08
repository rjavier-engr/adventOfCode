/**
 * @file
 * @description Solution for Advent of Code 2022 Day 8 Problem. See details
 * at https://adventofcode.com/2022/day/8.
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
  `${__dirname}/../../../inputs/2022/Dec08/input.txt`
);
const TEST_INPUT_PATH = path.normalize(
  `${__dirname}/../../../inputs/2022/Dec08/test.txt`
);

/**
 * @description Class representing our tree height map.
 */
class TreeHeightMap {
  /**
   * @description Second-degree grid data structure (i.e. map of maps of
   * numbers) to represent the landscape. I'm choosing to use maps because
   * they are supposedly more lightweight than plain Arrays.
   */
  private readonly grid: Map<number, Map<number, number>>;

  /** @description Convenient storage for the current grid width. */
  private gridWidth: number = 0;

  /** @description Convenient storage for the current grid height. */
  private gridHeight: number = 0;

  /** @ctor */
  constructor() {
    this.grid = new Map<number, Map<number, number>>();
  }

  /** @description Getter for grid height. */
  getGridHeight(): number {
    return this.gridHeight;
  }

  /** @description Getter for grid width. */
  getGridWidth(): number {
    return this.gridWidth;
  }

  /**
   * @description Loads the given string into the TreeHeightMap instance,
   * translating and storing it into a grid representation of tree heights.
   * @param str The input string to load. It is expected to be a square grid
   * of single-digit decimal integers, with each row having a trailing new-
   * line character (including the final row).
   */
  load(str: string): void {
    let currentTreeRow = new Map<number, number>();
    let currentRowNum = 0;
    this.gridWidth = str.indexOf('\n');
    for (let i = 0; i < str.length; i++) {
      const char = str[i];
      if (char === '\n') {
        // We have completed a row of tree heights, add it to the list. Then
        // set up for the next row of trees.
        this.grid.set(currentRowNum, currentTreeRow);
        currentTreeRow = new Map<number, number>();
        currentRowNum++;
      } else {
        currentTreeRow.set(i % (this.gridWidth + 1), parseInt(char));
      }
    }
    this.gridHeight = currentRowNum; // at loop end, it isn't zero-indexed.
  }

  /**
   * @description Prints the tree map.
   */
  print(): void {
    console.log(
      `Grid Dimensions (W x H): ${this.gridWidth} x ${this.gridHeight}`
    );
    for (const row of this.grid) {
      let line = '\n';
      for (const col of row[1]) {
        line += ` ${col[1]}`;
      }
      console.log(line);
    }
  }

  /**
   * @description Given a set of coordinates, checks if the tree at that
   * point is hidden from the edges. A tree is hidden if there is at least
   * one tree taller than or equal in height in all four cardinal directions
   * (i.e. up, left, down, right). Edges are automatically not hidden.
   * @param x The row coordinate for the target tree.
   * @param y The column coordinate for the target tree.
   * @return True if the tree is hidden, false otherwise.
   */
  checkObscurityOfTree(x: number, y: number): boolean {
    let isHidden = false;

    // Unless the coordinates are within the edges, tree is automatically
    // not hidden.
    const isAtTopOrBottomEdge = x <= 0 || x >= this.gridHeight - 1;
    const isAtLeftOrRightEdge = y <= 0 || y >= this.gridWidth - 1;
    if (!isAtTopOrBottomEdge && !isAtLeftOrRightEdge) {
      // Since we are within the edges, we now just have to check from the
      // inside out whether there are any trees of equal or greater height
      // than our tree at grid(x,y). If at any point we reach an edge, we
      // automatically know the tree is not hidden. However, if we hit any
      // tree equal or higher in height in both ends of the row or column,
      // we stop checking that row or column and immediately begin checking
      // the other axis.
      const row = this.grid.get(x)!;
      const height = row.get(y)! as number;

      // Check left.
      let isHiddenLeft = false;
      for (let i = y - 1; i >= 0; i--) {
        if (row.get(i)! >= height) {
          isHiddenLeft = true;
          break;
        }
      }

      // Check right.
      let isHiddenRight = false;
      for (let i = y + 1; i < this.gridWidth; i++) {
        if (row.get(i)! >= height) {
          isHiddenRight = true;
          break;
        }
      }

      // Check top.
      let isHiddenTop = false;
      for (let i = x - 1; i >= 0; i--) {
        const rowFromAbove = this.grid.get(i)!;
        if (rowFromAbove.get(y)! >= height) {
          isHiddenTop = true;
          break;
        }
      }

      // Check bottom.
      let isHiddenBottom = false;
      for (let i = x + 1; i < this.gridHeight; i++) {
        const rowFromBelow = this.grid.get(i)!;
        if (rowFromBelow.get(y)! >= height) {
          isHiddenBottom = true;
          break;
        }
      }

      isHidden =
        isHiddenLeft &&
        isHiddenRight &&
        isHiddenTop &&
        isHiddenBottom;
    }
    return isHidden;
  }

  /**
   * @description Counts the total number of visible trees in the grid.
   * @return The total number of visible trees.
   */
  getTotalVisibleTrees(): number {
    const totalRows = this.gridHeight;
    const totalCols = this.gridWidth;

    // O(n^2) implementation. The naive solution. Strangely enough, this
    // seesm sufficient for now.
    let visibleTreeCount = 0;
    for (let row = 0; row < totalRows; row++) {
      for (let col = 0; col < totalCols; col++) {
        if (!this.checkObscurityOfTree(row, col)) {
          visibleTreeCount++;
        }
      }
    }
    return visibleTreeCount;
  }

  /**
   * @description Given a set of coordinates, evaluates the view score of
   * the specified tree. View score is calculated by gathering the distance
   * of the closest blocking tree in all cardinal directions (i.e. up, down,
   * left, right) relative to the specified tree and getting their product.
   * @note Careful, the function DOESN'T check if (x,y) is outside the grid.
   * @param x The row coordinate of the target tree.
   * @param y The column coordinate of the target tree.
   * @return The view score for this tree.
   */
  getTreeViewScore(x: number, y: number): number {
    const row = this.grid.get(x)!;
    const height = row.get(y)!;

    // Check left
    let distanceLeft = 0;
    for (let i = y - 1; i >= 0; i--) {
      distanceLeft++;
      if (row.get(i)! >= height) {
        break;
      }
    }

    // Check right.
    let distanceRight = 0;
    for (let i = y + 1; i < this.gridWidth; i++) {
      distanceRight++;
      if (row.get(i)! >= height) {
        break;
      }
    }

    // Check top.
    let distanceTop = 0;
    for (let i = x - 1; i >= 0; i--) {
      distanceTop++;
      if (this.grid.get(i)!.get(y)! >= height) {
        break;
      }
    }

    // Check bottom.
    let distanceBottom = 0;
    for (let i = x + 1; i < this.gridHeight; i++) {
      distanceBottom++;
      if (this.grid.get(i)!.get(y)! >= height) {
        break;
      }
    }

    return distanceBottom * distanceTop * distanceLeft * distanceRight;
  }

  /**
   * @description Finds the best tree view score possible in the grid.
   * @return The largest view score.
   */
  getBestTreeViewScore(): number {
    let bestViewScore = 0;
    for (let row = 0; row < this.gridHeight; row++) {
      for (let col = 0; col < this.gridWidth; col++) {
        const treeScore = this.getTreeViewScore(row, col);
        if (treeScore > bestViewScore) {
          bestViewScore = treeScore;
        }
      }
    }
    return bestViewScore;
  }
}

/**
 * @description Class that runs the logic solving the elf treetop tree house
 * puzzle.
 */
export class ElfTreeTopTreeHouse implements SolutionClass {
  readonly numOfParts: number = 2;
  run: RunnerFunction = RunnerFunctionFactory.build(
    this,
    this.part1,
    this.part2
  );

  /** @description Digital twin representation of the tree map input. */
  private readonly landscape: TreeHeightMap;

  /** @ctor */
  constructor() {
    // Ensure no newline at head and only a trailing newline.
    const str =
      fs.readFileSync(INPUT_PATH, { encoding: 'utf8' }).trim() + '\n';
    this.landscape = new TreeHeightMap();
    this.landscape.load(str);
  }

  /**
   * @description Implementation for part 1.
   */
  private part1(): void {
    // // TODO(me): remove
    // this.landscape.print();
    const visibleTrees = this.landscape.getTotalVisibleTrees();
    console.log('Total number of visible trees:', visibleTrees);
  }

  /**
   * @description Implementation for part 2.
   */
  private part2(): void {
    const viewScore = this.landscape.getBestTreeViewScore();
    console.log('Largest possible view score:\n', viewScore);
  }
}
