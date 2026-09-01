/* Pluto Archive - satellite.js */
"use strict";

class Satellite {
    constructor(planetWrapper) {
        this.wrapper = planetWrapper;
        this.world = planetWrapper.closest(".orbit") || planetWrapper.parentElement;
        this.satellites = [...planetWrapper.querySelectorAll(".link-satellite")];
        if (!this.satellites.length) return;

        this.items = this.satellites.map((satellite, index) => {
            const second = satellite.classList.contains("link-satellite-square") || index === 1;
            const prefix = second ? "satellite2" : "satellite";
            return {
                satellite,
                angle: Number(planetWrapper.dataset[`${prefix}Angle`] || (second ? 145 : 0)),
                speed: Number(planetWrapper.dataset[`${prefix}Speed`] || (second ? .34 : .42)) * 1.4,
                radius: Number(planetWrapper.dataset[`${prefix}Radius`] || (second ? 48 : 78)),
                depth: Number(planetWrapper.dataset[`${prefix}Depth`] || (second ? 34 : 52)),
                trailLength: 210,
                trailTimer: 0,
                trail: []
            };
        });

        this.items.forEach(item => this.createWorldTrail(item));
        this.updateVisuals();
    }

    createWorldTrail(item) {
        for (let i = 0; i < item.trailLength; i++) {
            const element = document.createElement("span");
            element.className = "satellite-orbit-trail";
            Object.assign(element.style, {
                position: "absolute",
                width: "2.5px",
                height: "2.5px",
                borderRadius: "50%",
                pointerEvents: "none",
                background: "rgba(79,216,255,.95)",
                boxShadow: "0 0 8px rgba(79,216,255,.85)",
                opacity: "0",
                zIndex: "2"
            });
            this.world.appendChild(element);
            item.trail.push({ element, x: 0, y: 0, z: 0, initialized: false });
        }
    }

    update(dt) {
        if (!this.items.length) return;
        const planet = this.getPlanetWorldPosition();

        for (const item of this.items) {
            item.angle += item.speed * dt;
            item.trailTimer += dt;

            if (item.trailTimer >= .5) {
                item.trailTimer = 0;
                this.recordWorldPosition(item, planet);
            }

            this.updateVisual(item);
            this.renderWorldTrail(item);
        }
    }

    getPosition(item) {
        const angle = radians(item.angle);
        return {
            x: Math.sin(angle) * item.radius,
            z: Math.cos(angle) * item.depth
        };
    }

    getPlanetWorldPosition() {
        return {
            x: this.wrapper.offsetLeft,
            y: this.wrapper.offsetTop
        };
    }

    recordWorldPosition(item, planet) {
        const satellite = this.getPosition(item);

        for (let i = item.trail.length - 1; i > 0; i--) {
            item.trail[i].x = item.trail[i - 1].x;
            item.trail[i].y = item.trail[i - 1].y;
            item.trail[i].z = item.trail[i - 1].z;
            item.trail[i].initialized = item.trail[i - 1].initialized;
        }

        item.trail[0].x = planet.x + satellite.x;
        item.trail[0].y = planet.y;
        item.trail[0].z = satellite.z;
        item.trail[0].initialized = true;
    }

    renderWorldTrail(item) {
        item.trail.forEach((point, index) => {
            if (!point.initialized) {
                point.element.style.opacity = "0";
                return;
            }

            const fade = 1 - index / item.trail.length;
            const depth = clamp((point.z + item.depth) / (item.depth * 2), 0, 1);

            point.element.style.left = `${point.x}px`;
            point.element.style.top = `${point.y}px`;
            point.element.style.transform = `translate(-50%,-50%) translate3d(0,0,${point.z}px) scale(${.2 + fade * .8})`;
            point.element.style.opacity = String((fade * fade * (.35 + depth * .35)).toFixed(3));
            point.element.style.zIndex = point.z < 0 ? "1" : "20";
        });
    }

    updateVisual(item) {
        const position = this.getPosition(item);
        const depth = clamp((position.z + item.depth) / (item.depth * 2), 0, 1);
        const scale = .62 + depth * .38;

        item.satellite.style.transform = `translate3d(${position.x}px,0,${position.z}px) translate(-50%,-50%) scale(${scale})`;
        item.satellite.style.opacity = (item.satellite.classList.contains("link-satellite-square") ? .9 : (.38 + depth * .62)).toFixed(3);
        item.satellite.style.zIndex = position.z < 0 ? "1" : "10";
    }

    updateVisuals() {
        this.items.forEach(item => this.updateVisual(item));
    }
}

window.Satellite = Satellite;
