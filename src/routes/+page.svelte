<script lang="ts">
	import { onMount } from 'svelte';
	import { fetchMPs, type MP } from '$lib/riksdagen';
	import { sampleMP } from '$lib/sample';
	import type { Party } from '$lib/riksdagen';
	import { Card } from '$lib/components/ui/card';
	import { Skeleton } from '$lib/components/ui/skeleton';
	import AnswerButtons from '$lib/components/AnswerButtons.svelte';

	let status = $state<'loading' | 'ready' | 'error'>('loading');
	let statusMessage = $state('Laddar ledamöter…');
	let mps = $state<MP[]>([]);
	let currentMP = $state<MP | null>(null);
	let sessionId = $state('');

	onMount(async () => {
		sessionId = sessionStorage.getItem('session_id') ?? (() => {
			const id = crypto.randomUUID();
			sessionStorage.setItem('session_id', id);
			return id;
		})();

		try {
			const loaded = await fetchMPs();
			mps = loaded;
			const { mp } = sampleMP(mps);
			currentMP = mp;
			statusMessage = `${mps.length} ledamöter inlästa`;
			status = 'ready';
		} catch {
			statusMessage = 'Kunde inte ladda ledamöter.';
			status = 'error';
		}
	});

	async function handleGuess(guessedParty: Party) {
		if (!currentMP || status !== 'ready') return;

		const correctParty = currentMP.party;
		const payload = {
			session_id: sessionId,
			mp_id: currentMP.id,
			guessed_party_id: guessedParty,
			correct_party_id: correctParty
		};

		// Fire-and-forget; reveal/score added in the next slice
		fetch('/api/event', {
			method: 'POST',
			headers: { 'Content-Type': 'application/json' },
			body: JSON.stringify(payload)
		}).catch(() => {});

		// Advance to next MP immediately (reveal overlay comes in #6)
		const { mp } = sampleMP(mps);
		currentMP = mp;
	}
</script>

<svelte:head>
	<title>Gissa partiet</title>
</svelte:head>

<main class="flex flex-col items-center justify-center px-4 py-8 gap-6">
	<p class="text-muted-foreground text-sm">{statusMessage}</p>

	<div class="w-full max-w-xs">
		{#if status === 'loading'}
			<Card class="overflow-hidden">
				<Skeleton class="aspect-[3/4] w-full rounded-none" />
			</Card>
		{:else if status === 'ready' && currentMP}
			<Card class="overflow-hidden">
				<img
					src={currentMP.photoUrl}
					alt=""
					class="aspect-[3/4] w-full object-cover object-top"
				/>
			</Card>
		{/if}
	</div>

	{#if status === 'ready'}
		<AnswerButtons onGuess={handleGuess} />
	{/if}
</main>
