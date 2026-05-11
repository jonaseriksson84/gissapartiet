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
		class="flex size-11 shrink-0 items-center justify-center rounded-full"
		style="background: radial-gradient(ellipse 70% 50% at 35% 28%, rgba(255,255,255,0.28) 0%, transparent 100%), {bg};"
		aria-hidden="true"
	>
		<UserX class="size-5 text-white" />
	</span>
{:else}
	<svg
		viewBox="0 0 40 40"
		class="block size-11 shrink-0"
		aria-hidden="true"
		xmlns="http://www.w3.org/2000/svg"
	>
		<circle cx="20" cy="20" r="20" fill={bg} />
		<ellipse cx="14" cy="10" rx="9" ry="5" fill="white" opacity="0.28" />
		<ellipse cx="20" cy="33" rx="11" ry="5" fill="black" opacity="0.06" />
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
