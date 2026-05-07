<script lang="ts">
	import { onMount, onDestroy } from 'svelte';
	import { fetchMPs } from '$lib/riksdagen';
	import type { Party } from '$lib/riksdagen';
	import { sampleMP } from '$lib/sample';
	import { gameReducer, INITIAL_STATE, DWELL_MS } from '$lib/game-state';
	import { readStats, writeStats } from '$lib/storage';
	import { playerStats } from '$lib/player-stats';
	import { Card } from '$lib/components/ui/card';
	import { Skeleton } from '$lib/components/ui/skeleton';
	import AnswerButtons from '$lib/components/AnswerButtons.svelte';

	const PARTY_NAMES: Record<Party, string> = {
		S: 'Socialdemokraterna', M: 'Moderaterna', SD: 'Sverigedemokraterna',
		V: 'Vänsterpartiet', C: 'Centerpartiet', KD: 'Kristdemokraterna',
		MP: 'Miljöpartiet', L: 'Liberalerna', 'Partilös': 'Partilös'
	};

	let loadStatus = $state<'loading' | 'ready' | 'error'>('loading');
	let statusMessage = $state('Laddar ledamöter…');
	let mps = $state<Awaited<ReturnType<typeof fetchMPs>>>([]);
	let gs = $state(INITIAL_STATE);
	let sessionId = '';
	let dwellTimer: ReturnType<typeof setTimeout> | null = null;
	let revealKey = $state(0);

	onMount(async () => {
		sessionId = sessionStorage.getItem('session_id') ?? (() => {
			const id = crypto.randomUUID();
			sessionStorage.setItem('session_id', id);
			return id;
		})();

		const saved = readStats(localStorage);
		gs = gameReducer(gs, { type: 'load-stats', stats: saved });
		playerStats.set(gs.stats);

		try {
			const loaded = await fetchMPs();
			mps = loaded;
			const { mp } = sampleMP(mps);
			gs = gameReducer(gs, { type: 'init', mp });
			statusMessage = `${mps.length} ledamöter inlästa`;
			loadStatus = 'ready';
		} catch {
			statusMessage = 'Kunde inte ladda ledamöter.';
			loadStatus = 'error';
		}
	});

	onDestroy(() => {
		if (dwellTimer) clearTimeout(dwellTimer);
	});

	function handleGuess(guessedParty: Party) {
		if (gs.phase !== 'idle' || !gs.currentMP) return;

		const correctParty = gs.currentMP.party;
		gs = gameReducer(gs, { type: 'guess', guessedParty, correctParty });
		playerStats.set(gs.stats);
		writeStats(gs.stats, localStorage);
		revealKey++;

		fetch('/api/event', {
			method: 'POST',
			headers: { 'Content-Type': 'application/json' },
			body: JSON.stringify({
				session_id: sessionId,
				mp_id: gs.currentMP!.id,
				guessed_party_id: guessedParty,
				correct_party_id: correctParty
			})
		}).catch(() => {});

		const { mp: nextMP } = sampleMP(mps);
		dwellTimer = setTimeout(() => {
			gs = gameReducer(gs, { type: 'advance', mp: nextMP });
			dwellTimer = null;
		}, DWELL_MS);
	}
</script>

<svelte:head>
	<title>Gissa partiet</title>
</svelte:head>

<main class="flex flex-col items-center justify-center px-4 py-8 gap-6">
	<p class="text-muted-foreground text-sm">{statusMessage}</p>

	<div class="w-full max-w-xs">
		{#if loadStatus === 'loading'}
			<Card class="overflow-hidden">
				<Skeleton class="aspect-[3/4] w-full rounded-none" />
			</Card>
		{:else if loadStatus === 'ready' && gs.currentMP}
			<Card class="overflow-hidden relative">
				<img
					src={gs.currentMP.photoUrl}
					alt=""
					class="aspect-[3/4] w-full object-cover object-top block"
				/>

				{#if gs.phase === 'revealing'}
					<div class="absolute inset-0 bg-gradient-to-t from-black/80 via-black/20 to-transparent pointer-events-none">
						<div class="absolute bottom-6 left-4 text-white">
							<p class="font-semibold text-lg leading-tight">
								{gs.currentMP.firstName} {gs.currentMP.lastName}
							</p>
							<p class="text-sm opacity-90">
								{gs.correctParty ? PARTY_NAMES[gs.correctParty] : ''}
							</p>
						</div>
					</div>

					{#key revealKey}
						<div
							class="absolute bottom-0 left-0 h-1 bg-white"
							style="animation: timerDeplete {DWELL_MS}ms linear forwards"
						></div>
					{/key}
				{/if}
			</Card>
		{/if}
	</div>

	{#if loadStatus === 'ready'}
		<AnswerButtons
			onGuess={handleGuess}
			phase={gs.phase}
			guessedParty={gs.guessedParty}
			correctParty={gs.correctParty}
		/>
	{/if}
</main>
