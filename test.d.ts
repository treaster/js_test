/**
 * Type declarations for test.js - a lightweight JavaScript unit test framework.
 * The type annotations in test.js should be sufficient, but in case you need
 * it, here it is as a .d.ts file.
 */

/**
 * TestCase provides assertion methods for unit tests.
 */
export interface TestCase {
    /** The name of the test case. */
    name: string;
    /** The status of the test case: 'ok', 'failed', or 'skipped'. */
    status: string;
    /** The exception that caused the test to fail, if any. */
    exc: Error | null;

    /** Causes the test to fail with the specified error message. */
    fail(msg: string): never;

    /** Asserts that actual is strictly equal to true. */
    true(actual: unknown): void;

    /** Asserts that actual is strictly equal to false. */
    false(actual: unknown): void;

    /** Asserts that expected === actual. */
    equals(expected: unknown, actual: unknown): void;

    /** Asserts that expected !== actual. */
    notEquals(expected: unknown, actual: unknown): void;

    /** Asserts deep equality using JSON.stringify comparison. */
    objEquals(expected: unknown, actual: unknown): void;

    /** Asserts deep inequality using JSON.stringify comparison. */
    objNotEquals(expected: unknown, actual: unknown): void;

    /** Asserts that two Sets contain the same items. */
    setEquals(expected: Set<unknown>, actual: Set<unknown>): void;

    /** Asserts that actual is neither undefined nor null. */
    defined(actual: unknown): void;

    /** Asserts that failingFn throws an exception containing errorFragment. */
    exception(failingFn: () => void, errorFragment: string): void;
}

/**
 * A function that executes a test behavior.
 */
export type TestFn = (t: TestCase) => void;

/**
 * Options for configuring test execution.
 */
export interface RunTestsOptions {
    /** The renderer used to display results. Defaults to ConsoleRenderer. */
    renderer?: Renderer;
    /** URL param name to toggle test execution. Defaults to 'run_tests'. */
    runTestsParam?: string;
    /** URL param name to filter which tests run. Defaults to 'run_only'. */
    runOnlyParam?: string;
}

/**
 * Base class for rendering test results.
 */
export class Renderer {
    constructor();
    render(options: RunTestsOptions, results: TestCase[]): void;
    renderBoilerplate(options: RunTestsOptions): unknown;
    renderOneTest(
        options: RunTestsOptions,
        table: unknown,
        testName: string,
        statusText: string,
        message: string,
        hexColor: string
    ): void;
}

/**
 * Renders test results to the console.
 */
export class ConsoleRenderer extends Renderer {
    constructor();
}

/**
 * Options for configuring the DOM renderer.
 */
export interface DomRendererOptions {
    containerElement?: HTMLElement;
    containerClassName?: string;
    containerStyle?: Partial<CSSStyleDeclaration>;
}

/**
 * Renders test results to the DOM.
 */
export class DomRenderer extends Renderer {
    constructor(options?: DomRendererOptions);
}

/**
 * Adds a test to the set of tests to run.
 * @param testName - The name of the test case.
 * @param testFn - The function that executes the test behavior.
 */
export function addTest(testName: string, testFn: TestFn): void;

/**
 * Runs all registered tests.
 * @param options - Configuration options for test execution.
 * @returns true if tests were executed, false if skipped.
 */
export function runTests(options?: RunTestsOptions | Renderer): boolean;
