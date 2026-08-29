/*
============================================================
Pluto Archive
link-card.js
Link Planet horizontal card orbit
============================================================
*/

"use strict";

class LinkCard {

    constructor(planetWrapper) {

        this.wrapper = planetWrapper;
        this.cards = Array.from(
            planetWrapper.querySelectorAll(".link-card")
        );

        if (!this.cards.length)
            return;

        this.angle = Number(
            planetWrapper.dataset.cardAngle || 0
        );

        // The current HTML value is kept at 0.10, but the visual speed is
        // intentionally increased for this prototype.
        this.speed = Number(
            planetWrapper.dataset.cardSpeed || 0.18
        ) * 1.8;

        this.radius = Number(
            planetWrapper.dataset.cardRadius || 110
        );

        this.depth = Number(
            planetWrapper.dataset.cardDepth || 72
        );

        this.hover = false;

        this.bindEvents();
        this.updateVisual();

    }

    bindEvents() {

        this.cards.forEach(card => {

            card.addEventListener("mouseenter", () => {
                this.hover = true;
            });

            card.addEventListener("mouseleave", () => {
                this.hover = false;
            });

        });

    }

    update(dt) {

        if (!this.cards.length)
            return;

        if (!this.hover) {
            this.angle += this.speed * dt;
        }

        this.updateVisual();

    }

    updateVisual() {

        const count = this.cards.length;

        this.cards.forEach((card, index) => {

            // Horizontal circle around the planet in the X/Z plane.
            // X moves left/right while Z controls front/back depth.
            const angle = radians(
                this.angle + (360 / count) * index
            );

            const x = Math.sin(angle) * this.radius;
            const z = Math.cos(angle) * this.depth;

            // 0 = furthest behind, 1 = closest to the viewer.
            const depth01 = clamp(
                (z + this.depth) / (this.depth * 2),
                0,
                1
            );

            // Perspective: front cards are larger and clearer.
            const scale =
                0.55 + depth01 * 0.45;

            const opacity =
                0.10 + depth01 * 0.90;

            // Keep rear cards behind the planet and front cards above it.
            const zIndex =
                Math.round((depth01 - 0.5) * 200);

            card.style.transform =
                `translate3d(${x}px, 0, ${z}px) ` +
                `translate(-50%, -50%) ` +
                `scale(${scale})`;

            card.style.opacity =
                opacity.toFixed(3);

            card.style.zIndex =
                String(zIndex);

            card.classList.toggle(
                "is-hovered",
                this.hover
            );

        });

    }

}

window.LinkCard = LinkCard;
