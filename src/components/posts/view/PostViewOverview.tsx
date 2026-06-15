import { useAtomValue } from 'jotai';
import { useCallback, useEffect, useRef } from 'react';
import { cn } from '@components/common/lib/utils';
import { postViewScrollAtom } from '@stores/postViewAtom';
import { computeScrollProgress } from './paginationGeometry';

/**
 * 弹簧角频率(临界阻尼)。越大越跟手(收敛越快),越小越绵软。
 */
const SPRING_OMEGA = 16;

/**
 * 辉光「速度感知」参数:滚动越快,装饰性辉光/光头越隐(退到背景,不抢卡片焦点);
 * 速度回零(停下)时缓缓亮回 1。功能性细芯线不参与,始终常驻给进度反馈。
 * - GLOW_CALM_K:速度→暗淡的灵敏度(越大越早变暗)
 * - GLOW_MIN:快速滚动时辉光不透明度下限
 */
const GLOW_CALM_K = 2.5;
const GLOW_MIN = 0.2;

/** 由弹簧速度(进度/秒)算辉光不透明度:静止→1,越快→越接近 GLOW_MIN。 */
function glowIntensity(vel: number): number {
    const calm = Math.exp(-Math.abs(vel) * GLOW_CALM_K);
    return GLOW_MIN + (1 - GLOW_MIN) * calm;
}

interface PostViewOverviewProps {
    className?: string;
}

/**
 * 底边总览进度条(氛围光晕 × 进度填充):全宽钉在视窗最底边。
 * 纯视觉(aria-hidden):一条极淡基轨 + 随滚动进度从左生长的月白柔光(前缘最亮)
 * + 一个柔焦光头标记当前位置。中性光感,不与彩色卡片争色。
 *
 * 进度用 rAF 临界阻尼弹簧逐帧逼近目标(命令式写 style,跟手且无过冲)。
 * 辉光/光头按弹簧速度做「速度感知」:快速滚动时隐去、停下后缓缓亮回 —— 运动时不抢焦点。
 * 仅订阅 postViewScrollAtom,只随滚动重渲染,不波及时间线。
 */
export default function PostViewOverview({ className }: PostViewOverviewProps) {
    const { scrollLeft, scrollWidth, clientWidth } = useAtomValue(postViewScrollAtom);
    const bloomRef = useRef<HTMLDivElement>(null);
    const coreRef = useRef<HTMLDivElement>(null);
    const headRef = useRef<HTMLDivElement>(null);

    // 目标进度(每次 atom 变化重算);存进 ref 供 rAF 循环读最新值
    const target = computeScrollProgress(scrollLeft, scrollWidth, clientWidth);
    const targetRef = useRef(target);
    targetRef.current = target;

    const animRef = useRef({
        p: target,
        vel: 0,
        raf: null as number | null,
        lastTs: null as number | null,
        initialized: false,
        reduced: false,
    });

    // 进度 + 辉光强度 → DOM。core(细芯线)宽度随进度但不调透明度(常驻);
    // bloom/head 透明度跟随 glow(运动时隐、停下亮)。
    const apply = useCallback((p: number, glow: number) => {
        const pct = `${(p * 100).toFixed(3)}%`;
        const op = glow.toFixed(3);
        if (bloomRef.current) {
            bloomRef.current.style.width = pct;
            bloomRef.current.style.opacity = op;
        }
        if (coreRef.current) coreRef.current.style.width = pct;
        if (headRef.current) {
            headRef.current.style.left = pct;
            headRef.current.style.opacity = op;
        }
    }, []);

    // 临界阻尼弹簧解析步进(无过冲、无条件稳定);settle 后自停
    const tick = useCallback(
        (ts: number) => {
            const a = animRef.current;
            const t = targetRef.current;
            const dt = a.lastTs == null ? 1 / 60 : Math.min((ts - a.lastTs) / 1000, 1 / 30);
            a.lastTs = ts;

            const c1 = a.p - t;
            const c2 = a.vel + SPRING_OMEGA * c1;
            const e = Math.exp(-SPRING_OMEGA * dt);
            const next = c1 + c2 * dt;
            a.p = t + next * e;
            a.vel = (c2 - SPRING_OMEGA * next) * e;
            apply(a.p, glowIntensity(a.vel));

            if (Math.abs(a.p - t) < 0.0004 && Math.abs(a.vel) < 0.002) {
                a.p = t;
                a.vel = 0;
                apply(a.p, 1); // 停稳:辉光满亮
                a.raf = null;
                a.lastTs = null;
                return;
            }
            a.raf = requestAnimationFrame(tick);
        },
        [apply]
    );

    // 挂载:到位 + 读 reduced-motion;卸载:停循环
    useEffect(() => {
        const a = animRef.current;
        a.reduced = window.matchMedia('(prefers-reduced-motion: reduce)').matches;
        a.p = targetRef.current;
        a.vel = 0;
        a.initialized = true;
        apply(a.p, 1);

        return () => {
            if (a.raf != null) cancelAnimationFrame(a.raf);
            a.raf = null;
            a.lastTs = null;
        };
    }, [apply]);

    // 目标变化 → 唤醒弹簧循环(reduced-motion 直接到位、满亮,不起循环)
    useEffect(() => {
        const a = animRef.current;
        if (!a.initialized) return;

        if (a.reduced) {
            a.p = targetRef.current;
            a.vel = 0;
            apply(a.p, 1);
            return;
        }
        if (a.raf == null) {
            a.lastTs = null;
            a.raf = requestAnimationFrame(tick);
        }
    }, [scrollLeft, scrollWidth, clientWidth, apply, tick]);

    return (
        <div className={cn('pvp-overview', className)} aria-hidden="true">
            <div ref={bloomRef} className="pvp-overview-bloom" />
            <div ref={coreRef} className="pvp-overview-core" />
            <div ref={headRef} className="pvp-overview-head" />
        </div>
    );
}
