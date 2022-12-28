/**
 * @file
 * @description Solution for Advent of Code 2022 Day 11 Problem. See details
 * at https://adventofcode.com/2022/day/11.
 */
import fs from 'fs';
import path from 'path';
import {
  RunnerFunction,
  RunnerFunctionFactory,
} from '../../util/RunnerFunctionFactory';

import { SolutionClass } from '../../util/SolutionClass.interface';

/** @description Location of input. */
const filename = 'test.txt';
const INPUT_PATH = path.normalize(
  `${__dirname}/../../../inputs/2022/Dec11/${filename}`
);

/**
 * @description Class that represent's an item and its current worry level.
 */
class Item {
  /** @description The item's name. */
  readonly name: string;

  /** @description The item's worry level. */
  private worry: BigInt;

  /**
   * @ctor
   * @param name The name to give the item.
   * @param worry The item's initial worry level.
   */
  constructor(name: string, worry: BigInt) {
    this.name = name;
    this.worry = worry;
  }

  /**
   * @description Setter for the worry level.
   * @param value The new worry level.
   */
  set worryLevel(value: BigInt) {
    this.worry = value;
  }

  /**
   * @description Getter for the item's current worry level.
   */
  get worryLevel() {
    return this.worry;
  }
}

/**
 * @description Type defining a function to mutate an item's worry value.
 */
type WorryOperation = (item: Item) => void;

/**
 * @description Type defining a function to determine where a monkey will
 * throw an item next.
 * @param item The item whose updated worry value will be checked to decide
 * where to throw it next.
 * @return The index of the monkey to throw to.
 */
type ThrowTest = (item: Item) => number;

/**
 * @description Type defining an item "throw in the air", which includes an
 * item and its destination (the index of the monkey to throw to next).
 */
type ThrownItem = { item: Item; destination: number };

/**
 * @description Class that represent's a monkey and its behavior.
 */
class Monkey {
  /** @description The Monkey's name. */
  readonly name: string;

  /** @description The queue of items currently held by this Monkey. */
  private readonly items: Item[];

  /** @description The current item at hand. */
  private itemAtHand?: Item;

  /** @description The operation string. */
  readonly opStr: string;

  /** @description The test string. */
  readonly testStr: string;

  /** @description The true result string. */
  readonly trueResultStr: string;

  /** @description The false result string. */
  readonly falseResultStr: string;

  /** @description The number of inspections made by this monkey. */
  private inspections: BigInt = BigInt(0);

  /**
   * @description The operation that dictates how a monkey's examination of
   * an item affects its worry level.
   */
  private worryOp?: WorryOperation;

  /**
   * @description The operation that determines where a monkey will throw
   * the current item next after analysis of its new worry level.
   */
  private throwOp?: ThrowTest;

  /**
   * @description Setter for the worry operation function.
   */
  set worryOperation(func: WorryOperation) {
    this.worryOp = func;
  }

  /**
   * @description Setter for the throw operation function.
   */
  set throwOperation(func: ThrowTest) {
    this.throwOp = func;
  }

  /** @description Getter for the items queue. */
  getItems(): Item[] {
    return this.items;
  }

  /**
   * @description Gets the current number of inspections made by this
   * monkey.
   */
  get inspectionsMade(): BigInt {
    return this.inspections;
  }

  /**
   * @ctor
   * @param name The name to identify this Monkey.
   * @param items The initial set of items held by this Monkey.
   * @param opStr The worry operation string to assign.
   * @param testStr The throw test string to assign.
   * @param trueResultStr The string dictating where to pass the item if
   * throw test passes.
   * @param falseResultStr The string dictating where to pass the item if
   * throw test fails.
   */
  constructor(
    name: string,
    items: Item[],
    opStr: string,
    testStr: string,
    trueResultStr: string,
    falseResultStr: string
  ) {
    this.name = name;
    this.items = items;
    this.opStr = opStr;
    this.testStr = testStr;
    this.trueResultStr = trueResultStr;
    this.falseResultStr = falseResultStr;

    this.worryOp = Monkey.getWorryOperationFromStr(this.opStr);
    this.throwOp = Monkey.getThrowTestFromStr(
      this.testStr,
      this.trueResultStr,
      this.falseResultStr
    );
  }

