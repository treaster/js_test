"use strict"

import { Cat, Dog } from './animals.js';
import { runTests, ConsoleRenderer, DomRenderer } from './test.js';

function AppInit() {
    let containerElement = document.body;
    const didRunTests = runTests({
        // renderer: new ConsoleRenderer(),
        // runTestsParam: 'run_tests',
        // runOnlyParam: 'run_only',
    });
    if (didRunTests) {
        return;
    }

    // Normal application behavior goes here.
    containerElement.innerText = 'Tests did not run.';
};


AppInit();
