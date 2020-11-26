const RunSketch = (function () {
    'use strict';

    const TARGET_STEP_RANGE = 25;
    const TARGET_STEP_PERIOD = 1;
    const TARGET_STEP_PROBABILITY = 0.75;
    const TARGET_LEAP_PROBABILITY = 0.05;

    const RENDER_MIN_LINE_WIDTH = 6;
    const RENDER_MAX_LINE_WIDTH = 50;
    const RENDER_LINE_WIDTH_FACTOR = 10;

    const CHASER_REPULSION = RENDER_MIN_LINE_WIDTH;

    // https://coolors.co/ffe0e9-ffc2d4-ff9ebb-ff7aa2-e05780-b9375e-8a2846-602437-522e38
    const COLORS = [
        "#fadde1",
        "#ffc4d6",
        "#ffa6c1",
        "#ff87ab",
        "#ff5d8f",
        "#ff97b7",
        "#ffacc5",
        "#ffcad4",
        "#f4acb7",
    ];

    // Entrypoint
    function RunSketch(canvas) {
        const ctx = canvas.getContext("2d");
        setupCanvas(canvas);

        const w = canvas.width;
        const h = canvas.height;

        const targets = [];
        let target = new Target(w, h);
        targets.push(target);

        const chasers = [];
        chasers.push(new Chaser(target, w, h, 150, 1.1, CHASER_REPULSION));
        chasers.push(new Chaser(target, w, h, 170, 1.08, CHASER_REPULSION));
        chasers.push(new Chaser(target, w, h, 140, 1.12, CHASER_REPULSION));

        const renderer = new Renderer(ctx, w, h, targets, chasers);

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
                renderer.render(t);
                loop(t + 1);
            });
        })(0);
    }

    // Target models a biased random walk that only changes direction on a % of
    // steps. Targets serve as the target towards which chasers travel.
    class Target {
        constructor(w, h) {
            this.w = w;
            this.h = h;

            this.x = (w / 2) + rand(-TARGET_STEP_RANGE, TARGET_STEP_RANGE);
            this.y = (h / 2) + rand(-TARGET_STEP_RANGE, TARGET_STEP_RANGE);
            this.dx = 0;
            this.dy = 0;
        }
        step() {
            // only change direction on a subset of steps
            if (Math.random() < TARGET_STEP_PROBABILITY) {
                let range = TARGET_STEP_RANGE;
                if (Math.random() < TARGET_LEAP_PROBABILITY) {
                    range *= 4;
                }
                this.dx = rand(-range, range);
                this.dy = rand(-range, range);
            }
            this.x += this.dx;
            this.y += this.dy;
            this.constrain();
        }
        constrain() {
            this.bounce();
            // this.teleport();
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
    }

    // Chaser models a point that always moves towards a given target with its
    // movement governed by a crude physics implementation based on friction,
    // elasticity, and repulsion parameters.
    class Chaser {
        constructor(target, w, h, f, e, r) {
            this.target = target;
            this.f = f; // friction
            this.e = e; // elasticity
            this.r = r; // repulsion

            this.x = (w / 2);
            this.y = (h / 2);
            this.vx = 0;
            this.vy = 0;
        }

        step(others) {
            // find distance to target
            let dx = this.target.x - this.x;
            let dy = this.target.y - this.y;

            // calculate velocity based on distance to target
            this.vx = (this.vx + (dx / this.f)) / this.e;
            this.vy = (this.vy + (dy / this.f)) / this.e;

            // steer away from other chasers
            for (let other of others) {
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
            this.x += this.vx;
            this.y += this.vy;
        }
    }

    class Renderer {
        constructor(ctx, w, h, targets, chasers, palette) {
            this.ctx = ctx;
            this.w = w;
            this.h = h;
            this.targets = targets;
            this.chasers = chasers;

            // Pick a color for each chaser
            this.palette = this.chasers.map((chaser, i) => {
                return COLORS[Math.floor(Math.random() * COLORS.length)];
            });

            // track last position of each chaser
            this.lastx = this.chasers.map(chaser => chaser.x);
            this.lasty = this.chasers.map(chaser => chaser.y);
        }

        render(t) {
            let ctx = this.ctx;
            let chasers = this.chasers;

            // ctx.globalCompositeOperation = "darken";
            ctx.lineCap = 'round';
            ctx.lineJoin = 'round';
            for (let i = 0; i < chasers.length; i++) {
                let chaser = chasers[i];
                let color = this.palette[i];
                let lastx = this.lastx[i];
                let lasty = this.lasty[i];

                let lineWidth = Math.max(RENDER_MIN_LINE_WIDTH, Math.min((Math.abs(chaser.vx) + Math.abs(chaser.vy) * RENDER_LINE_WIDTH_FACTOR), RENDER_MAX_LINE_WIDTH)) | 0;
                ctx.lineWidth = lineWidth;
                ctx.strokeStyle = color;

                let x0 = lastx - lineWidth;
                let y0 = lasty - lineWidth;
                let x1 = chaser.x - lineWidth;
                let y1 = chaser.y - lineWidth;

                ctx.beginPath();
                ctx.moveTo(x0 | 0, y0 | 0);
                ctx.lineTo(x1 | 0, y1 | 0);
                ctx.stroke()

                this.lastx[i] = chaser.x;
                this.lasty[i] = chaser.y;
            }
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