  /**
   * @description Produces a WorryOperation by parsing the given string.
   * @param str The string to extract the WorryOperation from.
   */
  static getWorryOperationFromStr(str: string): WorryOperation {
    if (str.indexOf('Operation:') < 0) {
      throw new Error(`Invalid worry operation string '${str}'.`);
    }
    const tokens: string[] = str // e.g. ['old', '+', '3']
      .substring(str.indexOf(':'))
      .trim()
      .split('=')[1]
      .trim()
      .split(' ');
    const operator = tokens[1];
    const rightHandSide = tokens[2];
    return (item: Item) => {
      // Init to old value at first.
      let operand: BigInt = BigInt(item.worryLevel.toString());
      if (rightHandSide !== 'old') {
        operand = BigInt(Number(rightHandSide));
      }
      switch (operator) {
        case '+': {
          item.worryLevel =
            BigInt(item.worryLevel.toString()) +
            BigInt(operand.toString());
          break;
        }
        case '*': {
          item.worryLevel =
            BigInt(item.worryLevel.toString()) *
            BigInt(operand.toString());
          break;
        }
        default: {
          throw new Error(
            `Invalid operator '${operator}' applied to item '${item.name}'.`
          );
        }
      }
    };
  }

  /**
   * @description Produces a ThrowTest from the given input string.
   * @param testStr The test string to parse.
   * @param trueResultStr The result definition if test is true.
   * @param falseResultStr The result definition if test is false.
   */
  static getThrowTestFromStr(
    testStr: string,
    trueResultStr: string,
    falseResultStr: string
  ): ThrowTest {
    const divisor = Number(testStr.split(' ').pop());
    const destIfTrue = Number(trueResultStr.split(' ').pop());
    const destIfFalse = Number(falseResultStr.split(' ').pop());
    if (Number.isNaN(divisor)) {
      throw new Error(
        `Unable to get divisor from string '${testStr}'.`
      );
    }
    if (Number.isNaN(destIfTrue)) {
      throw new Error(
        `Unable to get truthy destination from string '${trueResultStr}'.`
      );
    }
    if (Number.isNaN(destIfFalse)) {
      throw new Error(
        `Unable to get falsy destination from string '${falseResultStr}'.`
      );
    }
    return (item: Item) => {
      if (
        BigInt(item.worryLevel.toString()) %
          BigInt(divisor.toString()) ===
        BigInt(0)
      ) {
        return destIfTrue;
      } else {
        return destIfFalse;
      }
    };
  }

  /**
   * @description Add item to this monkey's item queue.
   * @param item The item to add to the queue.
   */
  addItem(item: Item): void {
    this.items.push(item);
  }

  /**
   * @description Checks whether this monkey still has items in queue or at
   * hand.
   */
  hasItems(): boolean {
    return this.items.length > 0 || this.itemAtHand !== undefined;
  }

  /**
   * @description Triggers the assigned worry operation on the current head
   * of the item queue by placing it in the monkey's hand. If no items can
   * be placed in the monkey's hand, this function does nothing.
   */
  examineItem(): void {
    if (!this.worryOp) {
      throw new Error(
        `No worry operation assigned to monkey '${this.name}'.`
      );
    }
    if (!this.throwOp) {
      throw new Error(
        `No throw test assigned to monkey '${this.name}'.`
      );
    }
    if (this.items.length > 0) {
      this.itemAtHand = this.items.shift()!;
      this.worryOp(this.itemAtHand);
      this.inspections = BigInt(this.inspections.toString()) + BigInt(1);
    }
  }

  /**
   * @description Triggers the worry level reduction after you express
   * relief from the item not being damaged following the monkey's
   * examination. This function does nothing if the monkey has nothing in
   * hand.
   */
  relieveWorry(): void {
    if (this.itemAtHand) {
      this.itemAtHand.worryLevel = BigInt(Math.floor(
        Number(this.itemAtHand.worryLevel) / 3
      ));
    }
  }

  /**
   * @description Triggers the monkey's throw test to determine which monkey
   * should receive the item next, and "throws" the item in the air (e.g.
   * the caller) to be received by the destination monkey.
   */
  throwItem(): ThrownItem {
    if (!this.throwOp) {
      throw new Error(
        `No throw test assigned to monkey '${this.name}'.`
      );
    }
    if (!this.itemAtHand) {
      throw new Error(`No item at hand for monkey '${this.name}'.`);
    }
    const nextMonkeyIndex = this.throwOp(this.itemAtHand);
    const itemInAir: ThrownItem = {
      item: this.itemAtHand,
      destination: nextMonkeyIndex,
    };
    this.itemAtHand = undefined;
    return itemInAir;
  }
}

/**
 * @description Class that runs the logic solving the elf monkey in the
 * middle puzzle.
 */
