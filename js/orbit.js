/*
============================================================
Pluto Archive
orbit.js
============================================================
*/

"use strict";

class Orbit {
    constructor(element) {
        this.element = element;
        this.radius = Number(element.dataset.radius || 200);
        this.baseSpeed = Number(element.dataset.speed || 0.1);
        this.tilt = Number(element.dataset.tilt || 0);
        this.rotation = 0;
        this.currentSpeed = this.baseSpeed;
        this.targetSpeed = this.baseSpeed;
        this.hoverCount = 0;
        this.enabled = true;
        this.selected = false;
        this.planets = [];
        this.trailLength = 18;
        this.trailTimer = 0;
        this.trails = new Map();

        element.querySelectorAll(".planet-wrapper").forEach(wrapper => {
            const planet = new Planet(wrapper, this);
            this.planets.push(planet);
            this.createTrail(planet);
        });
        this.initialize();
    }

    initialize() {
        this.element.style.width = `${this.radius * 2}px`;
        this.element.style.height = `${this.radius * 2}px`;
        this.element.style.left = "50%";
        this.element.style.top = "50%";
        this.element.style.transform = `translate(-50%, -50%) rotateX(${this.tilt}deg)`;
    }

    createTrail(planet) {
        const points = [];
        for (let i = 0; i < this.trailLength; i++) {
            const point = document.createElement("span");
            point.className = "planet-orbit-trail";
            point.setAttribute("aria-hidden", "true");
            Object.assign(point.style, {
                position: "absolute",
                width: "3px",
                height: "3px",
                borderRadius: "50%",
                pointerEvents: "none",
                opacity: "0",
                background: "rgba(79,216,255,0.9)",
                boxShadow: "0 0 6px rgba(79,216,255,0.8)",
                transform: "translate(-50%, -50%)"
            });
            this.element.appendChild(point);
            points.push({ element: point, x: 0, y: 0, initialized: false });
        }
        this.trails.set(planet, points);
    }

    update(dt) {
        if (!this.enabled) return;
        this.currentSpeed = damp(this.currentSpeed, this.targetSpeed, 5, dt / 60);
        this.rotation += this.currentSpeed * dt;
        this.updatePlanets(dt);

        // Record frequently enough to make a continuous-looking fading tail.
        this.trailTimer += dt;
        if (this.trailTimer >= 1) {
            this.trailTimer = 0;
            this.recordTrailPositions();
        }
        this.renderTrails();
    }

    updatePlanets(dt) {
        for (const planet of this.planets) {
            const angle = radians(planet.baseAngle + this.rotation * planet.orbitMultiplier);
            const x = Math.cos(angle) * this.radius + this.radius;
            const y = Math.sin(angle) * this.radius + this.radius;
            planet.setPosition(x, y);
            planet.update(dt);
        }
    }

    recordTrailPositions() {
        for (const planet of this.planets) {
            const points = this.trails.get(planet);
            if (!points) continue;
            for (let i = points.length - 1; i > 0; i--) {
                points[i].x = points[i - 1].x;
                points[i].y = points[i - 1].y;
                points[i].initialized = points[i - 1].initialized;
            }
            points[0].x = planet.x;
            points[0].y = planet.y;
            points[0].initialized = true;
        }
    }

    renderTrails() {
        for (const points of this.trails.values()) {
            points.forEach((point, index) => {
                if (!point.initialized) {
                    point.element.style.opacity = "0";
                    return;
                }
                const fade = 1 - index / points.length;
                point.element.style.left = `${point.x}px`;
                point.element.style.top = `${point.y}px`;
                point.element.style.opacity = String((fade * fade * 0.55).toFixed(3));
                point.element.style.transform = `translate(-50%, -50%) scale(${0.25 + fade * 0.75})`;
                point.element.style.zIndex = String(-10 - index);
            });
        }
    }

    setSpeed(speed) { this.targetSpeed = speed; }
    resetSpeed() { this.targetSpeed = this.baseSpeed; }
    requestSlow() { this.hoverCount++; this.targetSpeed = this.baseSpeed * 0.05; }
    releaseSlow() {
        this.hoverCount--;
        if (this.hoverCount <= 0) {
            this.hoverCount = 0;
            this.targetSpeed = this.baseSpeed;
        }
    }
    setSelected(selected) {
        this.selected = selected;
        this.element.classList.toggle("is-selected", selected);
    }
    addPlanet(wrapper) {
        const planet = new Planet(wrapper, this);
        this.planets.push(planet);
        this.createTrail(planet);
        return planet;
    }
    removePlanet(planet) {
        const index = this.planets.indexOf(planet);
        if (index === -1) return;
        const points = this.trails.get(planet) || [];
        points.forEach(point => point.element.remove());
        this.trails.delete(planet);
        this.planets.splice(index, 1);
    }
    getPlanet(name) { return this.planets.find(p => p.name === name); }
    enable() { this.enabled = true; }
    disable() { this.enabled = false; }
}
