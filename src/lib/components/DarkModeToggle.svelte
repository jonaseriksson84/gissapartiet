<script lang="ts">
	import { onMount } from 'svelte';
	import { Switch } from '$lib/components/ui/switch';
	import { Sun, Moon } from '@lucide/svelte';

	let dark = $state(false);

	onMount(() => {
		dark = document.documentElement.classList.contains('dark');
	});

	function toggle() {
		dark = !dark;
		if (dark) {
			document.documentElement.classList.add('dark');
			localStorage.setItem('theme', 'dark');
		} else {
			document.documentElement.classList.remove('dark');
			localStorage.setItem('theme', 'light');
		}
	}
</script>

<div class="flex items-center gap-2">
	<Sun class="size-4 text-muted-foreground" />
	<Switch
		checked={dark}
		onCheckedChange={toggle}
		aria-label="Växla mörkt läge"
		size="sm"
	/>
	<Moon class="size-4 text-muted-foreground" />
</div>