export class ElfMonkeyInTheMiddle implements SolutionClass {
  readonly numOfParts: number = 2;
  run: RunnerFunction = RunnerFunctionFactory.build(
    this,
    this.part1,
    this.part2
  );

  /**
   * @description The set of monkeys who stole the items.
   */
  private monkeys: Monkey[] = [];

  /** @ctor */
  constructor() {
    this.load(INPUT_PATH);
  }

  /**
   * @description Parses the given starting item definition string into a
   * list of Items representing the input.
   * @param str The input string to parse.
   */
  private getItemsFromStr(str: string): Item[] {
    if (str.indexOf('Starting items:') < 0) {
      throw new Error(`Invalid starting item string '${str}'.`);
    }
    const worryNumbersAsItems: Item[] = str
      .substring(str.indexOf(':') + 1)
      .trim()
      .split(', ')
      .map(numberStr => {
        const num = Number(numberStr);
        return new Item(`Item ${num}`, BigInt(num));
      });
    return worryNumbersAsItems;
  }

  /**
   * @description Loads the given file input and into a digital twin of the
   * given monkeys.
   * @param path The input file path to read from.
   */
  private load(path: string): void {
    // Ensure no newlines at the edges.
    const inputStr = fs
      .readFileSync(path, { encoding: 'utf8' })
      .trim();

    // Get monkey definitions from the input.
    const monkeyDefinitions: string[] = inputStr.split('\n\n');
    this.monkeys = monkeyDefinitions.map(
      (def: string, index: number) => {
        const [
          monkeyNameStr,
          startingItemStr,
          worryOperationStr,
          testConditionStr,
          ...testResultsStr
        ] = def.split('\n');

        const monkey = new Monkey(
          monkeyNameStr.slice(0, -1), // cut ":".
          this.getItemsFromStr(startingItemStr),
          worryOperationStr,
          testConditionStr,
          testResultsStr[0],
          testResultsStr[1]
        );
        return monkey;
      }
    );
  }

  /**
   * @description Prints the current state of the monkeys.
   */
  private printMonkeys(): void {
    console.log('\n== Monkeys ==');
    for (const monkey of this.monkeys) {
      console.log(
        monkey.name,
        `(${monkey.inspectionsMade} inspections):`
      );
      console.log(
        '\t',
        'Starting items: ',
        monkey
          .getItems()
          .map(item => item.worryLevel)
          .join(', ')
      );
      console.log('\t', monkey.opStr);
      console.log('\t', monkey.testStr);
      console.log('\t\t', monkey.trueResultStr);
      console.log('\t\t', monkey.falseResultStr);
    }
  }

  /**
   * @description Calculates the amount of monkey business based off of the
   * two most active monkeys' numbers of inspections made.
   */
  private calculateMonkeyBusiness(): BigInt {
    let largest = BigInt(0),
      second = BigInt(0);
    for (const monkey of this.monkeys) {
      if (monkey.inspectionsMade >= BigInt(largest)) {
        second = largest;
        largest = BigInt(monkey.inspectionsMade.toString());
      } else if (monkey.inspectionsMade > second) {
        second = BigInt(monkey.inspectionsMade.toString());
      }
    }
    return largest * second;
  }

  /**
   * @description Implementation for part 1.
   */
  private part1(): void {
    this.printMonkeys();
    for (let i = 0; i < 20; i++) {
      for (const monkey of this.monkeys) {
        while (monkey.hasItems()) {
          monkey.examineItem();
          monkey.relieveWorry();
          const thrownItem = monkey.throwItem();
          this.monkeys[thrownItem.destination].addItem(
            thrownItem.item
          );
          this.printMonkeys();
        }
      }
    }
    console.log('Monkey business: ', this.calculateMonkeyBusiness());
  }

  /**
   * @description Implementation for part 2.
   */
  private part2(): void {
    this.printMonkeys();
    for (let i = 0; i < 10000; i++) {
      // TODO(me): remove
      console.log('\nRound', i);
      for (const monkey of this.monkeys) {
        // TODO(me): remove
        console.log(monkey.name);
        while (monkey.hasItems()) {
          monkey.examineItem();
          // worry is no longer relieved.
          // TODO(me): Because worry is no longer relieved, the ints get so
          // big that they take forever to process, even with the BigInt JS
          // native type. Maybe I should construct my own, perhaps one that
          // instead compares chunks of sub "ints"? instead of strings?
          const thrownItem = monkey.throwItem();
          this.monkeys[thrownItem.destination].addItem(
            thrownItem.item
          );
        }
      }
    }
    this.printMonkeys();
    console.log('Monkey business: ', this.calculateMonkeyBusiness());
  }
}
