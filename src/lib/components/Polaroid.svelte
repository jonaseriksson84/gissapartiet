<script lang="ts">
	import { cubicOut } from 'svelte/easing';
	import { Card } from '$lib/components/ui/card';
	import { Skeleton } from '$lib/components/ui/skeleton';
	import { tiltForMpId, tapeAngleForMpId } from '$lib/polaroid-tilt';
	import type { MP } from '$lib/riksdagen';

	type Phase = 'idle' | 'revealing';

	type Props = {
		mp: MP | null;
		phase: Phase;
		isCorrect: boolean;
		partyName: string;
		dwellMs: number;
		prefersReducedMotion: boolean;
	};

	let { mp, phase, isCorrect, partyName, dwellMs, prefersReducedMotion }: Props = $props();

	const tilt = $derived(mp ? tiltForMpId(mp.id) : 0);
	const tape = $derived(mp ? tapeAngleForMpId(mp.id) : 0);

	// Track phase transitions so we fire reactions only on idle → revealing.
	let reactionClass = $state('');
	let prevPhase: Phase = 'idle';
	$effect(() => {
		if (phase === 'revealing' && prevPhase !== 'revealing') {
			reactionClass = isCorrect ? 'reaction-correct' : 'reaction-wrong';
		} else if (phase === 'idle') {
			reactionClass = '';
		}
		prevPhase = phase;
	});

	function onReactionEnd(e: AnimationEvent) {
		// Clear the reaction class once the ring fade finishes so it can re-fire next round.
		if (e.animationName === 'polaroidRing') reactionClass = '';
	}

	function drop(_node: HTMLElement, params: { restTilt?: number; reduced?: boolean }) {
		const reduced = params.reduced ?? false;
		const duration = reduced ? 100 : 280;
		return {
			duration,
			easing: cubicOut,
			css: (t: number) => {
				if (reduced) return `opacity: ${t};`;
				const translateY = (1 - t) * -6;
				const scale = 0.96 + 0.04 * t;
				return `opacity: ${t}; transform: translateY(${translateY}px) scale(${scale});`;
			}
		};
	}

	function fall(_node: HTMLElement, params: { reduced?: boolean }) {
		const reduced = params.reduced ?? false;
		const duration = reduced ? 100 : 280;
		return {
			duration,
			easing: cubicOut,
			css: (t: number) => {
				if (reduced) return `opacity: ${t};`;
				const translateY = (1 - t) * 6;
				return `opacity: ${t}; transform: translateY(${translateY}px);`;
			}
		};
	}
</script>

