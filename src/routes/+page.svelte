<script>
	import Soilmoisture from './soilmoisture.svelte';
	import Waterpump from './waterpump.svelte';
	import { Alert, Card, Button } from 'flowbite-svelte';
	import { InfoCircleSolid } from 'flowbite-svelte-icons';
	import { onMount } from 'svelte';

	let moistureLevel = 0;
	let pumpStatus = 0;
	let systemStatus = 0; // 0 = Off, 1 = On
	let threshold = 0; // Default threshold value

	// Call function on mount and update every 5 seconds
	onMount(() => {
		fetchLatestData();
		setInterval(fetchLatestData, 5000);
	});

	// Function to fetch the most recent data
	async function fetchLatestData() {
		const url = 'https://api.thingspeak.com/channels/2736648/feeds.json?results=1';
		try {
			const response = await fetch(url);
			const data = await response.json();
			const feed = data.feeds[0];

			moistureLevel = feed.field1;
			pumpStatus = feed.field2;
			systemStatus = feed.field3;
			threshold = feed.field4;
		} catch (error) {
			console.error('Error fetching latest data:', error);
		}
	}

	// Function to update system status and threshold
	async function updateSystemSettings() {
		const apiKey = 'CV5WWIPTAVEW6RMD';
		const url = `https://api.thingspeak.com/update?api_key=${apiKey}&field1=${moistureLevel}&field2=${pumpStatus}&field3=${systemStatus}&field4=${threshold}`;

		try {
			const response = await fetch(url);
			if (response.ok) {
				console.log('System settings updated successfully.');
			} else {
				console.error('Failed to update system settings.');
			}
		} catch (error) {
			console.error('Error updating system settings:', error);
		}
	}

	// Function for system status button
	function toggleSystemStatus() {
		updateSystemSettings();
		if (systemStatus == 0) {
			systemStatus = 1;
		} else {
			systemStatus = 0;
		}
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
	</div>
	<!-- Card for switching on and off the system -->
	<Card padding="none" class="max-w-full">
		<div class="border-b border-primary-400 pb-4 text-xl font-semibold text-primary-900">
			System Status
			<button on:click={toggleSystemStatus}>
				{systemStatus == 1 ? 'Turn Off System' : 'Turn On System'}
			</button>
		</div>
	</Card>
</main>
