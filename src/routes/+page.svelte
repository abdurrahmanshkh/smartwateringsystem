<script>
	import Soilmoisture from './soilmoisture.svelte';
	import Waterpump from './waterpump.svelte';
	import { Alert, Card, Button } from 'flowbite-svelte';
	import { InfoCircleSolid } from 'flowbite-svelte-icons';
	import { Range, Label } from 'flowbite-svelte';
	import { onMount } from 'svelte';

	let moistureLevel = 0;
	let pumpStatus = 'OFF';
	let systemStatus = 0; // 0 = Off, 1 = On
	let threshold = 0; // Default threshold value
	let updating = false;

	// Call function on mount
	onMount(() => {
		fetchInitialData();
		setInterval(fetchLatestData, 5000);
	});

	// Fetch initial data including system status and threshold
	async function fetchInitialData() {
		const url = 'https://api.thingspeak.com/channels/2736648/feeds.json?results=1';
		try {
			const response = await fetch(url);
			const data = await response.json();
			const feed = data.feeds[0];
			moistureLevel = feed.field1;
			pumpStatus = feed.field2 === '1' ? 'ON' : 'OFF';
			systemStatus = parseInt(feed.field3) || 0; // Set initial system status
			threshold = parseInt(feed.field4) || 800; // Set initial threshold value
		} catch (error) {
			console.error('Error fetching initial data:', error);
		}
	}

	async function fetchLatestData() {
		const url = 'https://api.thingspeak.com/channels/2736648/feeds.json?results=1';
		try {
			const response = await fetch(url);
			const data = await response.json();
			const feed = data.feeds[0];
			moistureLevel = feed.field1;
			pumpStatus = feed.field2 === '1' ? 'ON' : 'OFF';
		} catch (error) {
			console.error('Error fetching latest data:', error);
		}
	}

	async function updateSystemSettings() {
		updating = true;
		const apiKey = 'CV5WWIPTAVEW6RMD';
		const url = `https://api.thingspeak.com/update?api_key=${apiKey}&field1=${moistureLevel}&field2=${pumpStatus === 'ON' ? 1 : 0}&field3=${systemStatus}&field4=${threshold}`;

		let data = 0;

		while (data === 0) {
			try {
				const response = await fetch(url);
				data = await response.json();

				if (data !== 0) {
					console.log('System settings updated successfully.');
					updating = false;
				} else {
					console.error('Failed to update system settings. Retrying...');
				}
			} catch (error) {
				console.error('Error updating system settings:', error);
			}
		}
	}

	function toggleSystemStatus() {
		systemStatus = systemStatus === 1 ? 0 : 1;
		pumpStatus = 'OFF';
		updateSystemSettings();
	}
</script>

<main class="max-w-full space-y-2 px-2">
	<Card padding="none" class="max-w-full border-green-200">
		<Alert color="green" dismissable>
			<InfoCircleSolid slot="icon" class="h-5 w-5" />
			All systems are currently functional
		</Alert>
	</Card>
	<div class="gap-2 md:grid md:grid-cols-2">
		<Soilmoisture />
		<Waterpump />
		<Card class="mt-2 grid min-w-full grid-cols-3 items-center gap-4 bg-blue-100 md:mt-0">
			<div class="col-span-2 border-blue-400 text-xl font-bold text-blue-900">
				System Status: {systemStatus === 1 ? 'ON' : 'OFF'}
			</div>
			{#if updating}
				<Button color="blue">Updating...</Button>
			{:else}
				<Button on:click={toggleSystemStatus} color="blue">
					{systemStatus === 1 ? 'Turn System Off' : 'Turn System On'}
				</Button>
			{/if}
		</Card>
		<Card class="mt-2 grid min-w-full grid-cols-3 items-center gap-4 bg-red-100 md:mt-0">
			<Label class="col-span-2">
				Moisture Threshold
				<Range id="range-minmax" min="300" max="1200" bind:value={threshold} />
				<p>Value: {threshold}</p>
			</Label>
			{#if updating}
				<Button color="red">Updating...</Button>
			{:else}
				<Button on:click={updateSystemSettings} color="red">Update Threshold</Button>
			{/if}
		</Card>
	</div>
</main>
