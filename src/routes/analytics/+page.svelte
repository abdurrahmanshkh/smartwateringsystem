<script>
	import { Card, Badge, Spinner, Progressbar, Alert } from 'flowbite-svelte';
	import { onMount } from 'svelte';

	let loading = true;
	let error = '';
	let channelData = { feeds: [] };
	let plants = []; // NEW: store distinct plant/unit data if present

	let analytics = {
		totalReadings: 0,
		avgMoisture: 0,
		minMoisture: 0,
		maxMoisture: 0,
		pumpActivations: 0,
		wateringFrequency: 0,
		moistureTrend: 'stable',

		// Temperature & Humidity
		avgTemp: 0,
		minTemp: 0,
		maxTemp: 0,
		tempTrend: 'stable',
		avgHumidity: 0,
		minHumidity: 0,
		maxHumidity: 0,
		humidityTrend: 'stable'
	};

	onMount(() => {
		fetchData();
	});

	async function fetchData() {
		try {
			loading = true;
			error = '';
			const res = await fetch('/api/feeds?limit=150', { cache: 'no-store' });
			if (!res.ok) throw new Error(`HTTP ${res.status}`);
			const data = await res.json();
			channelData = data;
			const feeds = Array.isArray(data.feeds) ? data.feeds : [];

			if (feeds.length === 0) throw new Error('No data received from server.');

			// Detect distinct plants if the backend includes "plantId" or "unit" field
			const plantKeys = [...new Set(feeds.map(f => f.plantId || f.unit || 'Default'))];
			plants = plantKeys.map(key => ({
				name: key,
				readings: feeds.filter(f => (f.plantId || f.unit || 'Default') === key)
			}));

			// Combine all feeds for global analytics
			calculateAnalytics(feeds);
		} catch (err) {
			console.error('Error fetching analytics:', err);
			error = err.message || 'Failed to load analytics data.';
		} finally {
			loading = false;
		}
	}

	function calculateAnalytics(feeds) {
		if (!feeds || feeds.length === 0) return;

		// Ensure sorted order oldest → newest
		const ordered = [...feeds].sort((a, b) => new Date(a.created_at) - new Date(b.created_at));

		// Extract numeric fields
		const moistureValues = ordered.map(f => parseInt(f.field1) || 0).filter(v => v > 0);
		const pumpValues = ordered.map(f => parseInt(f.field2) || 0);
		const tempValues = ordered.map(f => parseInt(f.field5) || 0).filter(v => v > 0);
		const humidityValues = ordered.map(f => parseInt(f.field6) || 0).filter(v => v > 0);

		analytics.totalReadings = ordered.length;

		// Moisture calculations
		if (moistureValues.length > 0) {
			analytics.avgMoisture = Math.round(moistureValues.reduce((a, b) => a + b, 0) / moistureValues.length);
			analytics.minMoisture = Math.min(...moistureValues);
			analytics.maxMoisture = Math.max(...moistureValues);

			const firstAvg = avg(moistureValues.slice(0, 10));
			const lastAvg = avg(moistureValues.slice(-10));

			if (lastAvg > firstAvg + 20) analytics.moistureTrend = 'drying';
			else if (lastAvg < firstAvg - 20) analytics.moistureTrend = 'wetting';
			else analytics.moistureTrend = 'stable';
		}

		// Pump stats
		analytics.pumpActivations = pumpValues.filter(v => v === 1).length;
		analytics.wateringFrequency = ((analytics.pumpActivations / analytics.totalReadings) * 100).toFixed(1);

		// Temperature analysis
		if (tempValues.length > 0) {
			analytics.avgTemp = Math.round(avg(tempValues));
			analytics.minTemp = Math.min(...tempValues);
			analytics.maxTemp = Math.max(...tempValues);

			const firstTemp = avg(tempValues.slice(0, 10));
			const lastTemp = avg(tempValues.slice(-10));
			if (lastTemp > firstTemp + 2) analytics.tempTrend = 'warming';
			else if (lastTemp < firstTemp - 2) analytics.tempTrend = 'cooling';
			else analytics.tempTrend = 'stable';
		}

		// Humidity analysis
		if (humidityValues.length > 0) {
			analytics.avgHumidity = Math.round(avg(humidityValues));
			analytics.minHumidity = Math.min(...humidityValues);
			analytics.maxHumidity = Math.max(...humidityValues);

			const firstHum = avg(humidityValues.slice(0, 10));
			const lastHum = avg(humidityValues.slice(-10));
			if (lastHum > firstHum + 10) analytics.humidityTrend = 'wetting';
			else if (lastHum < firstHum - 10) analytics.humidityTrend = 'drying';
			else analytics.humidityTrend = 'stable';
		}
	}

	function avg(arr) {
		if (!arr || arr.length === 0) return 0;
		return arr.reduce((a, b) => a + b, 0) / arr.length;
	}
