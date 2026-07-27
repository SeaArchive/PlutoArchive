/*
============================================================
Null Archive
mouse.js
============================================================
*/

"use strict";

class Mouse {

    constructor() {

        // -------------------------------------------------
        // Position
        // -------------------------------------------------

        this.x = window.innerWidth * 0.5;
        this.y = window.innerHeight * 0.5;

        this.previousX = this.x;
        this.previousY = this.y;

        this.smoothX = this.x;
        this.smoothY = this.y;

        // 화면 중앙 기준 좌표
        this.centerX = 0;
        this.centerY = 0;

        // -1 ~ 1
        this.normalX = 0;
        this.normalY = 0;

        // 속도
        this.velocityX = 0;
        this.velocityY = 0;
        this.speed = 0;

        // 버튼
        this.left = false;
        this.middle = false;
        this.right = false;

        // 휠
        this.wheel = 0;
        this.smoothWheel = 0;

        // 화면
        this.width = window.innerWidth;
        this.height = window.innerHeight;

        this.enabled = true;

        this.initialize();

    }

    // =====================================================
    // INITIALIZE
    // =====================================================

    initialize() {

        window.addEventListener(
            "mousemove",
            this.onMouseMove.bind(this)
        );

        window.addEventListener(
            "mousedown",
            this.onMouseDown.bind(this)
        );

        window.addEventListener(
            "mouseup",
            this.onMouseUp.bind(this)
        );

        window.addEventListener(
            "mouseleave",
            this.onMouseLeave.bind(this)
        );

        window.addEventListener(
            "wheel",
            this.onWheel.bind(this),
            { passive: true }
        );

        window.addEventListener(
            "resize",
            this.onResize.bind(this)
        );

    }

    // =====================================================
    // EVENTS
    // =====================================================

    onMouseMove(event) {

        if (!this.enabled)
            return;

        this.x = event.clientX;
        this.y = event.clientY;

    }

    onMouseDown(event) {

        switch (event.button) {

            case 0:
                this.left = true;
                break;

            case 1:
                this.middle = true;
                break;

            case 2:
                this.right = true;
                break;

        }

    }

    onMouseUp(event) {

        switch (event.button) {

            case 0:
                this.left = false;
                break;

            case 1:
                this.middle = false;
                break;

            case 2:
                this.right = false;
                break;

        }

    }

    onMouseLeave() {

        this.left = false;
        this.middle = false;
        this.right = false;

    }

    onWheel(event) {

        this.wheel += event.deltaY;

    }

    onResize() {

        this.width = window.innerWidth;
        this.height = window.innerHeight;

    }

    // =====================================================
    // UPDATE
    // =====================================================

    update(deltaTime) {

        this.smoothX = damp(
            this.smoothX,
            this.x,
            10,
            deltaTime
        );

        this.smoothY = damp(
            this.smoothY,
            this.y,
            10,
            deltaTime
        );

        this.velocityX =
            this.smoothX - this.previousX;

        this.velocityY =
            this.smoothY - this.previousY;

        this.speed = Math.sqrt(

            this.velocityX * this.velocityX +

            this.velocityY * this.velocityY

        );

        this.previousX = this.smoothX;
        this.previousY = this.smoothY;

        this.centerX =
            this.smoothX - this.width * 0.5;

        this.centerY =
            this.smoothY - this.height * 0.5;

        this.normalX = clamp(
            this.centerX / (this.width * 0.5),
            -1,
            1
        );

        this.normalY = clamp(
            this.centerY / (this.height * 0.5),
            -1,
            1
        );

        this.smoothWheel = damp(
            this.smoothWheel,
            this.wheel,
            8,
            deltaTime
        );

    }

    // =====================================================
    // GETTERS
    // =====================================================

    get position() {

        return new Vector2(
            this.smoothX,
            this.smoothY
        );

    }

    get normalized() {

        return new Vector2(
            this.normalX,
            this.normalY
        );

    }

    get velocity() {

        return new Vector2(
            this.velocityX,
            this.velocityY
        );

    }

    // =====================================================
    // ENABLE / DISABLE
    // =====================================================

    enable() {

        this.enabled = true;

    }

    disable() {

        this.enabled = false;

    }

    resetWheel() {

        this.wheel = 0;
        this.smoothWheel = 0;

    }

}

// 전역 생성
window.mouse = new Mouse();
