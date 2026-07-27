/*
============================================================
Null Archive
other.js
공용 유틸리티
============================================================
*/

"use strict";

/* ==========================================================
    MATH
========================================================== */

function clamp(value, min, max) {

    return Math.min(Math.max(value, min), max);

}

function lerp(start, end, t) {

    return start + (end - start) * t;

}

function inverseLerp(a, b, value) {

    if (a === b) return 0;

    return (value - a) / (b - a);

}

function remap(value, inMin, inMax, outMin, outMax) {

    return lerp(
        outMin,
        outMax,
        inverseLerp(inMin, inMax, value)
    );

}

function smoothstep(min, max, value) {

    value = clamp((value - min) / (max - min), 0, 1);

    return value * value * (3 - 2 * value);

}

function damp(current, target, lambda, deltaTime) {

    return lerp(
        current,
        target,
        1 - Math.exp(-lambda * deltaTime)
    );

}

function radians(degree) {

    return degree * Math.PI / 180;

}

function degrees(radian) {

    return radian * 180 / Math.PI;

}



/* ==========================================================
    RANDOM
========================================================== */

function random(min = 0, max = 1) {

    return Math.random() * (max - min) + min;

}

function randomInt(min, max) {

    return Math.floor(random(min, max + 1));

}

function randomBool(percent = 50) {

    return Math.random() * 100 < percent;

}

function randomSign() {

    return Math.random() < 0.5 ? -1 : 1;

}

function randomChoice(array) {

    return array[
        Math.floor(Math.random() * array.length)
    ];

}



/* ==========================================================
    VECTOR2
========================================================== */

class Vector2 {

    constructor(x = 0, y = 0) {

        this.x = x;
        this.y = y;

    }

    set(x, y) {

        this.x = x;
        this.y = y;

        return this;

    }

    copy(v) {

        this.x = v.x;
        this.y = v.y;

        return this;

    }

    clone() {

        return new Vector2(
            this.x,
            this.y
        );

    }

    add(v) {

        this.x += v.x;
        this.y += v.y;

        return this;

    }

    subtract(v) {

        this.x -= v.x;
        this.y -= v.y;

        return this;

    }

    multiply(value) {

        this.x *= value;
        this.y *= value;

        return this;

    }

    divide(value) {

        this.x /= value;
        this.y /= value;

        return this;

    }

    length() {

        return Math.sqrt(
            this.x * this.x +
            this.y * this.y
        );

    }

    normalize() {

        const len = this.length();

        if (len === 0)
            return this;

        this.divide(len);

        return this;

    }

}



/* ==========================================================
    DOM
========================================================== */

function $(selector) {

    return document.querySelector(selector);

}

function $$(selector) {

    return [...document.querySelectorAll(selector)];

}

function create(tag, className = "") {

    const element = document.createElement(tag);

    if (className)
        element.className = className;

    return element;

}



/* ==========================================================
    TIME
========================================================== */

class Timer {

    constructor(duration = 1) {

        this.duration = duration;

        this.elapsed = 0;

        this.finished = false;

    }

    update(dt) {

        if (this.finished)
            return;

        this.elapsed += dt;

        if (this.elapsed >= this.duration) {

            this.elapsed = this.duration;

            this.finished = true;

        }

    }

    reset() {

        this.elapsed = 0;

        this.finished = false;

    }

    get progress() {

        return clamp(
            this.elapsed / this.duration,
            0,
            1
        );

    }

}



/* ==========================================================
    FPS
========================================================== */

class FPSCounter {

    constructor() {

        this.frame = 0;

        this.fps = 0;

        this.last = performance.now();

    }

    update() {

        this.frame++;

        const now = performance.now();

        if (now - this.last >= 1000) {

            this.fps = this.frame;

            this.frame = 0;

            this.last = now;

        }

    }

}



/* ==========================================================
    EASING
========================================================== */

const Ease = {

    linear(t) {

        return t;

    },

    inQuad(t) {

        return t * t;

    },

    outQuad(t) {

        return t * (2 - t);

    },

    inOutQuad(t) {

        return t < .5

            ? 2 * t * t

            : -1 + (4 - 2 * t) * t;

    },

    inCubic(t) {

        return t * t * t;

    },

    outCubic(t) {

        return (--t) * t * t + 1;

    },

    inOutCubic(t) {

        return t < .5

            ? 4 * t * t * t

            : (t - 1) * (2 * t - 2) * (2 * t - 2) + 1;

    }

};



/* ==========================================================
    GLOBAL
========================================================== */

window.NULL = {

    clamp,
    lerp,
    damp,
    remap,
    radians,
    degrees,

    random,
    randomInt,
    randomBool,
    randomSign,
    randomChoice,

    Vector2,

    Timer,

    FPSCounter,

    Ease,

    $,
    $$,
    create

};
