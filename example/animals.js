"use strict"

import { addTest } from './test.js';

export class Cat {
    constructor() {
    }

    makeSound() {
        return "meow";
    }
}

export class Dog {
    constructor() {
    }

    makeSound() {
        return "woof";
    }
}


addTest("TestCat", t => {
    const cat = new Cat();
    t.equals("meow", cat.makeSound())
});

addTest("TestDog", t => {
    const dog = new Dog();
    t.equals("woof", dog.makeSound())
});
