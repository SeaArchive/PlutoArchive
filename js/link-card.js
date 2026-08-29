/*
============================================================
Pluto Archive
link-card.js
Link Planet vertical card orbit
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

        this.speed = Number(
            planetWrapper.dataset.cardSpeed || 0.08
        );

        this.radius = Number(
            planetWrapper.dataset.cardRadius || 92
        );

        this.depth = Number(
            planetWrapper.dataset.cardDepth || 62
        );

        this.tilt = Number(
            planetWrapper.dataset.cardTilt || 0
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
        const tilt = radians(this.tilt);

        this.cards.forEach((card, index) => {

            // The cards travel around a vertical circle in the Y/Z plane.
            // X remains fixed, while Y moves vertically and Z controls depth.
            const angle = radians(
                this.angle + (360 / count) * index
            );

            const y = Math.sin(angle) * this.radius;
            const z = Math.cos(angle) * this.depth;

            const tiltedY =
                y * Math.cos(tilt) - z * Math.sin(tilt);

            const tiltedZ =
                y * Math.sin(tilt) + z * Math.cos(tilt);

            // 0 = furthest behind, 1 = closest to the viewer.
            const depth01 = clamp(
                (tiltedZ + this.depth) / (this.depth * 2),
                0,
                1
            );

            // Perspective: front cards are larger and clearer.
            const scale =
                0.55 + depth01 * 0.45;

            const opacity =
                0.12 + depth01 * 0.88;

            // Keep the planet between rear cards and front cards.
            // Negative values remain behind the planet; positive values
            // allow cards in front of it to pass over the planet.
            const zIndex =
                Math.round((depth01 - 0.5) * 200);

            card.style.transform =
                `translate3d(0, ${tiltedY}px, ${tiltedZ}px) ` +
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
