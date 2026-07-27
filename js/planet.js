/*
============================================================
Null Archive
planet.js
============================================================
*/

class Planet {

    constructor(wrapper, orbit) {

        this.wrapper = wrapper;
        this.orbit = orbit;

        this.element = wrapper.querySelector(".planet");
        this.label = wrapper.querySelector(".planet-label");
        this.highlight = wrapper.querySelector(".planet-highlight");
        this.ring = wrapper.querySelector(".planet-ring");

        // -------------------------
        // DATA
        // -------------------------

        this.name = wrapper.dataset.name || "";
        this.link = wrapper.dataset.link || "#";

        this.baseAngle = Number(wrapper.dataset.angle || 0);
        this.angle = this.baseAngle;

        this.size = Number(wrapper.dataset.size || 60);

        this.orbitMultiplier =
            Number(wrapper.dataset.orbitSpeed || 1);

        this.spinSpeed =
            Number(wrapper.dataset.spinSpeed || 0.15);

        // -------------------------
        // STATE
        // -------------------------

        this.x = 0;
        this.y = 0;

        this.rotation = 0;

        this.scale = 1;
        this.targetScale = 1;

        this.hover = false;
        this.selected = false;
        this.enabled = true;

        this.hoverTimer = 0;

        this.initialize();
        this.bindEvents();

    }

    // ========================================================
    // INITIALIZE
    // ========================================================

    initialize() {

        this.element.style.width =
            this.size + "px";

        this.element.style.height =
            this.size + "px";

        this.wrapper.style.position = "absolute";

    }

    // ========================================================
    // EVENTS
    // ========================================================

    bindEvents() {

        this.element.addEventListener("mouseenter", () => {

            this.hover = true;
            this.targetScale = 1.25;

            if (this.orbit)
                this.orbit.requestSlow();

        });

        this.element.addEventListener("mouseleave", () => {

            this.hover = false;
            this.targetScale = 1.0;

            if (this.orbit)
                this.orbit.releaseSlow();

        });

        this.element.addEventListener("click", () => {

            this.selected = true;

            if (window.engine)
                window.engine.selectPlanet(this);

        });

    }

    // ========================================================
    // UPDATE
    // ========================================================

    update(dt) {

        if (!this.enabled)
            return;

        this.updateRotation(dt);

        this.updateScale(dt);

        this.updateVisual();

    }

    // ========================================================
    // ROTATION
    // ========================================================

    updateRotation(dt) {

        this.rotation +=
            this.spinSpeed * dt;

    }

    // ========================================================
    // SCALE
    // ========================================================

    updateScale(dt) {

        this.scale = lerp(

            this.scale,

            this.targetScale,

            0.12

        );

    }

    // ========================================================
    // VISUAL
    // ========================================================

    updateVisual() {

        this.element.style.transform =

            `translate(-50%, -50%)
             rotate(${this.rotation}deg)
             scale(${this.scale})`;

        this.label.style.opacity =
            this.hover ? "1" : "0";

        this.label.style.transform =

            this.hover

            ? "translate(-50%,6px)"

            : "translate(-50%,0px)";

    }

    // ========================================================
    // POSITION
    // ========================================================

    setPosition(x, y) {

        this.x = x;
        this.y = y;

        this.wrapper.style.left =
            x + "px";

        this.wrapper.style.top =
            y + "px";

    }

    // ========================================================
    // FOCUS
    // ========================================================

    focus() {

        this.targetScale = 1.55;

    }

    unfocus() {

        this.targetScale =

            this.hover

            ? 1.25

            : 1.0;

    }

    // ========================================================
    // NAVIGATION
    // ========================================================

    navigate() {

        if (!this.link)
            return;

        if (this.link === "#")
            return;

        window.location.href =
            this.link;

    }

    // ========================================================
    // ENABLE
    // ========================================================

    enable() {

        this.enabled = true;

    }

    disable() {

        this.enabled = false;

    }

    // ========================================================
    // DESTROY
    // ========================================================

    destroy() {

        this.wrapper.remove();

    }

}
