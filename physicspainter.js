const RunSketch = (function () {
    'use strict';

    const TARGET_STEP_RANGE = 25; // how far can a target step in one direction
    const TARGET_STEP_PERIOD = 2; // number of time ticks that pass between steps, to decouple target updates from chaser updates
    const TARGET_CHANGE_PROBABILITY = 0.75; // probability that a target will change direction
    const TARGET_LEAP_PROBABILITY = 0.1; // probability that a target will take a larger step

    const RENDER_MIN_LINE_WIDTH = 4;
    const RENDER_MAX_LINE_WIDTH = 40;
    const RENDER_LINE_WIDTH_FACTOR = 0.8; // makes line width proportional to chaser velocity
    const RENDER_DEBUG = false; // render targets in addition to chasers

    const CHASER_COUNT = 5;
    const CHASER_FRICTION = 150;
    const CHASER_ELASTICITY = 1.1;
    const CHASER_REPULSION = RENDER_MIN_LINE_WIDTH;

    const JITTER_FRICTION = CHASER_FRICTION * 0.1;
    const JITTER_ELASTICITY = CHASER_ELASTICITY * 0.1;
    const JITTER_REPULSTION = CHASER_REPULSION * 0.1;

    // Initial palette is pink:
    // https://coolors.co/ffc2d4-ff99b8-ff5c8d-ff3374-ff709b-ff99b8
    const COLORS = [
        [342, 100, 88],
        [342, 100, 80],
        [342, 100, 68],
        [341, 100, 60],
        [342, 100, 72],
        [342, 100, 80],
    ]

    // Entrypoint
    function RunSketch(canvas) {
        const [ctx, w, h] = setupCanvas(canvas);

        const targets = [];
        const chasers = [];

        // We have two tiers of targets: This "root" target is a normal random
        // walker, chased by a tier of "meta target" chasers that are in turn
        // treated as targets for the final tier of rendered chasers.
        //
        // This takes advantage of the fact that a chaser can itself be used as
        // a target, since a target need to have x and y properties and a
        // step(t) method, and allows for more complex motion.
        const target = new Target(w, h);
        targets.push(target);

        // For each chaser, we build a meta target that chases the target, and
        // use that as the target for the chaser that will be rendered. Only
        // chasers added to the chasers array will be rendered.
        for (let i = 0; i < CHASER_COUNT; i++) {
            let metaTarget = new Chaser(
                target,
                w,
                h,
                jittered(CHASER_FRICTION * 0.1, JITTER_FRICTION),
                jittered(1.00, JITTER_ELASTICITY),
                jittered(100, JITTER_REPULSTION),
            );
            targets.push(metaTarget);

            let chaser = new Chaser(
                metaTarget,
                w,
                h,
                jittered(CHASER_FRICTION, JITTER_FRICTION),
                jittered(CHASER_ELASTICITY, JITTER_ELASTICITY),
                jittered(CHASER_REPULSION, JITTER_REPULSTION),
            );
            chasers.push(chaser);
        }

        const renderer = new Renderer(ctx, w, h, targets, chasers);

        // Kick off our animation loop, which calls itself recursively using
        // requestAnimationFrame.
        (function loop(t) {
            window.requestAnimationFrame(function frame() {
                for (let target of targets) {
                    target.step(t, targets);
                }
                for (let chaser of chasers) {
                    chaser.step(t, chasers);
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
        step(t) {
            // only step every N frames
            if (t % TARGET_STEP_PERIOD !== 0) {
                return;
            }

            // only change direction on a subset of frames, and only take a
            // larger step on a subset of that subset.
            if (Math.random() < TARGET_CHANGE_PROBABILITY) {
                let range = TARGET_STEP_RANGE;
                if (Math.random() < TARGET_LEAP_PROBABILITY) {
                    range *= 5;
                }
                this.dx = rand(-range, range);
                this.dy = rand(-range, range);
            }

            this.x += this.dx;
            this.y += this.dy;
            this.constrain();
        }

        // constrain the position of the target
        constrain() {
            this.bounce();
        }

        // constrain the position of the target by bouncing off of the walls
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

        step(t, others) {
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
            this.palette = new Palette(this.chasers);

            // track last position of each chaser
            this.lastx = this.chasers.map(chaser => chaser.x);
            this.lasty = this.chasers.map(chaser => chaser.y);
        }

        render(t) {
            let ctx = this.ctx;
            let chasers = this.chasers;

            ctx.save();

            // update color palette
            this.palette.step(t);

            // gradually fade the background to white (though for unclear
            // reasons it never goes to white as intended and instead always
            // leaves some muted remnants of the past)
            if (t % 5 === 0) {
                ctx.fillStyle = 'rgba(255, 255, 255, 0.01)';
                ctx.fillRect(0, 0, this.w, this.h);
            }

            ctx.lineCap = 'round';
            ctx.lineJoin = 'round';
            for (let i = 0; i < chasers.length; i++) {
                let chaser = chasers[i];
                let lastx = this.lastx[i];
                let lasty = this.lasty[i];
                let color = this.palette.get(i);

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

            if (RENDER_DEBUG) {
                let targetSize = 2;
                let targetOffset = targetSize / 2;
                let targetColor = '#333';
                ctx.fillStyle = targetColor;
                for (let target of this.targets) {
                    ctx.fillRect(target.x - targetOffset, target.y - targetOffset, targetSize, targetSize);
                }
            }

            this.renderLogo(ctx);
            ctx.restore();
        }

        renderLogo(ctx) {
            ctx.font = "bold 2em 'Helvetica Neue', helvetica, sans-serif";
            ctx.textAlign = 'center';
            ctx.textBaseline = 'middle';
            ctx.fillStyle = '#fff';
            ctx.fillText('HOWDY', this.w / 2, this.h / 2);
        }
    }

    class Palette {
        constructor(chasers) {
            // Pick a color for each chaser
            this.colors = chasers.map((_, i) => {
                return COLORS[i % COLORS.length]; s
            });
        }
        get(id) {
            let [h, s, l] = this.colors[id % this.colors.length];
            return `hsl(${h}, ${s}%, ${l}%)`;
        }
        step(t) {
            if (t % 3 != 0) {
                return;
            }
            this.colors = this.colors.map(([h, s, l]) => {
                let d = rand(-2, 2) | 0;
                return [h + d, s, l];
            });
        }
    }

    function setupCanvas(canvas) {
        let dpr = window.devicePixelRatio || 1;
        let rect = canvas.getBoundingClientRect();
        canvas.width = rect.width * dpr;
        canvas.height = rect.height * dpr;

        let ctx = canvas.getContext('2d');
        ctx.scale(dpr, dpr);

        return [ctx, rect.width, rect.height];
    }

    function rand(min, max) {
        return (Math.random() * (max - min) + min) | 0;
    }

    function jittered(n, amount) {
        return n + (rand(-1, 1) * amount);
    }

    return RunSketch;
})();
