/*
============================================================
Null Archive
engine.js
============================================================
*/

"use strict";

class Engine {

    constructor() {

        // -------------------------------------------------
        // Objects
        // -------------------------------------------------

        this.camera = window.camera;
        this.mouse = window.mouse;

        this.orbits = [];
        this.planets = [];

        // -------------------------------------------------
        // Time
        // -------------------------------------------------

        this.lastTime = performance.now();

        this.deltaTime = 0;

        this.time = 0;

        // deltaTime 보정용
        this.timeScale = 60;

        // -------------------------------------------------
        // FPS
        // -------------------------------------------------

        this.fpsCounter = new FPSCounter();

        // -------------------------------------------------
        // State
        // -------------------------------------------------

        this.running = false;

        this.selectedPlanet = null;

        // -------------------------------------------------

        this.initialize();

    }

    /* =====================================================
        INITIALIZE
    ===================================================== */

    initialize() {

        const orbitElements =
            document.querySelectorAll(".orbit");

        orbitElements.forEach(element => {

            const orbit = new Orbit(element);

            this.orbits.push(orbit);

            orbit.planets.forEach(planet => {

                this.planets.push(planet);

            });

        });

    }

    /* =====================================================
        START
    ===================================================== */

    start() {

        if (this.running)
            return;

        this.running = true;

        this.lastTime = performance.now();

        requestAnimationFrame(this.loop.bind(this));

    }

    /* =====================================================
        STOP
    ===================================================== */

    stop() {

        this.running = false;

    }

    /* =====================================================
        LOOP
    ===================================================== */

    loop(now) {

        if (!this.running)
            return;

        // -----------------------------
        // Delta Time
        // -----------------------------

        this.deltaTime =
            (now - this.lastTime) / 1000;

        this.lastTime = now;

        // 60fps 기준
        const dt =
            this.deltaTime * this.timeScale;

        this.time += dt;

        // -----------------------------
        // Update
        // -----------------------------

        this.update(dt);

        requestAnimationFrame(
            this.loop.bind(this)
        );

    }

    /* =====================================================
        UPDATE
    ===================================================== */

    update(dt) {

        this.fpsCounter.update();

        this.mouse.update(this.deltaTime);

        this.camera.update(this.deltaTime);

        for (const orbit of this.orbits) {

            orbit.update(dt);

        }

    }

    /* =====================================================
        PLANET
    ===================================================== */

    selectPlanet(planet) {

        if (this.selectedPlanet === planet)
            return;

        if (this.selectedPlanet) {

            this.selectedPlanet.unfocus();

        }

        this.selectedPlanet = planet;

        planet.focus();

        this.camera.focus(planet);

    }

    clearSelection() {

        if (this.selectedPlanet) {

            this.selectedPlanet.unfocus();

        }

        this.selectedPlanet = null;

        this.camera.clearFocus();

    }

    /* =====================================================
        FIND
    ===================================================== */

    getPlanet(name) {

        return this.planets.find(

            planet =>

            planet.name === name

        );

    }

    getOrbit(index) {

        return this.orbits[index];

    }

    /* =====================================================
        CALLBACK
    ===================================================== */

    onResize() {

        this.camera.render();

    }

}
