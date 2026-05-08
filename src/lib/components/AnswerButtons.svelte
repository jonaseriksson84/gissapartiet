<script lang="ts">
	import { onMount } from 'svelte';
	import { scale } from 'svelte/transition';
	import { Tooltip, TooltipContent, TooltipTrigger, TooltipProvider } from '$lib/components/ui/tooltip';
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

	const isRevealing = $derived(phase === 'revealing');

	let prefersReducedMotion = $state(false);
	onMount(() => {
		const mq = window.matchMedia('(prefers-reduced-motion: reduce)');
		prefersReducedMotion = mq.matches;
		mq.addEventListener('change', (e) => { prefersReducedMotion = e.matches; });
	});
</script>

<TooltipProvider>
	<div class="flex flex-wrap justify-center gap-2" role="group" aria-label="Gissa parti">
		{#each parties as { id, name }}
			{@const isCorrect = isRevealing && correctParty === id}
			{@const isWrong = isRevealing && guessedParty === id && guessedParty !== correctParty}
			<div class="relative">
				<Tooltip>
					<TooltipTrigger
						onclick={() => !isRevealing && onGuess(id)}
						class="rounded-full transition-opacity focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-ring p-0 border-0 bg-transparent {isRevealing ? 'opacity-40 cursor-not-allowed pointer-events-none' : 'hover:opacity-90 active:opacity-75 cursor-pointer motion-safe:transition-transform motion-safe:duration-150 motion-safe:ease-out motion-safe:hover:scale-110 motion-safe:active:scale-95'}"
						aria-label={name}
						aria-disabled={isRevealing}
					>
						<PartySymbol party={id} />
					</TooltipTrigger>
					<TooltipContent>{name}</TooltipContent>
				</Tooltip>

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
