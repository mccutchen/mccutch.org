const RunSketch = (function () {
    'use strict';

    class Target {
        constructor(w, h, range) {
            this.w = w;
            this.h = h;
            this.range = range;

            this.x = rand(0, w);
            this.y = rand(0, h);
            this.step();
        }
        step() {
            this.x += rand(-this.range, this.range);
            this.y += rand(-this.range, this.range);

            if (this.x < 0) { this.x += this.w; }
            if (this.x > this.w) { this.x %= this.w; }
            if (this.y < 0) { this.y += this.h; }
            if (this.y > this.h) { this.y %= this.h; }
        }
    }

    class Chaser {
        constructor(w, h, target, f, e, r) {
            this.target = target;
            this.f = f; // friction
            this.e = e; // elasticity
            this.r = r; // repulsion

            this.x = (w / 2) + rand(-20, 20);
            this.y = h / 2 + rand(-20, 20);
            this.vx = 0;
            this.vy = 0;
        }

        step(others) {
            // find distance to target
            let dx = this.target.x - this.x;
            let dy = this.target.y - this.y;

            // adjust velocity based on distance to target
            this.vx = (this.vx + (dx / this.f)) / this.e;
            this.vy = (this.vy + (dy / this.f)) / this.e;

            // add repulsion
            for (var other of others) {
                if (this === other) {
                    continue;
                }
                dx = Math.abs(other.x - this.x);
                dy = Math.abs(other.y - this.y);
                if (dx < this.r) {
                    this.vx = (this.vx + (dx / this.f)) / this.e;
                }
                if (dy < this.r) {
                    this.vy = (this.vy + (dy / this.f)) / this.e;
                }
            }

            // adjust position
            this.x += this.vx;
            this.y += this.vy;
        }
    }

    function render(ctx, w, h, targets, chasers) {
        ctx.fillStyle = '#eee';
        ctx.fillRect(0, 0, w, h);

        const targetSize = 4;
        const targetOffset = targetSize / 2;
        for (var target of targets) {
            let x = (target.x | 0) - targetOffset;
            let y = (target.y | 0) - targetOffset;
            ctx.fillStyle = '#900';
            ctx.fillRect(x, y, targetSize, targetSize);
        }

        const chaserSize = 8;
        const chaserOffset = chaserSize / 2;
        for (var chaser of chasers) {
            let x = (chaser.x | 0) - chaserOffset;
            let y = (chaser.y | 0) - chaserOffset;
            ctx.fillStyle = '#333';
            ctx.fillRect(x, y, chaserSize, chaserSize);
        }
    }

    function setupCanvas(canvas) {
        var rect = canvas.getBoundingClientRect();
        canvas.width = rect.width;
        canvas.height = rect.height;
    }

    function rand(min, max) {
        return (Math.random() * (max - min) + min) | 0;
    }

    return function RunSketch(canvas) {
        const ctx = canvas.getContext("2d");
        setupCanvas(canvas);

        const w = canvas.width;
        const h = canvas.height;

        const targets = [];
        const chasers = [];

        let target = new Target(w, h, 100);
        targets.push(target);

        for (var i = 0; i < 3; i++) {
            chasers.push(new Chaser(w, h, target, 150, 1.9, 0));
        }

        const targetInterval = 500;
        const chaserInterval = 20;

        // update targets on a relatively slow interval
        window.setInterval(() => {
            for (var target of targets) {
                target.step();
            }
        }, targetInterval);

        // update our chasers on every animation frame
        window.setInterval(() => {
            for (var chaser of chasers) {
                chaser.step(chasers);
            }
            render(ctx, w, h, targets, chasers);
        }, chaserInterval);

        // (function loop() {
        //     window.requestAnimationFrame(function frame() {
        //         for (var chaser of chasers) {
        //             chaser.step(chasers);
        //         }
        //         render(ctx, w, h, targets, chasers);
        //         loop();
        //     });
        // })();
    }
})();
