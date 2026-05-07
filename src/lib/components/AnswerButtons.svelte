<script lang="ts">
	import { Tooltip, TooltipContent, TooltipTrigger, TooltipProvider } from '$lib/components/ui/tooltip';
	import PartySymbol from '$lib/components/PartySymbol.svelte';
	import type { Party } from '$lib/riksdagen';

	let { onGuess }: { onGuess: (party: Party) => void } = $props();

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
</script>

<TooltipProvider>
	<div class="flex flex-wrap justify-center gap-2" role="group" aria-label="Gissa parti">
		{#each parties as { id, name }}
			<Tooltip>
				<TooltipTrigger
					onclick={() => onGuess(id)}
					class="rounded-full transition-opacity hover:opacity-90 active:opacity-75 focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-ring p-0 border-0 bg-transparent"
					aria-label={name}
				>
					<PartySymbol party={id} />
				</TooltipTrigger>
				<TooltipContent>{name}</TooltipContent>
			</Tooltip>
		{/each}
	</div>
</TooltipProvider>
