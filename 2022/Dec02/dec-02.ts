/**
 * @file
 * @description Solution for Advent of Code 2022 Day 2 Problem. See details
 * at https://adventofcode.com/2022/day/2.
 */
import fs from 'fs';
import path from 'path';
import { RunnerFunction, RunnerFunctionFactory } from '../../util/RunnerFunctionFactory';

import { SolutionClass } from '../../util/SolutionClass.interface';

/** @description Location of input */
const INPUT_PATH = path.normalize(
  `${__dirname}/../../../inputs/2022/Dec02/input.txt`);

/** @description Enumeration of the three Rock-Paper-Scissor plays. */
enum PlayType {
  UNKNOWN,
  ROCK,
  PAPER,
  SCISSORS
}

/**
 * @description Enumeration of the three outcomes in Rock-Paper-Scissors.
 */
enum OutcomeType {
  UNKNOWN,
  WIN,
  LOSS,
  DRAW
}

/**
 * @description Class that runs the logic to solve the elf rock-paper-
 * scissors puzzle.
 */
export class ElfRockPaperScissors implements SolutionClass {
  readonly numOfParts: number = 2;
  run: RunnerFunction =
    RunnerFunctionFactory.build(this, this.part1, this.part2);

  /**
   * @description Legend mapping round outcomes to their point value.
   */
  private readonly ROUND_POINT_MAP = (new Map<number, number>())
    .set(/* win */ 1, 6).set(/* loss */ -1, 0).set(/* draw */ 0, 3);

  /**
   * @description Legend mapping PlayTypes to their point value.
   */
  private readonly PLAY_POINT_MAP = (new Map<PlayType, number>())
    .set(PlayType.ROCK, 1).set(PlayType.PAPER, 2).set(PlayType.SCISSORS, 3);

  /**
   * @description Legend mapping PlayTypes to the PlayType they beat.
   */
  private readonly WIN_MAP = (new Map<PlayType, PlayType>())
    .set(PlayType.ROCK, PlayType.SCISSORS)
    .set(PlayType.PAPER, PlayType.ROCK)
    .set(PlayType.SCISSORS, PlayType.PAPER);

  /**
   * @description Legend mapping PlayTypes to the PlayType they lose from.
   * The opposite of the above win map.
   */
  private readonly LOSE_MAP = (new Map<PlayType, PlayType>())
    .set(PlayType.SCISSORS, PlayType.ROCK)
    .set(PlayType.ROCK, PlayType.PAPER)
    .set(PlayType.PAPER, PlayType.SCISSORS);

  /**
   * @description Legend showing the play that each encountered character
   * means. Used primarily for part 1.
   */
  private readonly PLAY_MAP = (new Map<string, PlayType>())
    .set('A', PlayType.ROCK).set('B', PlayType.PAPER)
    .set('C', PlayType.SCISSORS).set('X', PlayType.ROCK)
    .set('Y', PlayType.PAPER).set('Z', PlayType.SCISSORS);

  /**
   * @description Legend showing the desired outcome from an encountered
   * rival play. Used only for part 2.
   */
  private readonly DESIRED_OUTCOME_MAP = (new Map<string, OutcomeType>())
    .set('Z', OutcomeType.WIN)
    .set('Y', OutcomeType.DRAW)
    .set('X', OutcomeType.LOSS);

  /**
   * @description Determines the winner of a round of Rock-Paper-Scissors
   * given two plays.
   * @param first The first play made.
   * @param second The second play made.
   * @return 1 if the first play wins, -1 if the second play wins, or 0 if
   * it is a draw.
   */
  private determineWinner(first: PlayType, second: PlayType): number {
    if (first === second) {
      return 0;
    } else if (this.WIN_MAP.get(first) === second) {
      return 1;
    } else {
      return -1;
    }
  }

  /**
   * @description Determines the correct play to achieve the desired round
   * outcome given a rival play.
   * @param rivalPlay The play that your rival chose.
   * @param desiredOutcome The outcome you wish to achieve.
   * @return The correct PlayType that you need to achieve the outcome.
   */
  private determineCorrectPlay(
    rivalPlay: PlayType, desiredOutcome: OutcomeType): PlayType {
    let desiredPlay = PlayType.UNKNOWN;
    const correctPlayForRivalWin = this.WIN_MAP.get(rivalPlay);
    const correcPlayForRivalLoss = this.LOSE_MAP.get(rivalPlay);
    switch (desiredOutcome) {
      case OutcomeType.WIN: {
        desiredPlay = correcPlayForRivalLoss as PlayType;
        break;
      }
      case OutcomeType.LOSS: {
        desiredPlay = correctPlayForRivalWin as PlayType;
        break;
      }
      case OutcomeType.DRAW: {
        desiredPlay = rivalPlay;
        break;
      }
      default: {
        throw new Error(`Cannot use desired outcome 'UNKNOWN'.`);
      }
    }
    return desiredPlay;
  }

