<script lang="ts">
	import type { Party } from '$lib/riksdagen';
	import { UserX } from '@lucide/svelte';

	let { party }: { party: Party } = $props();

	const config: Record<Party, { bg: string; label: string }> = {
		S:        { bg: '#ED1B34', label: 'S' },
		M:        { bg: '#1C3D80', label: 'M' },
		SD:       { bg: '#006AA7', label: 'SD' },
		V:        { bg: '#DA001A', label: 'V' },
		C:        { bg: '#009933', label: 'C' },
		KD:       { bg: '#234F8C', label: 'KD' },
		MP:       { bg: '#83B22F', label: 'MP' },
		L:        { bg: '#006AB3', label: 'L' },
		Partilös: { bg: '#64748b', label: '' }
	};

	const bg = $derived(config[party].bg);
	const label = $derived(config[party].label);
</script>

{#if party === 'Partilös'}
	<span
		class="flex size-10 items-center justify-center rounded-full"
		style="background:{bg}"
		aria-hidden="true"
	>
		<UserX class="size-5 text-white" />
	</span>
{:else}
	<svg
		viewBox="0 0 40 40"
		width="40"
		height="40"
		aria-hidden="true"
		xmlns="http://www.w3.org/2000/svg"
	>
		<circle cx="20" cy="20" r="20" fill={bg} />
		<text
			x="20"
			y="20"
			dominant-baseline="central"
			text-anchor="middle"
			fill="white"
			font-family="system-ui, sans-serif"
			font-size={label.length > 1 ? '13' : '17'}
			font-weight="700"
		>{label}</text>
	</svg>
{/if}
