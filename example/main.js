"use strict"

import { Cat, Dog } from './animals.js';
import { runTests, ConsoleRenderer, DomRenderer } from './test.js';

function AppInit() {
    let containerElement = document.body;
    const didRunTests = runTests({
        renderer: new DomRenderer(),
        //
        // Other options include:
        // renderer: new ConsoleRenderer(),
        // runTestsParam: 'run_tests',
        // runOnlyParam: 'run_only',
    });
    if (didRunTests) {
        return;
    }

    // Normal application behavior goes here.
    containerElement.innerHTML = 'Tests did not run. Go to <a href="/?run_tests=1">/?run_tests=1</a> to run the tests.';
};


AppInit();
