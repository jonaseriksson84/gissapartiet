<script lang="ts">
	import { Separator } from '$lib/components/ui/separator';
	import type { GuessEntry } from '$lib/storage';

	const PARTY_NAMES: Record<string, string> = {
		S: 'Socialdemokraterna', M: 'Moderaterna', SD: 'Sverigedemokraterna',
		V: 'Vänsterpartiet', C: 'Centerpartiet', KD: 'Kristdemokraterna',
		MP: 'Miljöpartiet', L: 'Liberalerna', 'Partilös': 'Partilös'
	};

	let { entries }: { entries: GuessEntry[] } = $props();
</script>

{#if entries.length > 0}
	<div class="w-full max-w-sm">
		<Separator class="mb-3" />
		<h2 class="font-serif text-base font-medium mb-2 leading-tight">
			Senaste <em>gissningar</em>
		</h2>
		<ul class="flex flex-col gap-2 max-h-80 overflow-y-auto pr-1">
			{#each entries as entry (entry.at)}
				{@const correct = entry.guessedParty === entry.correctParty}
				<li class="flex items-center gap-2 text-sm bg-card rounded-lg px-2 py-1.5 shadow-sm border border-border/50">
					<img
						src={entry.photoUrl}
						alt=""
						class="w-8 h-8 rounded-full object-cover object-top shrink-0 border border-border"
					/>
					<div class="flex-1 min-w-0">
						<p class="font-serif font-medium truncate leading-tight">
							{entry.mpFirstName} {entry.mpLastName}
						</p>
						<p class="font-sans text-muted-foreground text-xs truncate">
							{PARTY_NAMES[entry.correctParty] ?? entry.correctParty}
							{#if !correct}
								· du gissade {PARTY_NAMES[entry.guessedParty] ?? entry.guessedParty}
							{/if}
						</p>
					</div>
					<span
						class="shrink-0 text-xs px-1.5 py-0.5 rounded-md font-medium {correct
							? 'bg-sage/20 text-sage-d dark:bg-sage/15 dark:text-sage'
							: 'bg-coral/20 text-coral-d dark:bg-coral/15 dark:text-coral'}"
					>
						{correct ? '✓' : '✕'}
					</span>
				</li>
			{/each}
		</ul>
	</div>
{/if}
