<template>
    <div class="relative" @mouseleave="hover = null">
        <svg :viewBox="`0 0 ${W} ${H}`" class="block h-48 w-full" preserveAspectRatio="none" @mousemove="onMove">
            <line v-for="g in gridLines" :key="g.y" x1="0" :x2="W" :y1="g.y" :y2="g.y" stroke="#1c2735" stroke-width="1" vector-effect="non-scaling-stroke" />
            <rect v-for="(o, i) in offline" :key="`o${i}`" :x="o.x" y="0" :width="Math.max(o.w, 1)" :height="H" fill="#e5675f" fill-opacity="0.07" />
            <path v-for="(seg, i) in segments" :key="`a${i}`" :d="area(seg)" fill="#3fb8af" fill-opacity="0.12" />
            <path v-for="(seg, i) in segments" :key="`l${i}`" :d="line(seg)" fill="none" stroke="#3fb8af" stroke-width="2" stroke-linejoin="round" vector-effect="non-scaling-stroke" />
            <line v-if="hover" :x1="hover.x" :x2="hover.x" y1="0" :y2="H" stroke="#5d6b7c" stroke-width="1" vector-effect="non-scaling-stroke" />
        </svg>
        <span v-for="g in gridLines" :key="`t${g.y}`" class="pointer-events-none absolute left-1 -translate-y-full font-mono text-[10px] text-dim" :style="{ top: `${(g.y / H) * 100}%` }">{{ g.value }}</span>
        <div v-if="hover" class="pointer-events-none absolute top-2 z-10 whitespace-nowrap rounded-md border border-line-strong bg-nav px-2.5 py-1.5 text-xs" :style="tipStyle">
            <p class="text-dim">{{ fmtTime(hover.p.t) }}</p>
            <p class="mt-0.5 font-semibold" :class="hover.p.online ? 'text-ink' : 'text-danger'">{{ hover.p.online ? (hover.p.players ?? "?") + " players" : "Offline" }}</p>
        </div>
        <div class="mt-1.5 flex justify-between font-mono text-[10px] text-dim">
            <span>{{ fmtAxis(from) }}</span><span>{{ fmtAxis(from + (to - from) / 2) }}</span><span>now</span>
        </div>
    </div>
</template>

<script setup lang="ts">
import { computed, ref } from "vue";

type Point = { t: number; players: number | null; online: boolean };
const props = defineProps<{ points: Point[]; range: "24h" | "7d" }>();

const W = 600;
const H = 180;
const to = computed(() => Date.now());
const from = computed(() => to.value - (props.range === "7d" ? 7 * 24 : 24) * 3600_000);
const step = computed(() => (props.range === "7d" ? 3600_000 : 5 * 60_000));

const max = computed(() => {
    const m = props.points.reduce((acc, p) => Math.max(acc, p.players ?? 0), 0);
    const raw = Math.max(1, m / 4);
    const mag = 10 ** Math.floor(Math.log10(raw));
    const step = [1, 2, 5, 10].map((f) => f * mag).find((s) => s >= raw)!;
    return step * 4;
});
const gridLines = computed(() => [0.25, 0.5, 0.75, 1].map((f) => ({ y: H - f * (H - 12), value: Math.round(f * max.value) })));

const x = (t: number) => ((t - from.value) / (to.value - from.value)) * W;
const y = (v: number) => H - (v / max.value) * (H - 12);

const segments = computed(() => {
    const out: Point[][] = [];
    let cur: Point[] = [];
    let prev: Point | null = null;
    for (const p of props.points) {
        const gap = prev && p.t - prev.t > step.value * 2.5;
        if (!p.online || p.players === null || gap) {
            if (cur.length) out.push(cur);
            cur = [];
        }
        if (p.online && p.players !== null) cur.push(p);
        prev = p;
    }
    if (cur.length) out.push(cur);
    return out;
});
const offline = computed(() => props.points.filter((p) => !p.online).map((p) => ({ x: x(p.t), w: (step.value / (to.value - from.value)) * W })));

const line = (seg: Point[]) => (seg.length === 1 ? `M${x(seg[0]!.t) - 2},${y(seg[0]!.players!)}h4` : seg.map((p, i) => `${i ? "L" : "M"}${x(p.t).toFixed(1)},${y(p.players!).toFixed(1)}`).join(""));
const area = (seg: Point[]) => (seg.length < 2 ? "" : `${line(seg)}L${x(seg[seg.length - 1]!.t).toFixed(1)},${H}L${x(seg[0]!.t).toFixed(1)},${H}Z`);

const hover = ref<{ x: number; p: Point; px: number } | null>(null);
function onMove(e: MouseEvent) {
    if (!props.points.length) return;
    const rect = (e.currentTarget as SVGElement).getBoundingClientRect();
    const t = from.value + ((e.clientX - rect.left) / rect.width) * (to.value - from.value);
    let best = props.points[0]!;
    for (const p of props.points) if (Math.abs(p.t - t) < Math.abs(best.t - t)) best = p;
    hover.value = { x: x(best.t), p: best, px: ((x(best.t) / W) * rect.width) };
}
const tipStyle = computed(() => {
    if (!hover.value) return {};
    return hover.value.x > W * 0.7 ? { right: `calc(100% - ${hover.value.px}px + 8px)` } : { left: `${hover.value.px + 8}px` };
});

const fmtTime = (t: number) => new Date(t).toLocaleString("en-GB", { weekday: props.range === "7d" ? "short" : undefined, hour: "2-digit", minute: "2-digit" });
const fmtAxis = (t: number) => (props.range === "7d" ? new Date(t).toLocaleDateString("en-GB", { day: "numeric", month: "short" }) : new Date(t).toLocaleTimeString("en-GB", { hour: "2-digit", minute: "2-digit" }));
</script>
