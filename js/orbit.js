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
        Object.assign(this.trailCanvas.style,{position:"absolute",inset:"0",width:"100%",height:"100%",pointerEvents:"none",zIndex:"1"});
        this.element.appendChild(this.trailCanvas);
        element.querySelectorAll(".planet-wrapper").forEach(wrapper=>this.planets.push(new Planet(wrapper,this)));
        this.initialize();
    }
    initialize(){
        this.element.style.width=`${this.radius*2}px`;
        this.element.style.height=`${this.radius*2}px`;
        this.element.style.left="50%";
        this.element.style.top="50%";
        this.element.style.transform=`translate(-50%,-50%) rotateX(${this.tilt}deg)`;
        this.resizeTrailCanvas();
    }
    resizeTrailCanvas(){
        const dpr=Math.min(window.devicePixelRatio||1,2);
        this.trailCanvas.width=Math.round(this.radius*2*dpr);
        this.trailCanvas.height=Math.round(this.radius*2*dpr);
        this.trailCanvas.getContext("2d").setTransform(dpr,0,0,dpr,0,0);
    }
    update(dt){
        if(!this.enabled)return;
        this.currentSpeed=damp(this.currentSpeed,this.targetSpeed,5,dt/60);
        this.rotation+=this.currentSpeed*dt;
        this.updatePlanets(dt);
        this.renderTrails();
    }
    updatePlanets(dt){
        for(const planet of this.planets){
            const angle=radians(planet.baseAngle+this.rotation*planet.orbitMultiplier);
            planet.setPosition(Math.cos(angle)*this.radius+this.radius,Math.sin(angle)*this.radius+this.radius);
            planet.update(dt);
        }
    }
    renderTrails(){
        const ctx=this.trailCanvas.getContext("2d"),size=this.radius*2,cx=this.radius,cy=this.radius;
        ctx.clearRect(0,0,size,size);
        const trails=[
            {length:1.75,width:3.2,alpha:.62},
            {length:.92,width:2.35,alpha:.48},
            {length:.48,width:1.7,alpha:.38}
        ];
        for(const planet of this.planets){
            const head=radians(planet.baseAngle+this.rotation*planet.orbitMultiplier);
            for(const trail of trails){
                const segments=56;
                for(let i=0;i<segments;i++){
                    const a0=head-(i/segments)*trail.length;
                    const a1=head-((i+1)/segments)*trail.length;
                    const fade=Math.pow(1-i/segments,1.65);
                    ctx.beginPath();
                    ctx.moveTo(cx+Math.cos(a0)*this.radius,cy+Math.sin(a0)*this.radius);
                    ctx.lineTo(cx+Math.cos(a1)*this.radius,cy+Math.sin(a1)*this.radius);
                    ctx.lineWidth=trail.width*(.55+.45*fade);
                    ctx.lineCap="round";
                    ctx.strokeStyle=`rgba(79,216,255,${trail.alpha*fade})`;
                    ctx.shadowBlur=8*fade;
                    ctx.shadowColor=`rgba(79,216,255,${.8*fade})`;
                    ctx.stroke();
                }
            }
        }
        ctx.shadowBlur=0;
    }
    setSpeed(speed){this.targetSpeed=speed;}
    resetSpeed(){this.targetSpeed=this.baseSpeed;}
    requestSlow(){this.hoverCount++;this.targetSpeed=this.baseSpeed*.05;}
    releaseSlow(){this.hoverCount--;if(this.hoverCount<=0){this.hoverCount=0;this.targetSpeed=this.baseSpeed;}}
    setSelected(selected){this.selected=selected;this.element.classList.toggle("is-selected",selected);}
    addPlanet(wrapper){const planet=new Planet(wrapper,this);this.planets.push(planet);return planet;}
    removePlanet(planet){const index=this.planets.indexOf(planet);if(index!==-1)this.planets.splice(index,1);}
    getPlanet(name){return this.planets.find(p=>p.name===name);}
    enable(){this.enabled=true;}
    disable(){this.enabled=false;}
}
