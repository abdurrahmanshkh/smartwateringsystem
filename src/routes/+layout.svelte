<script>
	import '../app.css';
	import { Card } from 'flowbite-svelte';
</script>

<script defer data-domain="abdurrahmanshkh.pages.dev" src="https://plausible.io/js/script.js"></script>

<header class="p-2">
	<Card
		class="max-w-full border-gray-300 bg-gray-200 text-center font-bold text-gray-800 md:text-xl"
	>
		Smart Plant Watering System
	</Card>
</header>

<main style="min-height: 81.5vh;" class="">
	<slot />
</main>

<footer class="p-2">
	<Card
		class="max-w-full border-gray-300 bg-gray-200 text-center text-sm font-medium text-gray-800"
		padding="sm"
	>
		© 2024 Smart Plant Watering System - All Rights Reserved.
	</Card>
</footer>
