/**
 * @file
 * @description Describes a contract with which all SolutionClass children
 * shall follow.
 */
import { RunnerFunction } from './RunnerFunctionFactory';

export interface SolutionClass {
  /**
   * @description The total number of parts to thie solution, since some
   * problems will have more than one part.
   */
  readonly numOfParts: number;

  /**
   * @description The runner function which will execute the solution. If a
   * solution has multiple parts, runs the specified part only or the first
   * part if no part is given.
   */
  run: RunnerFunction;
}