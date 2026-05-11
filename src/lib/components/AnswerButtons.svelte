<script lang="ts">
	import { onMount } from 'svelte';
	import { scale } from 'svelte/transition';
	import { Tooltip, TooltipContent, TooltipTrigger, TooltipProvider } from '$lib/components/ui/tooltip';
	import { Button } from '$lib/components/ui/button';
	import PartySymbol from '$lib/components/PartySymbol.svelte';
	import type { Party } from '$lib/riksdagen';
	import type { Phase } from '$lib/game-state';

	let {
		onGuess,
		phase = 'idle',
		guessedParty = null,
		correctParty = null
	}: {
		onGuess: (party: Party) => void;
		phase?: Phase;
		guessedParty?: Party | null;
		correctParty?: Party | null;
	} = $props();

	const parties: { id: Party; name: string }[] = [
		{ id: 'S',        name: 'Socialdemokraterna' },
		{ id: 'M',        name: 'Moderaterna' },
		{ id: 'SD',       name: 'Sverigedemokraterna' },
		{ id: 'V',        name: 'Vänsterpartiet' },
		{ id: 'C',        name: 'Centerpartiet' },
		{ id: 'KD',       name: 'Kristdemokraterna' },
		{ id: 'MP',       name: 'Miljöpartiet' },
		{ id: 'L',        name: 'Liberalerna' },
		{ id: 'Partilös', name: 'Partilös' }
	];

	const shortLabels: Record<Party, string> = {
		S:        'Social­dem.',
		M:        'Moderaterna',
		SD:       'Sverigedem.',
		V:        'Vänsterp.',
		C:        'Centern',
		KD:       'Krist­dem.',
		MP:       'Miljöp.',
		L:        'Liberal.',
		Partilös: 'Partilös'
	};

	const isRevealing = $derived(phase === 'revealing');

	let prefersReducedMotion = $state(false);
	let canHover = $state(false);
	onMount(() => {
		const motionMq = window.matchMedia('(prefers-reduced-motion: reduce)');
		prefersReducedMotion = motionMq.matches;
		motionMq.addEventListener('change', (e) => { prefersReducedMotion = e.matches; });

		// Tooltips are hover-only; on touch devices a tap opens them with no
		// clean way to dismiss, so we skip the Tooltip wrapper entirely there.
		const hoverMq = window.matchMedia('(hover: hover) and (pointer: fine)');
		canHover = hoverMq.matches;
		hoverMq.addEventListener('change', (e) => { canHover = e.matches; });
	});

	const pinBase =
		'w-full flex items-center gap-2 px-2.5 py-2 rounded-xl bg-card border border-border shadow-sm text-foreground cursor-pointer transition-all focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-ring';

	const pinStateClass = (revealing: boolean, hoverable: boolean) =>
		revealing
			? 'opacity-40 cursor-not-allowed pointer-events-none'
			: hoverable
				? 'motion-safe:hover:-translate-y-0.5 motion-safe:hover:rotate-1 motion-safe:duration-150 motion-safe:ease-out motion-safe:active:scale-95 hover:shadow-md'
				: 'active:scale-95 active:opacity-75';
</script>

<TooltipProvider>
	<div class="grid grid-cols-3 gap-2 w-full" role="group" aria-label="Gissa parti">
		{#each parties as { id, name }}
			{@const isCorrect = isRevealing && correctParty === id}
			{@const isWrong = isRevealing && guessedParty === id && guessedParty !== correctParty}
			<div class="relative">
				{#if canHover}
					<Tooltip>
						<TooltipTrigger
							onclick={() => !isRevealing && onGuess(id)}
							class="{pinBase} {pinStateClass(isRevealing, true)}"
							aria-label={name}
							aria-disabled={isRevealing}
						>
							<PartySymbol party={id} />
							<span class="text-xs font-medium leading-tight" lang="sv">{shortLabels[id]}</span>
						</TooltipTrigger>
						<TooltipContent>{name}</TooltipContent>
					</Tooltip>
				{:else}
					<Button
						variant="ghost"
						onclick={() => !isRevealing && onGuess(id)}
						class="{pinBase} {pinStateClass(isRevealing, false)} h-auto whitespace-normal rounded-xl border-border hover:bg-card"
						aria-label={name}
						aria-disabled={isRevealing}
					>
						<PartySymbol party={id} />
						<span class="text-xs font-medium leading-tight" lang="sv">{shortLabels[id]}</span>
					</Button>
				{/if}

				{#if isCorrect}
					<span
						in:scale={{ duration: prefersReducedMotion ? 0 : 150, start: 0.5 }}
						class="absolute -top-1 -right-1 flex size-5 items-center justify-center rounded-full bg-green-600 text-white text-xs font-bold leading-none pointer-events-none"
					>✓</span>
				{:else if isWrong}
					<span
						in:scale={{ duration: prefersReducedMotion ? 0 : 150, start: 0.5 }}
						class="absolute -top-1 -right-1 flex size-5 items-center justify-center rounded-full bg-red-500 text-white text-xs font-bold leading-none pointer-events-none"
					>✕</span>
				{/if}
			</div>
		{/each}
	</div>
</TooltipProvider>
