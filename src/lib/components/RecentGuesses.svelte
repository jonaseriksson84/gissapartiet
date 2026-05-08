<script lang="ts">
	import { Badge } from '$lib/components/ui/badge';
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
	<div class="w-full max-w-xs">
		<Separator class="mb-3" />
		<p class="text-xs text-muted-foreground uppercase tracking-wide mb-2">Senaste gissningar</p>
		<ul class="flex flex-col gap-2 max-h-80 overflow-y-auto pr-1">
			{#each entries as entry (entry.at)}
				{@const correct = entry.guessedParty === entry.correctParty}
				<li class="flex items-center gap-2 text-sm">
					<img
						src={entry.photoUrl}
						alt=""
						class="w-8 h-8 rounded-full object-cover object-top shrink-0"
					/>
					<div class="flex-1 min-w-0">
						<p class="font-medium truncate leading-tight">
							{entry.mpFirstName} {entry.mpLastName}
						</p>
						<p class="text-muted-foreground text-xs truncate">
							{PARTY_NAMES[entry.correctParty] ?? entry.correctParty}
							{#if !correct}
								· du gissade {PARTY_NAMES[entry.guessedParty] ?? entry.guessedParty}
							{/if}
						</p>
					</div>
					<Badge
						variant={correct ? 'default' : 'destructive'}
						class="shrink-0 text-xs px-1.5 {correct ? 'bg-green-600 text-white hover:bg-green-600' : ''}"
					>
						{correct ? '✓' : '✕'}
					</Badge>
				</li>
			{/each}
		</ul>
	</div>
{/if}
