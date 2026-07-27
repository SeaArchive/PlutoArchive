/*
============================================================
Null Archive
orbit.js
============================================================
*/

"use strict";

class Orbit {

    constructor(element) {

        this.element = element;

        // ==================================================
        // DATA
        // ==================================================

        this.radius =
            Number(element.dataset.radius || 200);

        this.baseSpeed =
            Number(element.dataset.speed || 0.1);

        this.tilt =
            Number(element.dataset.tilt || 0);

        // ==================================================
        // STATE
        // ==================================================

        this.rotation = 0;

        this.currentSpeed = this.baseSpeed;

        this.targetSpeed = this.baseSpeed;

        this.hoverCount = 0;

        this.enabled = true;

        // ==================================================
        // PLANETS
        // ==================================================

        this.planets = [];

        const wrappers =
            element.querySelectorAll(".planet-wrapper");

        wrappers.forEach(wrapper => {

            const planet = new Planet(wrapper, this);

            this.planets.push(planet);

        });

        this.initialize();

    }

    /* ======================================================
        INITIALIZE
    ====================================================== */

    initialize() {

        this.element.style.width =
            `${this.radius * 2}px`;

        this.element.style.height =
            `${this.radius * 2}px`;

        this.element.style.left =
           "50%";

        this.element.style.top =
           "50%";

        this.element.style.transform =
            `translate(-50%, -50%) rotateX(${this.tilt}deg)`;

    }

    /* ======================================================
        UPDATE
    ====================================================== */

    update(dt) {

        if (!this.enabled)
            return;

        this.currentSpeed = damp(

            this.currentSpeed,

            this.targetSpeed,

            5,

            dt / 60

        );

        this.rotation +=
            this.currentSpeed * dt;

        this.updatePlanets(dt);

    }

    /* ======================================================
        PLANETS
    ====================================================== */

    updatePlanets(dt) {

        for (const planet of this.planets) {

            const angle =

                radians(

                    planet.baseAngle +

                    this.rotation *

                    planet.orbitMultiplier

                );

            const x =

                Math.cos(angle)

                * this.radius +

                this.radius;

            const y =

                Math.sin(angle)

                * this.radius +

                this.radius;

            planet.setPosition(x, y);

            planet.update(dt);

        }

    }

    /* ======================================================
        SPEED
    ====================================================== */

    setSpeed(speed) {

        this.targetSpeed = speed;

    }

    resetSpeed() {

        this.targetSpeed = this.baseSpeed;

    }

    requestSlow() {

        this.hoverCount++;

        this.targetSpeed =
            this.baseSpeed * 0.05;

    }

    releaseSlow() {

        this.hoverCount--;

        if (this.hoverCount <= 0) {

            this.hoverCount = 0;

            this.targetSpeed =
                this.baseSpeed;

        }

    }

    /* ======================================================
        PLANET
    ====================================================== */

    addPlanet(wrapper) {

        const planet =
            new Planet(wrapper, this);

        this.planets.push(planet);

        return planet;

    }

    removePlanet(planet) {

        const index =
            this.planets.indexOf(planet);

        if (index === -1)
            return;

        this.planets.splice(index, 1);

    }

    getPlanet(name) {

        return this.planets.find(

            p => p.name === name

        );

    }

    /* ======================================================
        ENABLE
    ====================================================== */

    enable() {

        this.enabled = true;

    }

    disable() {

        this.enabled = false;

    }

}
