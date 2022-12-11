/**
 * @file
 * @description Solution for Advent of Code 2022 Day 9 Problem. See details
 * at https://adventofcode.com/2022/day/9.
 */
import fs from 'fs';
import path from 'path';
import {
  RunnerFunction,
  RunnerFunctionFactory,
} from '../../util/RunnerFunctionFactory';

import { SolutionClass } from '../../util/SolutionClass.interface';

/** @description Location of input. */
const DEBUG_MODE = false;
const filename = 'input.txt';
// const filename = 'test.txt';
// const filename = 'test_long_line.txt';
const INPUT_PATH = path.normalize(
  `${__dirname}/../../../inputs/2022/Dec09/${filename}`
);

/** @description Enumeration of the possible HEAD movement directions. */
enum Direction {
  UP = 0,
  LEFT,
  DOWN,
  RIGHT,
}

/**
 * @description Map of input direction specifier characters to Direction
 * enums.
 */
const DIRECTION_CHAR_MAP = new Map<string, Direction>()
  .set('U', Direction.UP)
  .set('L', Direction.LEFT)
  .set('D', Direction.DOWN)
  .set('R', Direction.RIGHT);
Object.freeze(DIRECTION_CHAR_MAP);

/**
 * @description Class that represents a vector (i.e. a direction and
 * magnitude), used to specify movements within the terrain grid.
 */
class Vector {
  /** @description Direction of the movement. */
  readonly direction: Direction;

  /** @description Magnitude of the movement. */
  readonly magnitude: number;

  /**
   * @ctor
   * @param direction The direction to move.
   * @param magnitude The number of grid positions to move by. Negative
   * numbers will automatically be converted to their absolute value.
   */
  constructor(direction: Direction, magnitude: number) {
    this.direction = direction;
    this.magnitude = Math.abs(magnitude);
  }
}

/**
 * @description Type representing a Cartesian Coordinate in the X-Y plane.
 */
class Coordinates {
  /** @description The x coordinate. */
  private x: number;

  /** @description The y coordinate. */
  private y: number;

  /**
   * @ctor
   * @param x The x value to use.
   * @param y The y value to use.
   */
  constructor(x: number, y: number) {
    this.x = x;
    this.y = y;
  }

  /** @descriptoin Setter for both x and y. */
  set(x: number, y: number): void {
    this.x = x;
    this.y = y;
  }

  /**
   * @description Returns an independent but equivalent copy of this
   * Coordinates instance.
   */
  copy(): Coordinates {
    return new Coordinates(this.x, this.y);
  }

  /**
   * @description Checks whether this Coordinates instance is equiavlent to
   * the the given Coordinates.
   * @param compare The instance to compare.
   */
  equals(compare: Coordinates): boolean {
    return this.x === compare.getX() && this.y === compare.getY();
  }

  /** @description Getter for x value. */
  getX(): number {
    return this.x;
  }

  /** @description Getter for y value. */
  getY(): number {
    return this.y;
  }

  /** @description Setter for x value. */
  setX(val: number): void {
    this.x = val;
  }

  /** @description Setter for y value. */
  setY(val: number): void {
    this.y = val;
  }
}

/**
 * @description Helper function to generate a JSON representation of the
 * given coordinates.
 * @param ref A reference to the original Coordinates to read.
 * @return A JSON string representing the original Coordinates.
 */
function getCoordinatesJson(ref: Coordinates): string {
  return JSON.stringify(`[${ref.getX()},${ref.getY()}]`);
}

/**
 * @description Helper that calculates the distance between two points using
 * the cartesian distance formula.
 * @param first The first point.
 * @param second The second point.
 * @return The distance between two points. Diagnonals will have non-integer
 * distances.
 */
function getDistance(
  first: Coordinates,
  second: Coordinates
): number {
  return Math.sqrt(
    Math.pow(second.getX() - first.getX(), 2) +
      Math.pow(second.getY() - first.getY(), 2)
  );
}

/** @description The assumed starting position for each run. */
const START_POS: Coordinates = new Coordinates(0, 0);

/**
 * @description Class representing a "grid" within which the Rope's head and
 * tail move.
 */
class ExpandingTerrain {
  /**
   * @description Set of json strings representing coordinates that the
   * tail has visited.
   */
  private readonly tailVisits = new Set<string>();

  /** @description Keeps track of head and tail current positions. */
  private readonly headPos: Coordinates = new Coordinates(0,0);
  private readonly tailPos: Coordinates = new Coordinates(0,0);

  /**
   * @description Tracks the farthest distances visited in the "grid". Used
   * to determine how far the "edges" of the "grid" extend, which helps us
   * limit the scope of printing without actually searching the set of
   * coordinates for these values each time.
   */
  private xMax: number = 0;
  private xMin: number = 0;
  private yMax: number = 0;
  private yMin: number = 0;

  /** @ctor */
  constructor() {
    // We assume the grid starts with a single point (0,0) from which all
    // three key points (start, HEAD and TAIL) begin. Tail visit history is
    // also initialized to this point as well.
    this.tailVisits.add(getCoordinatesJson(this.tailPos));
  }

