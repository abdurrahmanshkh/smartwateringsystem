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

	Chart.register(LineController, LineElement, PointElement, LinearScale, Title, CategoryScale);

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
			moistureLevel = 'Error';
			pumpStatus = 'Error';
		}
	}

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
							borderColor: '#42a5f5',
							backgroundColor: 'rgba(66, 165, 245, 0.2)',
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
							borderColor: '#ef5350',
							backgroundColor: 'rgba(239, 83, 80, 0.2)',
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

	function toggleSystemStatus() {
		systemStatus = systemStatus === 1 ? 0 : 1;
		updateSystemSettings();
	}

	onMount(() => {
		fetchInitialData();
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

	<div class="status-container">
		<div class="status-item">Moisture Level: {moistureLevel}</div>
		<div class="status-item">Pump Status: {pumpStatus}</div>
	</div>

	<div class="controls">
		<button on:click={toggleSystemStatus}>
			{systemStatus === 1 ? 'Turn System Off' : 'Turn System On'}
		</button>

		<div class="slider-container">
			<label>Moisture Threshold: {threshold}</label>
			<input
				type="range"
				min="300"
				max="1500"
				bind:value={threshold}
				on:change={updateSystemSettings}
			/>
		</div>
	</div>

	<div class="charts-container">
		<canvas id="moistureChart"></canvas>
		<canvas id="pumpChart"></canvas>
	</div>
</div>

<style>
	body {
		font-family: 'Arial', sans-serif;
		margin: 0;
		padding: 0;
		background-color: #f4f7f6;
		color: #333;
	}

	.container {
		max-width: 800px;
		margin: auto;
		padding: 20px;
		background-color: #fff;
		box-shadow: 0px 0px 10px rgba(0, 0, 0, 0.1);
		border-radius: 8px;
		text-align: center;
	}

	h2 {
		color: #1976d2;
	}

	.status-container {
		display: flex;
		justify-content: space-between;
		margin-top: 20px;
	}

	.status-item {
		flex: 1;
		padding: 10px;
		background-color: #e3f2fd;
		margin: 5px;
		border-radius: 8px;
		color: #1976d2;
		font-size: 1.1em;
		font-weight: bold;
	}

	.controls {
		display: flex;
		flex-direction: column;
		align-items: center;
		gap: 15px;
		margin: 20px 0;
	}

	.controls button {
		background-color: #1976d2;
		color: #fff;
		padding: 10px 20px;
		border: none;
		border-radius: 5px;
		font-size: 1em;
		cursor: pointer;
		transition: background-color 0.3s ease;
	}

	.controls button:hover {
		background-color: #145ca3;
	}

	.slider-container {
		display: flex;
		flex-direction: column;
		align-items: center;
		gap: 5px;
	}

	.charts-container {
		display: grid;
		gap: 20px;
		margin-top: 20px;
	}

	canvas {
		max-width: 100%;
		height: auto;
	}
</style>
