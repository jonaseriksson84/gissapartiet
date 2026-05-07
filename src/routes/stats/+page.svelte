<script lang="ts">
	import { onDestroy, untrack } from 'svelte';
	import { Card, CardContent, CardHeader, CardTitle } from '$lib/components/ui/card';
	import {
		Table,
		TableBody,
		TableCell,
		TableHead,
		TableHeader,
		TableRow
	} from '$lib/components/ui/table';
	import type { PageData } from './$types';

	let { data }: { data: PageData } = $props();

	let counters = $state(untrack(() => data.counters));
	let accuracy = $state(untrack(() => data.accuracy));

	const PARTY_NAMES: Record<string, string> = {
		S: 'Socialdemokraterna',
		M: 'Moderaterna',
		SD: 'Sverigedemokraterna',
		V: 'Vänsterpartiet',
		C: 'Centerpartiet',
		KD: 'Kristdemokraterna',
		MP: 'Miljöpartiet',
		L: 'Liberalerna',
		'Partilös': 'Partilös'
	};

	const ALL_PARTIES = ['S', 'M', 'SD', 'V', 'C', 'KD', 'MP', 'L', 'Partilös'];

	function fmt(n: number) {
		return n.toLocaleString('sv-SE');
	}

	async function refresh() {
		const res = await fetch('/api/stats');
		if (!res.ok) return;
		const json = await res.json();
		counters = json.counters;
		accuracy = json.accuracy;
	}

	const interval = setInterval(refresh, 30_000);
	onDestroy(() => clearInterval(interval));

	function partyAccuracy(party: string) {
		return accuracy.find((r) => r.party === party) ?? null;
	}
</script>

<svelte:head>
	<title>Statistik — Gissa partiet</title>
</svelte:head>

<main class="max-w-2xl mx-auto px-4 py-8 space-y-8">
	<div class="flex items-center justify-between flex-wrap gap-2">
		<h1 class="text-2xl font-bold tracking-tight">Statistik</h1>
		<span class="text-xs text-muted-foreground font-medium uppercase tracking-wide">
			LIVE · uppdateras var 30 sekund
		</span>
	</div>

	<div class="grid grid-cols-2 sm:grid-cols-4 gap-3">
		<Card>
			<CardHeader class="pb-1">
				<CardTitle class="text-sm font-medium text-muted-foreground">Röster</CardTitle>
			</CardHeader>
			<CardContent>
				<p class="text-2xl font-bold">{fmt(counters.votes)}</p>
			</CardContent>
		</Card>

		<Card>
			<CardHeader class="pb-1">
				<CardTitle class="text-sm font-medium text-muted-foreground">Sessioner</CardTitle>
			</CardHeader>
			<CardContent>
				<p class="text-2xl font-bold">{fmt(counters.sessions)}</p>
			</CardContent>
		</Card>

		<Card>
			<CardHeader class="pb-1">
				<CardTitle class="text-sm font-medium text-muted-foreground">Snitt / session</CardTitle>
			</CardHeader>
			<CardContent>
				<p class="text-2xl font-bold">
					{counters.sessions > 0 ? counters.avgPerSession.toLocaleString('sv-SE') : '—'}
				</p>
			</CardContent>
		</Card>

		<Card>
			<CardHeader class="pb-1">
				<CardTitle class="text-sm font-medium text-muted-foreground">Längsta session</CardTitle>
			</CardHeader>
			<CardContent>
				<p class="text-2xl font-bold">
					{counters.longestSession > 0 ? fmt(counters.longestSession) : '—'}
				</p>
			</CardContent>
		</Card>
	</div>

	<section>
		<h2 class="text-lg font-semibold mb-3">Träffsäkerhet per parti</h2>
		<Table>
			<TableHeader>
				<TableRow>
					<TableHead>Parti</TableHead>
					<TableHead class="text-right">Gissningar</TableHead>
					<TableHead class="text-right">Rätt</TableHead>
					<TableHead class="text-right">Träffsäkerhet</TableHead>
				</TableRow>
			</TableHeader>
			<TableBody>
				{#each ALL_PARTIES as party}
					{@const row = partyAccuracy(party)}
					<TableRow>
						<TableCell class="font-medium">{PARTY_NAMES[party]}</TableCell>
						<TableCell class="text-right">{row ? fmt(row.total) : '—'}</TableCell>
						<TableCell class="text-right">{row ? fmt(row.correct) : '—'}</TableCell>
						<TableCell class="text-right">
							{row ? `${row.accuracy.toLocaleString('sv-SE', { maximumFractionDigits: 1 })} %` : '—'}
						</TableCell>
					</TableRow>
				{/each}
			</TableBody>
		</Table>
	</section>
</main>