  /**
   * @description Moves the rope head to the specified position, which will
   * consequently move the tail if it needs to move. Additional coordinates
   * are added on an "as-visited" basis.
   * @param move The vector representing the desired movement of HEAD.
   */
  moveHead(move: Vector): void {
    // TODO(me): remove
    if (DEBUG_MODE) console.log('\nMove:', move);

    // Move head one grid position at a time, evaluating at each step when
    // to move tail, if at all.
    for (let i = 0; i < move.magnitude; i++) {
      // Move head.
      switch (move.direction) {
        case Direction.UP: {
          this.headPos.setX(this.headPos.getX());
          this.headPos.setY(this.headPos.getY() + 1);
          break;
        }
        case Direction.DOWN: {
          this.headPos.setX(this.headPos.getX());
          this.headPos.setY(this.headPos.getY() - 1);
          break;
        }
        case Direction.LEFT: {
          this.headPos.setX(this.headPos.getX() - 1);
          this.headPos.setY(this.headPos.getY());
          break;
        }
        case Direction.RIGHT: {
          this.headPos.setX(this.headPos.getX() + 1);
          this.headPos.setY(this.headPos.getY());
          break;
        }
      }

      // Next, check whether we need to move tail as well.
      const distance = getDistance(this.headPos, this.tailPos);
      const isAdjacentToHead = Math.floor(distance) <= 1; // floor in diags.
      if (!isAdjacentToHead) {
        // Move tail in x-direction.
        let newTailX = this.tailPos.getX();
        let newTailY = this.tailPos.getY();
        if (this.tailPos.getX() < this.headPos.getX()) {
          newTailX++;
        } else if (this.tailPos.getX() > this.headPos.getX()) {
          newTailX--;
        }

        // Move tail in y-direction.
        if (this.tailPos.getY() < this.headPos.getY()) {
          newTailY++;
        } else if (this.tailPos.getY() > this.headPos.getY()) {
          newTailY--;
        }
        this.tailPos.set(newTailX, newTailY);
      }

      // Update visit history.
      this.tailVisits.add(getCoordinatesJson(this.tailPos));

      // Update the grid's furthest edge trackers.
      this.updateEdgeDistances(this.headPos, this.tailPos);

      // TODO(me): remove
      if (DEBUG_MODE) this.print();
    }
  }

  /**
   * @description Updates the current recorded furthest edge distances based
   * on the given positions.
   * @param currentHead The current head position.
   * @param currentTail The current tail position.
   */
  updateEdgeDistances(
    currentHead: Coordinates,
    currentTail: Coordinates
  ): void {
    const currentMinX = Math.min(currentHead.getX(), currentTail.getX());
    const currentMaxX = Math.max(currentHead.getX(), currentTail.getX());
    const currentMinY = Math.min(currentHead.getY(), currentTail.getY());
    const currentMaxY = Math.max(currentHead.getY(), currentTail.getY());
    if (currentMaxX > this.xMax) {
      this.xMax = currentMaxX;
    }
    if (currentMinX < this.xMin) {
      this.xMin = currentMinX;
    }
    if (currentMaxY > this.yMax) {
      this.yMax = currentMaxY;
    }
    if (currentMinY < this.yMin) {
      this.yMin = currentMinY;
    }
  }

  /** @description Getter for the set of tail visits. */
  getTailVisits(): Set<string> {
    return this.tailVisits;
  }

  /**
   * @description Prints the current state of the Terrain.
   */
  print(): void {
    // Since we're logging top-down, we'll go backwards in the y-direction
    // while we go forwards (left-to-right) in the x-direction.
    console.log('\n');
    for (let y = this.yMax; y >= this.yMin; y--) {
      const lineBuffer: string[] = [];
      for (let x = this.xMin; x <= this.xMax; x++) {
        const currentCoord = new Coordinates(x, y);
        let char = '.';
        if (currentCoord.equals(this.headPos)) {
          char = 'H';
        } else if (currentCoord.equals(this.tailPos)) {
          char = 'T';
        } else if (currentCoord.equals(START_POS)) {
          char = 's';
        } else if (
          this.tailVisits.has(getCoordinatesJson(currentCoord))
        ) {
          char = '#';
        }
        lineBuffer.push(char);
      }
      console.log(lineBuffer.join(''));
    }
  }
}

/**
 * @description Class that runs the logic solving the elf rope bridge
 * puzzle.
 */
export class ElfRopeBridge implements SolutionClass {
  readonly numOfParts: number = 2;
  run: RunnerFunction = RunnerFunctionFactory.build(this, this.part1);

  /** @description Holds the input move list representation. */
  private moveList: Vector[] = [];

  /** @description The terrain tracker. */
  private terrain: ExpandingTerrain = new ExpandingTerrain();

  /** @ctor */
  constructor() {
    // Ensure no newline in head, but one trailing newline at tail.
    const inputStr =
      fs
        .readFileSync(INPUT_PATH, {
          encoding: 'utf8',
        })
        .trim() + '\n';
    this.load(inputStr);
  }

  /**
   * @description Loads the input file contents into a digital twin
   * representation in memory.
   * @param input The string file input to parse. Requires a trailing new-
   * line at the end, and no newline at the front.
   */
  private load(input: string): void {
    let lineBuffer = '';
    for (let i = 0; i < input.length; i++) {
      const char = input[i];
      if (char === '\n') {
        const vector = new Vector(
          DIRECTION_CHAR_MAP.get(lineBuffer[0])!,
          parseInt(lineBuffer.substring(lineBuffer.indexOf(' ') + 1))
        );
        this.moveList.push(vector);

        // Reset.
        lineBuffer = '';
      } else {
        lineBuffer += char;
      }
    }
  }

  /**
   * @description Implementation for part 1.
   */
  private part1(): void {
    // TODO(me): remove
    if (DEBUG_MODE) {
      console.log('Starting State:');
      this.terrain.print();
      console.log(this.terrain.getTailVisits());
    }

    // Play through the move list.
    this.moveList.forEach((vector: Vector) => {
      this.terrain.moveHead(vector);
    });

    console.log(
      `Total number of tail-visited positions:\n${
        this.terrain.getTailVisits().size
      }`
    );

    // TODO(me): remove
    if (DEBUG_MODE) console.log(this.terrain.getTailVisits());
  }
}
