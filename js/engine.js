/*
============================================================
Pluto Archive
engine.js
============================================================
*/

"use strict";

class Engine {

    constructor() {
        this.camera = window.camera;
        this.mouse = window.mouse;
        this.orbits = [];
        this.planets = [];
        this.satellites = [];
        this.lastTime = performance.now();
        this.deltaTime = 0;
        this.time = 0;
        this.timeScale = 60;
        this.fpsCounter = new FPSCounter();
        this.running = false;
        this.selectedPlanet = null;
        this.initialize();
    }

    initialize() {
        const orbitElements = document.querySelectorAll(".orbit");
        orbitElements.forEach(element => {
            const orbit = new Orbit(element);
            this.orbits.push(orbit);
            orbit.planets.forEach(planet => {
                this.planets.push(planet);
            });
        });

        // Links Planet satellite
        document.querySelectorAll(".planet-wrapper").forEach(wrapper => {
            if (wrapper.querySelector(".link-satellite")) {
                this.satellites.push(new Satellite(wrapper));
            }
        });
    }

    start() {
        if (this.running) return;
        this.running = true;
        this.lastTime = performance.now();
        requestAnimationFrame(this.loop.bind(this));
    }

    stop() {
        this.running = false;
    }

    loop(now) {
        if (!this.running) return;

        this.deltaTime = (now - this.lastTime) / 1000;
        this.lastTime = now;

        const dt = this.deltaTime * this.timeScale;
        this.time += dt;

        this.update(dt);

        requestAnimationFrame(this.loop.bind(this));
    }

    update(dt) {
        this.fpsCounter.update();
        this.mouse.update(this.deltaTime);
        this.camera.update(this.deltaTime);

        for (const orbit of this.orbits) {
            orbit.update(dt);
        }

        for (const satellite of this.satellites) {
            satellite.update(dt);
        }
    }

    selectPlanet(planet) {
        if (this.selectedPlanet === planet) return;

        if (this.selectedPlanet) {
            this.selectedPlanet.unfocus();
        }

        this.orbits.forEach(orbit => orbit.setSelected(false));

        this.selectedPlanet = planet;

        planet.focus();

        if (planet.orbit) {
            planet.orbit.setSelected(true);
        }

        this.camera.focus(planet);
    }

    clearSelection() {
        if (this.selectedPlanet) {
            this.selectedPlanet.unfocus();
        }

        this.orbits.forEach(orbit => orbit.setSelected(false));

        this.selectedPlanet = null;
        this.camera.clearFocus();
    }

    getPlanet(name) {
        return this.planets.find(
            planet => planet.name === name
        );
    }

    getOrbit(index) {
        return this.orbits[index];
    }

    onResize() {
        this.camera.render();
    }
}
