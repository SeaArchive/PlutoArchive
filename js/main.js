/*
============================================================
Pluto Archive
main.js
============================================================
*/

"use strict";

window.addEventListener("DOMContentLoaded", () => {

    // =====================================================
    // Engine
    // =====================================================

    window.engine = new Engine();

    // =====================================================
    // Resize
    // =====================================================

    window.addEventListener("resize", () => {

        engine.onResize();

    });

    // =====================================================
    // Keyboard
    // =====================================================

    window.addEventListener("keydown", (event) => {

        switch (event.key) {

            // ESC
            case "Escape":

                engine.clearSelection();

                break;

            // Space
            case " ":

                event.preventDefault();

                if (engine.running)
                    engine.stop();
                else
                    engine.start();

                break;

            // F11 (디버그용)
            case "F11":

                console.clear();

                break;

        }

    });

    // =====================================================
    // Planet Navigation
    // =====================================================

    engine.planets.forEach(planet => {

        planet.element.addEventListener("dblclick", () => {

            planet.navigate();

        });

    });

    // =====================================================
    // Auto Start
    // =====================================================

    engine.start();

    console.log(
        "%cPluto Archive",
        "color:#4fdcff;font-size:22px;font-weight:bold;"
    );

    console.log(
        "Engine Started"
    );

    console.log(
        `Orbits : ${engine.orbits.length}`
    );

    console.log(
        `Planets : ${engine.planets.length}`
    );

});
