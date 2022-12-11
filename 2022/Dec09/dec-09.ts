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
 * magnitude), used to specify movements within the moving rope grid.
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
 * @description Class representing the rope whose nodes, from head to tail,
 * can move.
 */
class MovingRope {
  /**
   * @description Sets of json strings representing coordinates that the
   * non-head nodes have visited.
   */
  private readonly visits: Set<string>[] = [];

  /** @description Reference to the head node's current position. */
  private readonly head: Coordinates = new Coordinates(0, 0);

  /** @description Reference to the tail node's current position. */
  private readonly tail: Coordinates;

  /**
   * @description List of references to each non-head node's current
   * positions.
   */
  private readonly rope: Coordinates[] = [];

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

  /**
   * @ctor
   * @param nodeCount The number of nodes (i.e. knots) for this rope,
   * excluding the head.
   */
  constructor(nodeCount: number) {
    // We assume the nodes start from a single point (0,0), from which they
    // all overlap.
    for (let i = 0; i < nodeCount; i++) {
      const nonHeadNode = new Coordinates(0, 0);
      const nodeVisits = new Set<string>().add(
        getCoordinatesJson(nonHeadNode)
      );

      // Node visit history is also initialized to this point as well.
      this.rope.push(nonHeadNode);
      this.visits.push(nodeVisits);
    }
    this.tail = this.rope[this.rope.length - 1];
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
          this.head.setX(this.head.getX());
          this.head.setY(this.head.getY() + 1);
          break;
        }
        case Direction.DOWN: {
          this.head.setX(this.head.getX());
          this.head.setY(this.head.getY() - 1);
          break;
        }
        case Direction.LEFT: {
          this.head.setX(this.head.getX() - 1);
          this.head.setY(this.head.getY());
          break;
        }
        case Direction.RIGHT: {
          this.head.setX(this.head.getX() + 1);
          this.head.setY(this.head.getY());
          break;
        }
      }

      // Next, check whether we need to move the next node as well.
      let headingNode = this.head;
      this.rope.forEach((node: Coordinates, index: number) => {
        this.evaluateMovement(headingNode, node, this.visits[index]);
        headingNode = node; // for next run, set current node as next head.
      });
    }
  }

  /**
   * @description Evaluates and moves a node given its parent's position.
   * @param parent Reference to the head of the given node to evaluate.
   * @param node Reference to the node to evaluate.
   * @param visits Reference to the visit history of the node to evaluate.
   */
  evaluateMovement(
    parent: Coordinates,
    node: Coordinates,
    visits: Set<string>
  ): void {
    const distance = getDistance(parent, node);
    const isAdjacentToHead = Math.floor(distance) <= 1; // floor in diags.
    if (!isAdjacentToHead) {
      // Move node in x-direction.
      let newTailX = node.getX();
      let newTailY = node.getY();
      if (node.getX() < parent.getX()) {
        newTailX++;
      } else if (node.getX() > parent.getX()) {
        newTailX--;
      }

      // Move node in y-direction.
      if (node.getY() < parent.getY()) {
        newTailY++;
      } else if (node.getY() > parent.getY()) {
        newTailY--;
      }
      node.set(newTailX, newTailY);
    }

    // Update visit history.
    visits.add(getCoordinatesJson(node));

    // Update the grid's furthest edge trackers.
    this.updateEdgeDistances(parent, node);

    // TODO(me): remove
    if (DEBUG_MODE) this.print();
  }

  /**
   * @description Updates the current recorded furthest edge distances based
   * on the given positions.
   * @param currentHead The head node's position.
   * @param currentTail The tail node's position.
   */
  updateEdgeDistances(
    currentHead: Coordinates,
    currentTail: Coordinates
  ): void {
    const currentMinX = Math.min(
      currentHead.getX(),
      currentTail.getX()
    );
    const currentMaxX = Math.max(
      currentHead.getX(),
      currentTail.getX()
    );
    const currentMinY = Math.min(
      currentHead.getY(),
      currentTail.getY()
    );
    const currentMaxY = Math.max(
      currentHead.getY(),
      currentTail.getY()
    );
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

  /** @description Getter for the set of set of non-head node visits. */
  getNodeVisitsSetList(): Set<string>[] {
    return this.visits;
  }

  /**
   * @description Prints the current state of the moving rope.
   */
  print(): void {
    // Map of coordinate hashes to their coordinate numbers.
    const midSectionCoordinateNumberMap = new Map<string, number>();
    for (let i = 1; i < this.rope.length - 2; i++) {
      midSectionCoordinateNumberMap.set(
        getCoordinatesJson(this.rope[i]),
        i
      );
    }

    // Since we're logging top-down, we'll go backwards in the y-direction
    // while we go forwards (left-to-right) in the x-direction.
    console.log('\n');
    for (let y = this.yMax; y >= this.yMin; y--) {
      const lineBuffer: string[] = [];
      for (let x = this.xMin; x <= this.xMax; x++) {
        const currentCoord = new Coordinates(x, y);
        const currentCoordKey = getCoordinatesJson(currentCoord);
        let char = '.';
        if (currentCoord.equals(this.head)) {
          char = 'H';
        } else if (currentCoord.equals(this.tail)) {
          char = 'T';
        } else if (
          midSectionCoordinateNumberMap.size > 0 &&
          midSectionCoordinateNumberMap.has(currentCoordKey)
        ) {
          // For non-head and non-tail nodes.
          char = midSectionCoordinateNumberMap
            .get(currentCoordKey)!
            .toString();
        } else if (currentCoord.equals(START_POS)) {
          char = 's';
        } else if (
          // For tail node visit history only.
          this.visits[this.rope.length - 1].has(currentCoordKey)
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
  run: RunnerFunction = RunnerFunctionFactory.build(
    this,
    this.part1,
    this.part2
  );

  /** @description Holds the input move list representation. */
  private moveList: Vector[] = [];

  /** @description The moving rope tracker. */
  private movingRope: MovingRope = new MovingRope(1);

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
    // Ensure we start with a rope of node count 2 (includes head).
    this.movingRope = new MovingRope(1); // Use 1 for only 1 non-head node.

    // TODO(me): remove
    if (DEBUG_MODE) {
      console.log('Starting State:');
      this.movingRope.print();
      console.log(this.movingRope.getNodeVisitsSetList()[0]);
    }

    // Play through the move list.
    this.moveList.forEach((vector: Vector) => {
      this.movingRope.moveHead(vector);
    });

    console.log(
      `Total number of tail-visited positions:\n${
        this.movingRope.getNodeVisitsSetList()[0].size
      }`
    );

    // TODO(me): remove
    if (DEBUG_MODE)
      console.log(this.movingRope.getNodeVisitsSetList()[0]);
  }

  /**
   * @description Implementation for part 2.
   */
  private part2(): void {
    // Ensure we start with a rope of node count 10 (includes head).
    this.movingRope = new MovingRope(9); // Use 9 for the 9 non-head nodes.

    // Play through the move list.
    this.moveList.forEach((vector: Vector) => {
      this.movingRope.moveHead(vector);
    });

    const visitSets = this.movingRope.getNodeVisitsSetList();
    console.log(
      `Total number of tail-visited positions:\n${
        visitSets[visitSets.length - 1].size
      }`
    );
  }
}
