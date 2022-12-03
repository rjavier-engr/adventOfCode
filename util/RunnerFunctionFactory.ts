import { SolutionClass } from "./SolutionClass.interface";

/**
 * @file
 * @description Defines a function class for running any number of parts of
 * a SolutionClass problem.
 */
export type RunnerFunction = (part?: number) => void;
export type PartFunction = () => void;

/**
 * @description Defines a runner function factory that builds a runner
 * function to run parts of a SolutionClass.
 */
export class RunnerFunctionFactory{
  /**
   * @description Builds the runner for the given SolutionClass PartFunction
   * references.
   * @param ref Reference to the SolutionClass instance.
   * @param first Reference to the part 1 PartFunction of a SolutionClass.
   * @param others Additional PartFunctions of the SolutionClass to run.
   */
  static build(ref: SolutionClass, first: PartFunction, ...others: PartFunction[]):
    RunnerFunction {
    const parts = [first].concat(others);
    if (parts.length < 1) {
      throw new Error('No PartFunction reference(s) given.');
    }
    return (part?: number) => {
      const partNum = part ?? 1;
      if (partNum > parts.length || partNum < 1) {
        throw new Error(`This solution has no part ${partNum}`);
      }
      parts[partNum - 1].apply(ref); // run function with ref as "this".
    };
  }
}