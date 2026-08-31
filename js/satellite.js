/*
============================================================
Pluto Archive
satellite.js
Links Planet satellite orbit
============================================================
*/

"use strict";

class Satellite {

    constructor(planetWrapper) {

        this.wrapper = planetWrapper;
        this.satellite = planetWrapper.querySelector(".link-satellite");

        if (!this.satellite)
            return;

        this.angle = Number(planetWrapper.dataset.satelliteAngle || 0);
        this.speed = Number(planetWrapper.dataset.satelliteSpeed || 0.42);
        this.radius = Number(planetWrapper.dataset.satelliteRadius || 78);
        this.depth = Number(planetWrapper.dataset.satelliteDepth || 52);

        this.updateVisual();
    }

    update(dt) {

        if (!this.satellite)
            return;

        this.angle += this.speed * dt;
        this.updateVisual();
    }

    updateVisual() {

        const angle = radians(this.angle);

        // Satellite travels around the Links planet in the X/Z plane.
        const x = Math.sin(angle) * this.radius;
        const z = Math.cos(angle) * this.depth;

        const depth01 = clamp(
            (z + this.depth) / (this.depth * 2),
            0,
            1
        );

        // Perspective: closer = larger/brighter.
        const scale = 0.62 + depth01 * 0.38;
        const opacity = 0.38 + depth01 * 0.62;

        this.satellite.style.transform =
            `translate3d(${x}px, 0, ${z}px) ` +
            `translate(-50%, -50%) ` +
            `scale(${scale})`;

        this.satellite.style.opacity = opacity.toFixed(3);

        // Rear half stays behind the planet.
        this.satellite.style.zIndex =
            String(Math.round((depth01 - 0.5) * 200));
    }
}

window.Satellite = Satellite;
