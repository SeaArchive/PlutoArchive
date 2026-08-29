/*
============================================================
Pluto Archive
link-card.js
Link Planet card depth motion
============================================================
*/

"use strict";

class LinkCard {

    constructor(planetWrapper) {

        this.wrapper = planetWrapper;
        this.card = planetWrapper.querySelector(".link-card");

        if (!this.card)
            return;

        this.angle = Number(
            planetWrapper.dataset.cardAngle || 0
        );

        this.speed = Number(
            planetWrapper.dataset.cardSpeed || 0.08
        );

        // Z-axis only: the card moves toward and away from the viewer.
        this.depth = Number(
            planetWrapper.dataset.cardDepth || 34
        );

        this.hover = false;

        this.bindEvents();
        this.updateVisual();

    }

    bindEvents() {

        this.card.addEventListener("mouseenter", () => {

            this.hover = true;

        });

        this.card.addEventListener("mouseleave", () => {

            this.hover = false;

        });

    }

    update(dt) {

        if (!this.card)
            return;

        if (!this.hover) {

            this.angle += this.speed * dt;

        }

        this.updateVisual();

    }

    updateVisual() {

        const angle = radians(this.angle);

        // X/Y stay fixed. Only Z changes, creating front/back motion.
        const z = Math.sin(angle) * this.depth;

        const depth = clamp(
            (z + this.depth) / (this.depth * 2),
            0,
            1
        );

        const scale = this.hover
            ? 1.18
            : 0.72 + depth * 0.28;

        const opacity = this.hover
            ? 1
            : 0.28 + depth * 0.72;

        this.card.style.transform =
            `translate3d(0, 0, ${z}px) ` +
            `translate(-50%, -50%) ` +
            `scale(${scale})`;

        this.card.style.opacity =
            opacity.toFixed(3);

        this.card.style.zIndex =
            String(Math.round(depth * 100));

        this.card.classList.toggle(
            "is-hovered",
            this.hover
        );

    }

}

window.LinkCard = LinkCard;
