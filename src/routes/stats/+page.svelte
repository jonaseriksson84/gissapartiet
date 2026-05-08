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

	const matrixMap = new Map(untrack(() => data.matrix).map((c) => [`${c.actual}:${c.guessed}`, c]));

	function matrixCell(actual: string, guessed: string) {
		return matrixMap.get(`${actual}:${guessed}`) ?? null;
	}

	const misidentification = untrack(() => data.misidentification);

	function misidentForParty(party: string) {
		return misidentification.filter((e) => e.guessedParty === party);
	}

	const PARTY_ABBR: Record<string, string> = {
		S: 'S',
		M: 'M',
		SD: 'SD',
		V: 'V',
		C: 'C',
		KD: 'KD',
		MP: 'MP',
		L: 'L',
		'Partilös': 'P'
	};
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

	<section>
		<h2 class="text-lg font-semibold mb-3">Förväxlingsmatris</h2>
		<p class="text-sm text-muted-foreground mb-3">
			Rader = verkligt parti · Kolumner = gissat parti · Värden = andel av radtotalen
		</p>
		<div class="overflow-x-auto">
			<Table>
				<TableHeader>
					<TableRow>
						<TableHead class="text-xs">↓ verklig / gissad →</TableHead>
						{#each ALL_PARTIES as col}
							<TableHead class="text-center text-xs px-1">{PARTY_ABBR[col]}</TableHead>
						{/each}
					</TableRow>
				</TableHeader>
				<TableBody>
					{#each ALL_PARTIES as row}
						<TableRow>
							<TableCell class="font-semibold text-xs pr-2">{PARTY_ABBR[row]}</TableCell>
							{#each ALL_PARTIES as col}
								{@const cell = matrixCell(row, col)}
								<TableCell
									class="text-center text-xs px-1 tabular-nums {row === col
										? 'bg-green-50 dark:bg-green-950 font-semibold'
										: ''}"
								>
									{cell ? `${cell.pct.toLocaleString('sv-SE', { maximumFractionDigits: 1 })}%` : '—'}
								</TableCell>
							{/each}
						</TableRow>
					{/each}
				</TableBody>
			</Table>
		</div>
	</section>

	<section>
		<h2 class="text-lg font-semibold mb-3">Verkar tillhöra ett annat parti</h2>
		<p class="text-sm text-muted-foreground mb-4">
			Ledamöter som oftast förväxlas med varje parti
		</p>
		<div class="grid grid-cols-1 sm:grid-cols-2 gap-6">
			{#each ALL_PARTIES as party}
				{@const entries = misidentForParty(party)}
				<div>
					<h3 class="text-sm font-semibold mb-2">{PARTY_NAMES[party]}</h3>
					{#if entries.length > 0}
						<ul class="space-y-2">
							{#each entries as entry}
								<li class="flex items-center gap-2 text-sm">
									{#if entry.photoUrl}
										<img
											src={entry.photoUrl}
											alt=""
											class="w-8 h-8 rounded-full object-cover shrink-0"
										/>
									{/if}
									<div class="min-w-0">
										<span class="font-medium truncate block">{entry.name}</span>
										<span class="text-muted-foreground text-xs">
											{PARTY_NAMES[entry.actualParty] ?? entry.actualParty}
										</span>
									</div>
									<span class="ml-auto text-muted-foreground tabular-nums shrink-0"
										>{entry.count}×</span
									>
								</li>
							{/each}
						</ul>
					{/if}
				</div>
			{/each}
		</div>
	</section>
</main>
