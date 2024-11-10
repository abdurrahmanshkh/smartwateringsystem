<script>
	import { onMount } from 'svelte';
	import {
		Chart,
		LineController,
		LineElement,
		PointElement,
		LinearScale,
		Title,
		CategoryScale
	} from 'chart.js';

	let moistureLevel = 'Loading...';
	let pumpStatus = 'Loading...';
	let systemStatus = 0; // 0 = Off, 1 = On
	let threshold = 800; // Default threshold value
	let moistureChart;
	let pumpChart;

	// Register necessary components with Chart.js
	Chart.register(LineController, LineElement, PointElement, LinearScale, Title, CategoryScale);

	// Function to fetch the most recent data
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
			moistureLevel = 'Error';
			pumpStatus = 'Error';
		}
	}

	// Function to fetch the 10 most recent values for graphs
	async function fetchRecentData() {
		const url = 'https://api.thingspeak.com/channels/2736648/feeds.json?results=10';
		try {
			const response = await fetch(url);
			const data = await response.json();
			const feeds = data.feeds;

			const moistureValues = feeds.map((feed) => feed.field1);
			const pumpStatuses = feeds.map((feed) => (feed.field2 === '1' ? 1 : 0));
			const labels = feeds.map((feed) => new Date(feed.created_at).toLocaleTimeString());

			updateMoistureChart(labels, moistureValues);
			updatePumpChart(labels, pumpStatuses);
		} catch (error) {
			console.error('Error fetching recent data:', error);
		}
	}

	// Function to initialize or update the moisture chart
	function updateMoistureChart(labels, data) {
		if (moistureChart) {
			moistureChart.data.labels = labels;
			moistureChart.data.datasets[0].data = data;
			moistureChart.update();
		} else {
			const ctx = document.getElementById('moistureChart').getContext('2d');
			moistureChart = new Chart(ctx, {
				type: 'line',
				data: {
					labels,
					datasets: [
						{
							label: 'Moisture Level',
							data,
							borderColor: 'rgba(75, 192, 192, 1)',
							backgroundColor: 'rgba(75, 192, 192, 0.2)',
							fill: true
						}
					]
				},
				options: {
					responsive: true,
					plugins: {
						title: {
							display: true,
							text: 'Moisture Level (Last 10 Entries)'
						}
					}
				}
			});
		}
	}

	// Function to initialize or update the pump chart
	function updatePumpChart(labels, data) {
		if (pumpChart) {
			pumpChart.data.labels = labels;
			pumpChart.data.datasets[0].data = data;
			pumpChart.update();
		} else {
			const ctx = document.getElementById('pumpChart').getContext('2d');
			pumpChart = new Chart(ctx, {
				type: 'line',
				data: {
					labels,
					datasets: [
						{
							label: 'Pump Status (ON/OFF)',
							data,
							borderColor: 'rgba(255, 99, 132, 1)',
							backgroundColor: 'rgba(255, 99, 132, 0.2)',
							fill: true,
							stepped: true
						}
					]
				},
				options: {
					responsive: true,
					plugins: {
						title: {
							display: true,
							text: 'Pump Status (Last 10 Entries)'
						}
					},
					scales: {
						y: {
							beginAtZero: true,
							suggestedMax: 1,
							ticks: {
								callback: (value) => (value === 1 ? 'ON' : 'OFF')
							}
						}
					}
				}
			});
		}
	}

	// Function to update system status and threshold
	async function updateSystemSettings() {
		const apiKey = 'CV5WWIPTAVEW6RMD';
		const url = `https://api.thingspeak.com/update?api_key=${apiKey}&field1=${moistureLevel}&field2=${pumpStatus === 'ON' ? 1 : 0}&field3=${systemStatus}&field4=${threshold}`;

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

	onMount(() => {
		fetchLatestData();
		fetchRecentData();
		const latestDataInterval = setInterval(fetchLatestData, 5000);
		const recentDataInterval = setInterval(fetchRecentData, 5000);

		return () => {
			clearInterval(latestDataInterval);
			clearInterval(recentDataInterval);
			if (moistureChart) moistureChart.destroy();
			if (pumpChart) pumpChart.destroy();
		};
	});
</script>

<div class="container">
	<h2>Smart Plant Watering System</h2>

	<div class="status">
		<strong>Moisture Level:</strong>
		{moistureLevel}
	</div>
	<div class="status">
		<strong>Pump Status:</strong>
		{pumpStatus}
	</div>

	<div class="controls">
		<button
			on:click={() => {
				systemStatus = systemStatus === 1 ? 0 : 1;
				updateSystemSettings();
			}}
		>
			{systemStatus === 1 ? 'Turn System Off' : 'Turn System On'}
		</button>

		<label>
			<span>Moisture Threshold: {threshold}</span>
			<input type="range" min="300" max="1500" bind:value={threshold} />
			<button on:click={updateSystemSettings}>Update Threshold</button>
		</label>
	</div>

	<canvas id="moistureChart" width="400" height="200"></canvas>
	<canvas id="pumpChart" width="400" height="200"></canvas>
</div>

<style>
	.container {
		max-width: 600px;
		margin: auto;
		text-align: center;
	}

	.status,
	.controls {
		font-size: 1.2em;
		margin: 10px 0;
	}

	.controls {
		display: flex;
		align-items: center;
		justify-content: space-between;
	}
</style>