<div class="polaroid-tilt" style="--tilt: {prefersReducedMotion ? 0 : tilt}deg">
	<div class="polaroid-stack">
		{#if !mp}
			<div class="polaroid-cell">
				<Card class="polaroid-card py-0">
					<Skeleton class="aspect-[10/11] w-full rounded-[3px]" />
					<div class="polaroid-strip"></div>
				</Card>
			</div>
		{:else}
			{#key mp.id}
				<div
					class="polaroid-cell polaroid-drop"
					in:drop={{ reduced: prefersReducedMotion }}
					out:fall={{ reduced: prefersReducedMotion }}
				>
					<div class="polaroid-react {reactionClass}" onanimationend={onReactionEnd}>
						<span
							class="polaroid-tape"
							style="--tape: {prefersReducedMotion ? 0 : tape}deg"
							aria-hidden="true"
						></span>
						<Card class="polaroid-card py-0">
							<div class="polaroid-photo">
								<img
									src={mp.photoUrl}
									alt=""
									class="aspect-[10/11] w-full object-cover object-top block"
								/>
							</div>
							<div class="polaroid-strip">
								{#if phase === 'revealing'}
									<div class="polaroid-reveal">
										<p class="polaroid-name">{mp.firstName} {mp.lastName}</p>
										<p class="polaroid-party">{partyName}</p>
									</div>
									<div
										class="polaroid-timer"
										style="animation: timerDeplete {dwellMs}ms linear forwards"
									></div>
								{/if}
							</div>
						</Card>
					</div>
				</div>
			{/key}
		{/if}
	</div>
</div>

<style>
	.polaroid-tilt {
		width: 100%;
		max-width: 24rem; /* max-w-sm */
		margin: 0 auto;
		transform: rotate(var(--tilt, 0deg));
		transform-origin: center 40%;
		transition: transform 320ms cubic-bezier(0.18, 0.89, 0.32, 1.28);
		/* Reserve vertical space so the drop animation has somewhere to land. */
		padding-top: 14px;
	}

	/* Stack: old + new polaroid share the same grid cell during transitions */
	.polaroid-stack {
		display: grid;
		grid-template-columns: 1fr;
		grid-template-rows: auto;
	}

	.polaroid-cell {
		grid-column: 1;
		grid-row: 1;
		display: block;
	}

	.polaroid-react {
		position: relative;
		display: block;
		border-radius: var(--radius);
		transition: box-shadow 200ms ease;
	}

	.polaroid-react.reaction-correct {
		animation:
			polaroidSpring 250ms ease-out,
			polaroidRing 700ms ease-out;
		--ring-color: var(--sage);
	}

	.polaroid-react.reaction-wrong {
		animation:
			polaroidShake 250ms ease-in-out,
			polaroidRing 700ms ease-out;
		--ring-color: var(--coral);
	}

	@keyframes polaroidSpring {
		0% { transform: scale(1); }
		40% { transform: scale(1.02); }
		100% { transform: scale(1); }
	}

	@keyframes polaroidShake {
		0%, 100% { transform: translateX(0); }
		20% { transform: translateX(-2px); }
		40% { transform: translateX(2px); }
		60% { transform: translateX(-2px); }
		80% { transform: translateX(2px); }
	}

	@keyframes polaroidRing {
		0% {
			box-shadow:
				0 0 0 0 var(--ring-color, transparent),
				0 18px 28px -18px rgba(45, 40, 35, 0.32);
		}
		30% {
			box-shadow:
				0 0 28px 6px color-mix(in oklch, var(--ring-color) 60%, transparent),
				0 18px 28px -18px rgba(45, 40, 35, 0.32);
		}
		100% {
			box-shadow:
				0 0 0 0 transparent,
				0 18px 28px -18px rgba(45, 40, 35, 0.32);
		}
	}

	@media (prefers-reduced-motion: reduce) {
		.polaroid-tilt { transform: none; transition: none; }
		.polaroid-react.reaction-correct { animation: polaroidRing 700ms ease-out; }
		.polaroid-react.reaction-wrong   { animation: polaroidRing 700ms ease-out; }
	}

	:global(.polaroid-card) {
		background: var(--paper-2, white);
		padding: 0.75rem 0.75rem 0 0.75rem;
		border-radius: 6px;
		position: relative;
		box-shadow:
			0 1px 0 rgba(45, 40, 35, 0.05),
			0 18px 28px -18px rgba(45, 40, 35, 0.32);
	}

	.polaroid-tape {
		position: absolute;
		top: -10px;
		left: 50%;
		display: block;
		width: 96px;
		height: 22px;
		background: color-mix(in oklch, var(--blue) 55%, transparent);
		background-image: linear-gradient(180deg, rgba(255, 255, 255, 0.35), transparent 60%);
		box-shadow: 0 1px 2px rgba(45, 40, 35, 0.08);
		border-radius: 1px;
		transform: translateX(-50%) rotate(var(--tape, 0deg));
		pointer-events: none;
		z-index: 3;
	}

	.polaroid-photo {
		position: relative;
		overflow: hidden;
		border-radius: 3px;
		background: var(--ink-3);
	}

	.polaroid-strip {
		position: relative;
		min-height: 64px;
		padding: 10px 4px 14px;
	}

	.polaroid-reveal {
		text-align: center;
		animation: revealFade 200ms ease-out both;
	}

	@keyframes revealFade {
		from { opacity: 0; transform: translateY(2px); }
		to   { opacity: 1; transform: translateY(0); }
	}

	.polaroid-name {
		font-family: var(--font-serif);
		font-weight: 700;
		font-size: 1.1rem;
		line-height: 1.1;
		color: var(--ink);
		margin: 0;
		font-feature-settings: 'liga', 'kern';
	}

	.polaroid-party {
		font-family: var(--font-sans);
		font-size: 0.85rem;
		color: var(--ink-2);
		margin: 4px 0 0;
		letter-spacing: 0.01em;
	}

	.polaroid-timer {
		position: absolute;
		bottom: 0;
		left: 4px;
		right: 4px;
		height: 3px;
		background: var(--coral);
		border-radius: 3px;
		width: 100%;
	}

	@media (prefers-reduced-motion: reduce) {
		.polaroid-reveal { animation: none; }
	}
</style>
