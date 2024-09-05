<script>
	import Soilmoisture from './soilmoisture.svelte';
	import Waterpump from './waterpump.svelte';
	import { Alert, Card } from 'flowbite-svelte';
	import { InfoCircleSolid } from 'flowbite-svelte-icons';
</script>

<main class="max-w-full space-y-2 px-2">
	<Card padding="none" class="max-w-full border-green-200">
	<Alert color="green" dismissable>
		<InfoCircleSolid slot="icon" class="h-5 w-5" />
		All systems are currently functional
	</Alert>
	</Card>
	<div class="md:grid md:grid-cols-2 gap-2">
	<Soilmoisture />
	<Waterpump />
	</div>
</main>
