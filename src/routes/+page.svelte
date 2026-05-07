<script lang="ts">
	import { onMount } from 'svelte';
	import { fetchMPs, type MP } from '$lib/riksdagen';
	import { Card } from '$lib/components/ui/card';
	import { Skeleton } from '$lib/components/ui/skeleton';

	let status = $state<'loading' | 'ready' | 'error'>('loading');
	let statusMessage = $state('Laddar ledamöter…');
	let currentMP = $state<MP | null>(null);

	onMount(async () => {
		try {
			const mps = await fetchMPs();
			currentMP = mps[Math.floor(Math.random() * mps.length)];
			statusMessage = `${mps.length} ledamöter inlästa`;
			status = 'ready';
		} catch {
			statusMessage = 'Kunde inte ladda ledamöter.';
			status = 'error';
		}
	});
</script>

<svelte:head>
	<title>Gissa partiet</title>
</svelte:head>

<main class="flex flex-col items-center justify-center px-4 py-8">
	<p class="text-muted-foreground text-sm mb-8">{statusMessage}</p>

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
</main>