</script>

<svelte:head>
	<title>Analytics - Smart Plant Watering System</title>
</svelte:head>

<div class="space-y-5">
	<div>
		<h1 class="text-2xl md:text-3xl font-bold bg-gradient-to-r from-green-600 to-teal-600 bg-clip-text text-transparent flex items-center gap-2">
			📊 System Analytics
		</h1>
		<p class="text-sm text-gray-600 mt-1.5">Comprehensive analysis of all connected plants and environment.</p>
	</div>

	{#if loading}
		<Card class="min-w-full shadow-md border border-gray-200">
			<div class="text-center py-12">
				<Spinner size="8" class="mx-auto mb-3" />
				<p class="text-gray-600">Loading analytics data...</p>
			</div>
		</Card>
	{:else if error}
		<Alert color="red" icon>
			<strong>Error:</strong> {error}
		</Alert>
	{:else}
		<!-- ============ Global Stats ============ -->
		<div class="grid grid-cols-2 lg:grid-cols-6 gap-3 md:gap-4">
			{#each [
				{ icon: '📈', label: 'Total Readings', value: analytics.totalReadings, color: 'blue' },
				{ icon: '💧', label: 'Avg Moisture', value: analytics.avgMoisture, color: 'green' },
				{ icon: '🔄', label: 'Pump Cycles', value: analytics.pumpActivations, color: 'purple' },
				{ icon: '🌡️', label: 'Avg Temp', value: `${analytics.avgTemp}°C`, color: 'orange' },
				{ icon: '💨', label: 'Avg Humidity', value: `${analytics.avgHumidity}%`, color: 'cyan' },
				{ icon: '⚡', label: 'Frequency', value: `${analytics.wateringFrequency}%`, color: 'amber' }
			] as stat}
				<Card class="min-w-full shadow-md border border-{stat.color}-200 bg-gradient-to-br from-{stat.color}-50 to-{stat.color}-100">
					<div class="text-center">
						<div class="text-2xl mb-2">{stat.icon}</div>
						<p class="text-xs text-gray-600 mb-1">{stat.label}</p>
						<p class="text-xl md:text-2xl font-bold text-{stat.color}-900">{stat.value}</p>
					</div>
				</Card>
			{/each}
		</div>

		<!-- ============ Plant-wise Analytics ============ -->
		{#if plants.length > 1}
			<Card class="min-w-full shadow-md border border-green-200 bg-gradient-to-br from-green-50 to-teal-50">
				<h2 class="text-xl font-bold text-gray-900 mb-3">Plant-wise Summary</h2>
				<div class="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3">
					{#each plants as plant}
						<div class="p-3 bg-white rounded-lg border border-gray-200">
							<p class="font-semibold text-green-700">{plant.name}</p>
							<p class="text-xs text-gray-600 mb-1">{plant.readings.length} readings</p>
							<p class="text-sm text-gray-700">
								Moisture avg:
								<span class="font-bold">
									{Math.round(avg(plant.readings.map(f => parseInt(f.field1) || 0)))} 
								</span>
							</p>
						</div>
					{/each}
				</div>
			</Card>
		{/if}

		<!-- ============ Detailed & Recommendations ============ -->
		<Card class="min-w-full shadow-md border border-gray-200">
			<h2 class="text-xl font-bold text-gray-900 mb-4">Detailed Statistics</h2>
			<div class="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3">
				<div class="p-3 bg-green-50 border border-green-200 rounded-lg">
					<p class="text-sm text-gray-600">Moisture Range</p>
					<p class="text-lg font-bold">{analytics.minMoisture} - {analytics.maxMoisture}</p>
					<Badge color="green" class="text-xs mt-2">
						{analytics.moistureTrend === 'stable' ? '➡️ Stable' :
						 analytics.moistureTrend === 'drying' ? '📈 Drying' : '📉 Wetting'}
					</Badge>
				</div>

				<div class="p-3 bg-orange-50 border border-orange-200 rounded-lg">
					<p class="text-sm text-gray-600">Temperature Range</p>
					<p class="text-lg font-bold">{analytics.minTemp}°C - {analytics.maxTemp}°C</p>
					<Badge color="orange" class="text-xs mt-2">
						{analytics.tempTrend === 'warming' ? '📈 Warming' :
						 analytics.tempTrend === 'cooling' ? '📉 Cooling' : '➡️ Stable'}
					</Badge>
				</div>

				<div class="p-3 bg-cyan-50 border border-cyan-200 rounded-lg">
					<p class="text-sm text-gray-600">Humidity Range</p>
					<p class="text-lg font-bold">{analytics.minHumidity}% - {analytics.maxHumidity}%</p>
					<Badge color="cyan" class="text-xs mt-2">
						{analytics.humidityTrend === 'wetting' ? '📈 Wetting' :
						 analytics.humidityTrend === 'drying' ? '📉 Drying' : '➡️ Stable'}
					</Badge>
				</div>
			</div>
		</Card>

		<Card class="min-w-full shadow-md border border-cyan-300 bg-gradient-to-br from-cyan-50 to-blue-50">
			<h2 class="text-xl font-bold text-gray-900 mb-4">💡 Environmental Recommendations</h2>
			<div class="space-y-2">
				{#if analytics.avgTemp > 35}
					<Alert color="red">🌡️ High temperature detected — provide shade or ventilation.</Alert>
				{/if}
				{#if analytics.avgTemp < 5}
					<Alert color="blue">❄️ Very low temperature — consider adding heat or insulation.</Alert>
				{/if}
				{#if analytics.avgHumidity > 85}
					<Alert color="orange">💧 High humidity — increase air circulation.</Alert>
				{/if}
				{#if analytics.avgHumidity < 30}
					<Alert color="amber">🌵 Low humidity — mist plants or use humidifier.</Alert>
				{/if}
				{#if analytics.wateringFrequency > 50}
					<Alert color="purple">🔄 Pump running too frequently — check threshold or leaks.</Alert>
				{/if}
				{#if analytics.avgTemp >= 15 && analytics.avgTemp <= 30 && analytics.avgHumidity >= 40 && analytics.avgHumidity <= 70}
					<Alert color="green">✅ Ideal environmental conditions detected.</Alert>
				{/if}
			</div>
		</Card>

		<Card class="min-w-full shadow-md border border-gray-200">
			<h2 class="text-xl font-bold text-gray-900 mb-3">System Efficiency</h2>
			<div class="space-y-3">
				<div>
					<div class="flex justify-between mb-1">
						<span class="text-sm text-gray-700">Watering Efficiency</span>
						<span class="text-sm font-bold text-green-600">
							{analytics.wateringFrequency < 30 ? 'Excellent' :
							 analytics.wateringFrequency < 50 ? 'Good' : 'Moderate'}
						</span>
					</div>
					<Progressbar progress={Math.min(100, analytics.wateringFrequency * 2)} />
				</div>

				<div>
					<div class="flex justify-between mb-1">
						<span class="text-sm text-gray-700">Climate Stability</span>
						<span class="text-sm font-bold text-blue-600">
							{analytics.tempTrend === 'stable' && analytics.humidityTrend === 'stable'
								? 'Excellent'
								: 'Good'}
						</span>
					</div>
					<Progressbar progress={analytics.tempTrend === 'stable' && analytics.humidityTrend === 'stable' ? 100 : 75} />
				</div>
			</div>
		</Card>
	{/if}
</div>
