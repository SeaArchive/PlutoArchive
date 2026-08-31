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

        this.trailLength = 14;
        this.trailTimer = 0;
        this.trail = [];

        this.createTrail();
        this.updateVisual();
    }

    createTrail() {

        for (let i = 0; i < this.trailLength; i++) {
            const point = document.createElement("span");
            point.className = "satellite-orbit-trail";
            point.setAttribute("aria-hidden", "true");
            point.style.position = "absolute";
            point.style.width = "2px";
            point.style.height = "2px";
            point.style.borderRadius = "50%";
            point.style.pointerEvents = "none";
            point.style.background = "rgba(79, 216, 255, 0.85)";
            point.style.boxShadow = "0 0 5px rgba(79, 216, 255, 0.7)";
            point.style.opacity = "0";
            this.wrapper.appendChild(point);
            this.trail.push({ element: point, x: 0, z: 0 });
        }
    }

    update(dt) {

        if (!this.satellite)
            return;

        this.angle += this.speed * dt;

        this.trailTimer += dt;
        if (this.trailTimer >= 2) {
            this.trailTimer = 0;
            this.recordTrailPosition();
        }

        this.updateVisual();
        this.renderTrail();
    }

    getPosition() {
        const angle = radians(this.angle);
        return {
            x: Math.sin(angle) * this.radius,
            z: Math.cos(angle) * this.depth
        };
    }

    recordTrailPosition() {

        const position = this.getPosition();

        for (let i = this.trail.length - 1; i > 0; i--) {
            this.trail[i].x = this.trail[i - 1].x;
            this.trail[i].z = this.trail[i - 1].z;
        }

        this.trail[0].x = position.x;
        this.trail[0].z = position.z;
    }

    renderTrail() {

        this.trail.forEach((point, index) => {
            const fade = 1 - index / this.trail.length;
            const depth01 = clamp(
                (point.z + this.depth) / (this.depth * 2),
                0,
                1
            );

            point.element.style.left = `${point.x}px`;
            point.element.style.top = "0px";
            point.element.style.transform =
                `translate(-50%, -50%) translate3d(0, 0, ${point.z}px) ` +
                `scale(${0.3 + fade * 0.7})`;
            point.element.style.opacity =
                point.x === 0 && point.z === 0
                    ? "0"
                    : String((fade * fade * (0.18 + depth01 * 0.2)).toFixed(3));
            point.element.style.zIndex =
                String(Math.round((depth01 - 0.5) * 200) - 1);
        });
    }

    updateVisual() {

        const { x, z } = this.getPosition();

        const depth01 = clamp(
            (z + this.depth) / (this.depth * 2),
            0,
            1
        );

        const scale = 0.62 + depth01 * 0.38;
        const opacity = 0.38 + depth01 * 0.62;

        this.satellite.style.transform =
            `translate3d(${x}px, 0, ${z}px) ` +
            `translate(-50%, -50%) ` +
            `scale(${scale})`;

        this.satellite.style.opacity = opacity.toFixed(3);

        this.satellite.style.zIndex =
            String(Math.round((depth01 - 0.5) * 200));
    }
}

window.Satellite = Satellite;
