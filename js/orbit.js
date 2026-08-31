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

        this.trailCanvas = document.createElement("canvas");
        this.trailCanvas.className = "planet-orbit-trails";
        this.trailCanvas.setAttribute("aria-hidden", "true");
        Object.assign(this.trailCanvas.style, {
            position: "absolute",
            left: "0",
            top: "0",
            width: "100%",
            height: "100%",
            pointerEvents: "none",
            zIndex: "5"
        });
        this.element.appendChild(this.trailCanvas);

        element.querySelectorAll(".planet-wrapper").forEach(wrapper => {
            this.planets.push(new Planet(wrapper, this));
        });

        this.initialize();
    }

    initialize() {
        this.element.style.width = `${this.radius * 2}px`;
        this.element.style.height = `${this.radius * 2}px`;
        this.element.style.left = "50%";
        this.element.style.top = "50%";
        this.element.style.transform = `translate(-50%,-50%) rotateX(${this.tilt}deg)`;
        this.resizeTrailCanvas();
    }

    resizeTrailCanvas() {
        const dpr = Math.min(window.devicePixelRatio || 1, 2);
        this.trailCanvas.width = Math.round(this.radius * 2 * dpr);
        this.trailCanvas.height = Math.round(this.radius * 2 * dpr);
        this.trailCanvas.getContext("2d").setTransform(dpr, 0, 0, dpr, 0, 0);
    }

    update(dt) {
        if (!this.enabled) return;

        this.currentSpeed = damp(this.currentSpeed, this.targetSpeed, 5, dt / 60);
        this.rotation += this.currentSpeed * dt;
        this.updatePlanets(dt);
        this.renderTrails();
    }

    updatePlanets(dt) {
        for (const planet of this.planets) {
            const angle = radians(planet.baseAngle + this.rotation * planet.orbitMultiplier);
            planet.setPosition(
                Math.cos(angle) * this.radius + this.radius,
                Math.sin(angle) * this.radius + this.radius
            );
            planet.update(dt);
        }
    }

    renderTrails() {
        const ctx = this.trailCanvas.getContext("2d");
        const size = this.radius * 2;
        const cx = this.radius;
        const cy = this.radius;

        ctx.clearRect(0, 0, size, size);
        ctx.lineCap = "round";
        ctx.lineJoin = "round";

        /* Three layered pieces of the planet's orbital path.
           Long, medium and short; each is a real curved stroke. */
        const trails = [
            { length: radians(190), width: 3.2, alpha: 0.68, offset: 0.00 },
            { length: radians(112), width: 2.2, alpha: 0.50, offset: 0.025 },
            { length: radians(62),  width: 1.45, alpha: 0.38, offset: 0.05 }
        ];

        for (const planet of this.planets) {
            const head = radians(planet.baseAngle + this.rotation * planet.orbitMultiplier);

            for (const trail of trails) {
                const steps = 90;

                ctx.beginPath();

                for (let i = 0; i <= steps; i++) {
                    const t = i / steps;
                    const angle = head - trail.offset - trail.length * t;
                    const x = cx + Math.cos(angle) * this.radius;
                    const y = cy + Math.sin(angle) * this.radius;

                    if (i === 0) ctx.moveTo(x, y);
                    else ctx.lineTo(x, y);
                }

                /* Draw a clean continuous arc first. */
                const gradient = ctx.createLinearGradient(
                    cx + Math.cos(head) * this.radius,
                    cy + Math.sin(head) * this.radius,
                    cx + Math.cos(head - trail.length) * this.radius,
                    cy + Math.sin(head - trail.length) * this.radius
                );
                gradient.addColorStop(0, `rgba(79,216,255,${trail.alpha})`);
                gradient.addColorStop(0.55, `rgba(79,216,255,${trail.alpha * 0.42})`);
                gradient.addColorStop(1, "rgba(79,216,255,0)");

                ctx.strokeStyle = gradient;
                ctx.lineWidth = trail.width;
                ctx.shadowBlur = 10;
                ctx.shadowColor = `rgba(79,216,255,${trail.alpha * 0.65})`;
                ctx.stroke();
            }
        }

        ctx.shadowBlur = 0;
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
        return planet;
    }
    removePlanet(planet) {
        const index = this.planets.indexOf(planet);
        if (index !== -1) this.planets.splice(index, 1);
    }
    getPlanet(name) { return this.planets.find(p => p.name === name); }
    enable() { this.enabled = true; }
    disable() { this.enabled = false; }
}
