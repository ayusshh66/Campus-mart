import { useCallback, useEffect, useRef } from "react";

// Based on the provided Kinetic Particle Fabric component.
// Original mesh physics and visuals; demonstration text/buttons removed.

interface Vector3 {
    x: number;
    y: number;
    z: number;
}

interface PhysicsNode {
    curr: Vector3;
    prev: Vector3;
    base: Vector3;
    proj: { x: number; y: number; scale: number; alpha: number };
    pinned: boolean;
    excitation: number;
}

interface StructuralConstraint {
    p1: number;
    p2: number;
    length: number;
}

export function KineticFabricBackground() {
    const containerRef = useRef<HTMLDivElement | null>(null);
    const canvasRef = useRef<HTMLCanvasElement | null>(null);

    const pointerRef = useRef({
        x: -2000,
        y: -2000,
        prevX: -2000,
        prevY: -2000,
        vx: 0,
        vy: 0,
        targetAngleX: 0.15,
        targetAngleY: 0.0,
        angleX: 0.15,
        angleY: 0.0,
        radius: 190,
        isDown: false,
        shockwaves: [] as { x: number; y: number; radius: number; maxRadius: number; strength: number }[],
    });

    const nodesRef = useRef<PhysicsNode[]>([]);
    const linksRef = useRef<StructuralConstraint[]>([]);
    const dimensionsRef = useRef({ width: 0, height: 0 });

    const buildMesh = useCallback(() => {
        const { width, height } = dimensionsRef.current;
        if (width === 0 || height === 0) return;

        const spacing = 38;
        const cols = Math.ceil((width * 1.2) / spacing) + 1;
        const rows = Math.ceil((height * 1.2) / spacing) + 1;

        const nodes: PhysicsNode[] = [];
        const links: StructuralConstraint[] = [];
        const grid: number[][] = [];

        const startX = -(cols * spacing) / 2;
        const startY = -(rows * spacing) / 2;

        let index = 0;
        for (let j = 0; j < rows; j++) {
            grid[j] = [];
            for (let i = 0; i < cols; i++) {
                const bx = startX + i * spacing;
                const by = startY + j * spacing;
                const bz = 0;

                const isPinned = i === 0 || i === cols - 1 || j === 0 || j === rows - 1;

                nodes.push({
                    curr: { x: bx, y: by, z: bz },
                    prev: { x: bx, y: by, z: bz },
                    base: { x: bx, y: by, z: bz },
                    proj: { x: 0, y: 0, scale: 1, alpha: 1 },
                    pinned: isPinned,
                    excitation: 0,
                });

                grid[j][i] = index++;
            }
        }

        for (let j = 0; j < rows; j++) {
            for (let i = 0; i < cols; i++) {
                const currIdx = grid[j][i];

                if (i < cols - 1) {
                    links.push({ p1: currIdx, p2: grid[j][i + 1], length: spacing });
                }
                if (j < rows - 1) {
                    links.push({ p1: currIdx, p2: grid[j + 1][i], length: spacing });
                }
                if (i < cols - 1 && j < rows - 1) {
                    links.push({ p1: currIdx, p2: grid[j + 1][i + 1], length: Math.SQRT2 * spacing });
                }
            }
        }

        nodesRef.current = nodes;
        linksRef.current = links;
    }, []);

    useEffect(() => {
        const container = containerRef.current;
        const canvas = canvasRef.current;
        if (!container || !canvas) return;

        const ctx = canvas.getContext("2d", { alpha: false });
        if (!ctx) return;

        const resizeObserver = new ResizeObserver((entries) => {
            for (const entry of entries) {
                const rect = entry.contentRect;
                const dpr = Math.min(window.devicePixelRatio || 1, 2);

                dimensionsRef.current = { width: rect.width, height: rect.height };
                canvas.width = rect.width * dpr;
                canvas.height = rect.height * dpr;
                canvas.style.width = `${rect.width}px`;
                canvas.style.height = `${rect.height}px`;

                ctx.setTransform(1, 0, 0, 1, 0, 0);
                ctx.scale(dpr, dpr);
                buildMesh();
            }
        });

        resizeObserver.observe(container);
        return () => resizeObserver.disconnect();
    }, [buildMesh]);

    useEffect(() => {
        const canvas = canvasRef.current;
        if (!canvas) return;

        const ctx = canvas.getContext("2d", { alpha: false });
        if (!ctx) return;

        let animId = 0;
        let time = 0;

        const loop = () => {
            time += 0.016;
            const { width, height } = dimensionsRef.current;
            const nodes = nodesRef.current;
            const links = linksRef.current;
            const pointer = pointerRef.current;

            pointer.vx = (pointer.x - pointer.prevX) * 0.4;
            pointer.vy = (pointer.y - pointer.prevY) * 0.4;
            pointer.prevX = pointer.x;
            pointer.prevY = pointer.y;

            const pointerSpeed = Math.min(Math.sqrt(pointer.vx * pointer.vx + pointer.vy * pointer.vy), 40);

            pointer.angleX += (pointer.targetAngleX - pointer.angleX) * 0.05;
            pointer.angleY += (pointer.targetAngleY - pointer.angleY) * 0.05;

            const cosX = Math.cos(pointer.angleX);
            const sinX = Math.sin(pointer.angleX);
            const cosY = Math.cos(pointer.angleY);
            const sinY = Math.sin(pointer.angleY);

            const bgColor = "#09090b";
            const strokeColor = "255, 255, 255";

            ctx.fillStyle = bgColor;
            ctx.fillRect(0, 0, width, height);

            for (let s = pointer.shockwaves.length - 1; s >= 0; s--) {
                const sw = pointer.shockwaves[s];
                sw.radius += 12;
                sw.strength *= 0.94;
                if (sw.radius > sw.maxRadius || sw.strength < 0.01) {
                    pointer.shockwaves.splice(s, 1);
                }
            }

            for (let i = 0; i < nodes.length; i++) {
                const n = nodes[i];
                if (n.pinned) continue;

                const vx = (n.curr.x - n.prev.x) * 0.955;
                const vy = (n.curr.y - n.prev.y) * 0.955;
                const vz = (n.curr.z - n.prev.z) * 0.955;

                n.prev.x = n.curr.x;
                n.prev.y = n.curr.y;
                n.prev.z = n.curr.z;

                n.curr.x += vx;
                n.curr.y += vy;
                n.curr.z += vz;

                const fluidZ =
                    Math.sin(n.base.x * 0.009 + time) * 16 +
                    Math.cos(n.base.y * 0.011 + time * 1.2) * 12;

                n.curr.x += (n.base.x - n.curr.x) * 0.038;
                n.curr.y += (n.base.y - n.curr.y) * 0.038;
                n.curr.z += (n.base.z + fluidZ - n.curr.z) * 0.038;

                n.excitation *= 0.92;
            }

            const fov = 620;
            const cx = width / 2;
            const cy = height / 2;

            for (let i = 0; i < nodes.length; i++) {
                const n = nodes[i];

                const rx1 = n.curr.x * cosY + n.curr.z * sinY;
                const ry1 = n.curr.y;
                const rz1 = -n.curr.x * sinY + n.curr.z * cosY;

                const rx2 = rx1;
                const ry2 = ry1 * cosX - rz1 * sinX;
                const rz2 = ry1 * sinX + rz1 * cosX + 460;

                const scale = fov / Math.max(1, rz2);
                n.proj.x = cx + rx2 * scale;
                n.proj.y = cy + ry2 * scale;
                n.proj.scale = scale;
                n.proj.alpha = Math.min(1, Math.max(0.08, (scale - 0.45) * 1.4));

                if (!n.pinned) {
                    const dx = n.proj.x - pointer.x;
                    const dy = n.proj.y - pointer.y;
                    const dist = Math.sqrt(dx * dx + dy * dy);

                    if (dist < pointer.radius && dist > 0) {
                        const ratio = 1 - dist / pointer.radius;
                        const force = ratio * (pointer.isDown ? 42 : 22) + pointerSpeed * 0.4;
                        const angle = Math.atan2(dy, dx);

                        n.curr.x += (Math.cos(angle) * force * 0.8) / n.proj.scale;
                        n.curr.y += (Math.sin(angle) * force * 0.8) / n.proj.scale;
                        n.curr.z -= (force * 2.8) / n.proj.scale;
                        n.excitation = Math.max(n.excitation, ratio);
                    }

                    for (let s = 0; s < pointer.shockwaves.length; s++) {
                        const sw = pointer.shockwaves[s];
                        const swDx = n.proj.x - sw.x;
                        const swDy = n.proj.y - sw.y;
                        const swDist = Math.sqrt(swDx * swDx + swDy * swDy);
                        const ringDelta = Math.abs(swDist - sw.radius);

                        if (ringDelta < 45) {
                            const impulse = (1 - ringDelta / 45) * sw.strength * 28;
                            n.curr.z += impulse / n.proj.scale;
                            n.excitation = Math.max(n.excitation, 0.8);
                        }
                    }
                }
            }

            const relaxationPasses = 3;
            for (let p = 0; p < relaxationPasses; p++) {
                for (let i = 0; i < links.length; i++) {
                    const link = links[i];
                    const na = nodes[link.p1];
                    const nb = nodes[link.p2];

                    const dx = nb.curr.x - na.curr.x;
                    const dy = nb.curr.y - na.curr.y;
                    const dz = nb.curr.z - na.curr.z;
                    const dist = Math.sqrt(dx * dx + dy * dy + dz * dz);
                    const diff = (dist - link.length) / (dist || 1);

                    if (!na.pinned) {
                        na.curr.x += dx * 0.5 * diff;
                        na.curr.y += dy * 0.5 * diff;
                        na.curr.z += dz * 0.5 * diff;
                    }
                    if (!nb.pinned) {
                        nb.curr.x -= dx * 0.5 * diff;
                        nb.curr.y -= dy * 0.5 * diff;
                        nb.curr.z -= dz * 0.5 * diff;
                    }
                }
            }

            for (let i = 0; i < links.length; i++) {
                const link = links[i];
                const na = nodes[link.p1];
                const nb = nodes[link.p2];

                const avgScale = (na.proj.scale + nb.proj.scale) / 2;
                const avgAlpha = (na.proj.alpha + nb.proj.alpha) / 2;
                const isExcited = na.excitation > 0.1 || nb.excitation > 0.1;

                if (isExcited) {
                    const glow = Math.max(na.excitation, nb.excitation);
                    ctx.strokeStyle = `rgba(198, 222, 65, ${Math.min(1, 0.4 + glow * 0.6)})`;
                    ctx.lineWidth = (0.8 + glow * 1.2) * avgScale;
                } else {
                    ctx.strokeStyle = `rgba(${strokeColor}, ${0.12 * avgAlpha})`;
                    ctx.lineWidth = 0.75 * avgScale;
                }

                ctx.beginPath();
                ctx.moveTo(na.proj.x, na.proj.y);
                ctx.lineTo(nb.proj.x, nb.proj.y);
                ctx.stroke();
            }

            for (let i = 0; i < nodes.length; i++) {
                const n = nodes[i];
                if (n.excitation > 0.25) {
                    const r = Math.min(2.6, 1.2 + n.excitation * 2) * n.proj.scale;
                    ctx.fillStyle = "#C6DE41";
                    ctx.beginPath();
                    ctx.arc(n.proj.x, n.proj.y, r, 0, Math.PI * 2);
                    ctx.fill();
                }
            }

            animId = requestAnimationFrame(loop);
        };

        animId = requestAnimationFrame(loop);
        return () => cancelAnimationFrame(animId);
    }, []);

    // Window events reach the canvas even when the page's buttons and
    // inputs sit above it. The canvas never captures clicks or hover.
    useEffect(() => {
        const handleMove = (event: MouseEvent) => {
            const bounds = containerRef.current?.getBoundingClientRect();
            if (!bounds) return;
            const x = event.clientX - bounds.left;
            const y = event.clientY - bounds.top;
            const p = pointerRef.current;
            p.x = x;
            p.y = y;
            const normX = (x / bounds.width - 0.5) * 2;
            const normY = (y / bounds.height - 0.5) * 2;
            p.targetAngleY = normX * 0.38;
            p.targetAngleX = -normY * 0.28 + 0.15;
        };

        const handleDown = (event: MouseEvent) => {
            const bounds = containerRef.current?.getBoundingClientRect();
            if (!bounds || event.button !== 0) return;
            const x = event.clientX - bounds.left;
            const y = event.clientY - bounds.top;
            const p = pointerRef.current;
            p.isDown = true;
            p.shockwaves.push({
                x, y, radius: 10, maxRadius: 360, strength: 1.0,
            });
        };

        const handleUp = () => {
            pointerRef.current.isDown = false;
        };

        const handleLeave = () => {
            const p = pointerRef.current;
            p.x = -2000;
            p.y = -2000;
            p.isDown = false;
            p.targetAngleX = 0.15;
            p.targetAngleY = 0;
        };

        window.addEventListener("mousemove", handleMove, { passive: true });
        window.addEventListener("mousedown", handleDown);
        window.addEventListener("mouseup", handleUp);
        document.addEventListener("mouseleave", handleLeave);
        return () => {
            window.removeEventListener("mousemove", handleMove);
            window.removeEventListener("mousedown", handleDown);
            window.removeEventListener("mouseup", handleUp);
            document.removeEventListener("mouseleave", handleLeave);
        };
    }, []);

    return (
        <div
            ref={containerRef}
            aria-hidden="true"
            className="pointer-events-none fixed inset-0 -z-10 overflow-hidden bg-[#09090b]"
        >
            <canvas
                ref={canvasRef}
                className="absolute inset-0 block h-full w-full"
            />
        </div>
    );
}

export default KineticFabricBackground;