  /**
   * @description Implementation for part 1.
   */
  protected part1(): void {
    // Enforce no newlines at the start and a newline at the end.
    const inputStr = fs.readFileSync(INPUT_PATH, {encoding: 'utf8'}).trim()
      + '\n';

    let runningTotal: number = 0; // your score.
    let gotRivalPlay: boolean = false; // show when we got the rival's hand.
    let rivalPlay: PlayType = PlayType.UNKNOWN;
    let yourPlay: PlayType = PlayType.UNKNOWN;
    // Go through the input character by character, line by line. Each line
    // will constitute a single round, and we can track score as we go.
    for (let i = 0; i < inputStr.length; i++) {
      const char = inputStr[i];
      if (char === '\n') {
        // Here we will have just amassed a single line comprising a round.
        // Determine your current running score
        const roundOutcome = this.determineWinner(yourPlay, rivalPlay);
        const pointsFromPlay = this.PLAY_POINT_MAP.get(yourPlay) as number;
        const pointsFromOutcome =
          this.ROUND_POINT_MAP.get(roundOutcome) as number;
        runningTotal += pointsFromOutcome + pointsFromPlay;

        // Reset for the next line.
        gotRivalPlay = false;
        rivalPlay = PlayType.UNKNOWN;
        yourPlay = PlayType.UNKNOWN;
      } else if (char === ' ') {
        // Here this means we previously acquired the opponent's hand. Mark
        // it as such.
        gotRivalPlay = true;
      } else {
        // For any other character, determine whose play we are seeing and
        // record it.
        const play = this.PLAY_MAP.get(char) ?? PlayType.UNKNOWN;
        if (play === PlayType.UNKNOWN) {
          throw new Error(`Encountered unknown play type '${char}'`);
        } else if (gotRivalPlay) {
          yourPlay = play;
        } else {
          rivalPlay = play;
        }
      }
    }

    console.log('Your score:', runningTotal);
  }

  /**
   * @description Implementation for part 2.
   */
  private part2(): void {
    // Enforce no newlines at the start and a newline at the end.
    const inputStr = fs.readFileSync(INPUT_PATH, {encoding: 'utf8'}).trim()
      + '\n';

    let runningTotal: number = 0; // your score.
    let gotRivalPlay: boolean = false; // show when we got the rival's hand.
    let rivalPlay: PlayType = PlayType.UNKNOWN;
    let desiredOutcome: OutcomeType = OutcomeType.UNKNOWN;
    let yourPlay: PlayType = PlayType.UNKNOWN;
    // Go through the input character by character, line by line. Each line
    // will constitute a single round, and we can track score as we go.
    for (let i = 0; i < inputStr.length; i++) {
      const char = inputStr[i];
      if (char === '\n') {
        // Here we will have just amassed a single line comprising a round.
        // Determine your current running score based on desired outcome.
        yourPlay = this.determineCorrectPlay(rivalPlay, desiredOutcome);

        // Tally up points.
        const pointsFromPlay = this.PLAY_POINT_MAP.get(yourPlay) as number;
        const outcomeInTrinary = desiredOutcome === OutcomeType.DRAW ? 0 :
          desiredOutcome === OutcomeType.WIN ? 1 : -1;
        const pointsFromOutcome =
          this.ROUND_POINT_MAP.get(outcomeInTrinary) as number;
        runningTotal += pointsFromOutcome + pointsFromPlay;

        // Reset for the next line.
        gotRivalPlay = false;
        rivalPlay = PlayType.UNKNOWN;
        yourPlay = PlayType.UNKNOWN;
        desiredOutcome = OutcomeType.UNKNOWN;
      } else if (char === ' ') {
        // Here this means we previously acquired the opponent's hand. Mark
        // it as such.
        gotRivalPlay = true;
      } else {
        // For any other character, determine whether we are getting the
        // rival play or the desired outcome, then record it.
        if (gotRivalPlay) {
          desiredOutcome =
            this.DESIRED_OUTCOME_MAP.get(char) ?? OutcomeType.UNKNOWN;
          if (desiredOutcome === OutcomeType.UNKNOWN) {
            throw new Error(`Encountered unknown outcome type '${char}'.`);
          }
        } else {
          rivalPlay = this.PLAY_MAP.get(char) ?? PlayType.UNKNOWN;
          if (rivalPlay === PlayType.UNKNOWN) {
            throw new Error(
              `Encountered unknown rival play type '${char}'.`);
          }
        }
      }
    }

    console.log('Your score:', runningTotal);
  }
}
