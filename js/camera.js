/*
============================================================
Null Archive
camera.js
============================================================
*/

"use strict";

class Camera {

    constructor() {

        this.element = document.getElementById("camera");

        // -------------------------------------------------
        // Position
        // -------------------------------------------------

        this.x = 0;
        this.y = 0;

        this.targetX = 0;
        this.targetY = 0;

        // -------------------------------------------------
        // Rotation
        // -------------------------------------------------

        this.rotationX = 0;
        this.rotationY = 0;

        this.targetRotationX = 0;
        this.targetRotationY = 0;

        // -------------------------------------------------
        // Scale
        // -------------------------------------------------

        this.scale = 1;
        this.targetScale = 1;

        // -------------------------------------------------
        // Focus
        // -------------------------------------------------

        this.focusPlanet = null;

        this.followSpeed = 5;

        // -------------------------------------------------
        // Strength
        // -------------------------------------------------

        this.parallaxStrength = 35;
        this.rotationStrength = 3;

        this.enabled = true;

    }

    /* =====================================================
        UPDATE
    ===================================================== */

    update(deltaTime) {

        if (!this.enabled)
            return;

        this.updateTarget();

        this.x = damp(
            this.x,
            this.targetX,
            this.followSpeed,
            deltaTime
        );

        this.y = damp(
            this.y,
            this.targetY,
            this.followSpeed,
            deltaTime
        );

        this.rotationX = damp(
            this.rotationX,
            this.targetRotationX,
            6,
            deltaTime
        );

        this.rotationY = damp(
            this.rotationY,
            this.targetRotationY,
            6,
            deltaTime
        );

        this.scale = damp(
            this.scale,
            this.targetScale,
            6,
            deltaTime
        );

        this.render();

    }

    /* =====================================================
        TARGET
    ===================================================== */

    updateTarget() {

        if (this.focusPlanet) {

            this.targetX = -this.focusPlanet.x;
            this.targetY = -this.focusPlanet.y;

            return;

        }

        this.targetX =
            -mouse.normalX * this.parallaxStrength;

        this.targetY =
            -mouse.normalY * this.parallaxStrength;

        this.targetRotationY =
            mouse.normalX * this.rotationStrength;

        this.targetRotationX =
            -mouse.normalY * this.rotationStrength;

    }

    /* =====================================================
        RENDER
    ===================================================== */

    render() {

        this.element.style.transform =

            `
            translate(
                calc(-50% + ${this.x}px),
                calc(-50% + ${this.y}px)
            )

            perspective(1800px)

            rotateX(${this.rotationX}deg)

            rotateY(${this.rotationY}deg)

            scale(${this.scale})
            `;

    }

    /* =====================================================
        FOCUS
    ===================================================== */

    focus(planet) {

        this.focusPlanet = planet;

        this.targetScale = 1.35;

    }

    clearFocus() {

        this.focusPlanet = null;

        this.targetScale = 1;

    }



    /* =====================================================
        ZOOM
    ===================================================== */

    zoom(value) {

        this.targetScale = value;

    }

    resetZoom() {

        this.targetScale = 1;

    }

    /* =====================================================
        ENABLE
    ===================================================== */

    enable() {

        this.enabled = true;

    }

    disable() {

        this.enabled = false;

    }

}

window.camera = new Camera();
