const RunSketch = (function () {
    'use strict';

    const TARGET_STEP_RANGE = 50;
    const TARGET_STEP_PERIOD = 20;
    const TARGET_STEP_PROBABILITY = 0.75;

    const RENDER_MIN_LINE_WIDTH = 6;
    const RENDER_MAX_LINE_WIDTH = 50;
    const RENDER_LINE_WIDTH_FACTOR = 10;

    const CHASER_REPULSION = RENDER_MIN_LINE_WIDTH;

    // Entrypoint
    function RunSketch(canvas) {
        const ctx = canvas.getContext("2d");
        setupCanvas(canvas);

        const w = canvas.width;
        const h = canvas.height;

        const targets = [];
        let target = new Target(w, h, TARGET_STEP_RANGE, TARGET_STEP_PROBABILITY);
        targets.push(target);

        const chasers = [];
        chasers.push(new Chaser('#f372cc', target, w, h, 150, 1.1, CHASER_REPULSION));
        chasers.push(new Chaser('#f8961e', target, w, h, 170, 1.08, CHASER_REPULSION));
        chasers.push(new Chaser('#f9c74f', target, w, h, 140, 1.12, CHASER_REPULSION));

        (function loop(t) {
            window.requestAnimationFrame(function frame() {
                if (t % TARGET_STEP_PERIOD === 0) {
                    for (var target of targets) {
                        target.step();
                    }
                }
                for (var chaser of chasers) {
                    chaser.step(chasers);
                }
                render(ctx, w, h, targets, chasers);
                loop(t + 1);
            });
        })(0);
    }

    class Target {
        constructor(w, h, range, stepProbability) {
            this.w = w;
            this.h = h;
            this.range = range;
            this.stepProbability = stepProbability;

            this.x = (w / 2) + rand(-this.range, this.range);
            this.y = (h / 2) + rand(-this.range, this.range);
            this.dx = 0;
            this.dy = 0;
            this.step();
        }
        step() {
            if (Math.random() < this.stepProbability) {
                this.dx = rand(-this.range, this.range);
                this.dy = rand(-this.range, this.range);
            }
            this.x += this.dx;
            this.y += this.dy;
            this.constrain();
        }
        constrain() {
            this.bounce();
        }
        bounce() {
            if (this.x < 0) {
                this.x *= -1;
                this.dx *= -1;
            }
            if (this.x > this.w) {
                this.x -= this.x % this.w;
                this.dx *= -1;
            }
            if (this.y < 0) {
                this.y *= -1;
                this.dy *= -1;
            }
            if (this.y > this.h) {
                this.y -= this.y % this.h;
                this.dy *= -1;
            }
        }
        wrap() {
            if (this.x < 0) { this.x += this.w; }
            if (this.x > this.w) { this.x %= this.w; }
            if (this.y < 0) { this.y += this.h; }
            if (this.y > this.h) { this.y %= this.h; }
        }
    }

    class Chaser {
        constructor(color, target, w, h, f, e, r) {
            this.color = color;
            this.target = target;
            this.f = f; // friction
            this.e = e; // elasticity
            this.r = r; // repulsion

            this.x = (w / 2);
            this.y = (h / 2);
            this.lastx = this.x;
            this.lasty = this.y;
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
                dx = other.x - this.x;
                dy = other.y - this.y;
                if (Math.abs(dx) < this.r) {
                    this.vx = (this.vx - (dx / this.f)) / this.e;
                }
                if (Math.abs(dy) < this.r) {
                    this.vy = (this.vy - (dy / this.f)) / this.e;
                }
            }

            // adjust position
            this.lastx = this.x;
            this.lasty = this.y;
            this.x += this.vx;
            this.y += this.vy;
        }
    }

    function render(ctx, w, h, targets, chasers) {
        ctx.lineCap = 'round';
        ctx.lineJoin = 'round';
        for (var chaser of chasers) {
            let lineWidth = Math.max(RENDER_MIN_LINE_WIDTH, Math.min((Math.abs(chaser.vx) + Math.abs(chaser.vy) * RENDER_LINE_WIDTH_FACTOR), RENDER_MAX_LINE_WIDTH)) | 0;
            ctx.lineWidth = lineWidth;
            ctx.strokeStyle = chaser.color;

            let lastx = (chaser.lastx | 0) - lineWidth;
            let lasty = (chaser.lasty | 0) - lineWidth;
            let x = (chaser.x | 0) - lineWidth;
            let y = (chaser.y | 0) - lineWidth;

            ctx.beginPath();
            ctx.moveTo(lastx, lasty);
            ctx.lineTo(x, y);
            ctx.stroke()
        }
    }

    function debugRender(ctx, w, h, targets, chasers) {
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

    return RunSketch;
})();
