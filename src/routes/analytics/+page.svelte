<script>
	import { Card, Badge, Spinner } from 'flowbite-svelte';
	import { onMount } from 'svelte';
	
	let loading = true;
	let channelData = { feeds: [] };
	let analytics = {
		totalReadings: 0,
		avgMoisture: 0,
		minMoisture: 0,
		maxMoisture: 0,
		pumpActivations: 0,
		systemUptime: 0,
		wateringFrequency: 0,
		moistureTrend: 'stable'
	};

	onMount(async () => {
		await fetchData();
	});

	async function fetchData() {
		try {
			const response = await fetch('https://api.thingspeak.com/channels/2736648/feeds.json?results=100');
			const data = await response.json();
			channelData = data;
			calculateAnalytics(data.feeds);
		} catch (error) {
			console.error('Error fetching data:', error);
		} finally {
			loading = false;
		}
	}

	function calculateAnalytics(feeds) {
		if (feeds.length === 0) return;

		const moistureValues = feeds.map(f => parseInt(f.field1) || 0);
		const pumpValues = feeds.map(f => f.field2 || '0');

		analytics.totalReadings = feeds.length;
		analytics.avgMoisture = Math.round(moistureValues.reduce((a, b) => a + b, 0) / moistureValues.length);
		analytics.minMoisture = Math.min(...moistureValues);
		analytics.maxMoisture = Math.max(...moistureValues);
		analytics.pumpActivations = pumpValues.filter(v => v === '1').length;
		
		const recentAvg = moistureValues.slice(-10).reduce((a, b) => a + b, 0) / 10;
		const olderAvg = moistureValues.slice(0, 10).reduce((a, b) => a + b, 0) / 10;
		
		if (recentAvg > olderAvg + 20) analytics.moistureTrend = 'drying';
		else if (recentAvg < olderAvg - 20) analytics.moistureTrend = 'wetting';
		else analytics.moistureTrend = 'stable';

		analytics.wateringFrequency = (analytics.pumpActivations / analytics.totalReadings * 100).toFixed(1);
	}
</script>

<svelte:head>
	<title>Analytics - Smart Plant Watering System</title>
</svelte:head>

<div class="space-y-4 md:space-y-5">
	<div>
		<h1 class="text-2xl md:text-3xl lg:text-4xl font-bold bg-gradient-to-r from-green-600 to-teal-600 bg-clip-text text-transparent flex items-center gap-2">
			<span>📊</span> System Analytics
		</h1>
		<p class="text-sm md:text-base text-gray-600 mt-1.5">
			Comprehensive analysis of your watering system performance
		</p>
	</div>

	{#if loading}
		<Card class="min-w-full shadow-md border border-gray-200">
			<div class="text-center py-12">
				<Spinner size="8" class="mx-auto mb-3" />
				<p class="text-gray-600">Loading analytics data...</p>
			</div>
		</Card>
	{:else}
		<!-- Key Metrics -->
		<div class="grid grid-cols-2 lg:grid-cols-4 gap-3 md:gap-4">
			<Card class="min-w-full shadow-md border border-blue-200 bg-gradient-to-br from-blue-50 to-blue-100">
				<div class="text-center">
					<div class="text-3xl mb-2">📈</div>
					<p class="text-xs text-gray-600 mb-1">Total Readings</p>
					<p class="text-2xl md:text-3xl font-bold text-blue-900">{analytics.totalReadings}</p>
				</div>
			</Card>

			<Card class="min-w-full shadow-md border border-green-200 bg-gradient-to-br from-green-50 to-green-100">
				<div class="text-center">
					<div class="text-3xl mb-2">💧</div>
					<p class="text-xs text-gray-600 mb-1">Avg Moisture</p>
					<p class="text-2xl md:text-3xl font-bold text-green-900">{analytics.avgMoisture}</p>
				</div>
			</Card>

			<Card class="min-w-full shadow-md border border-purple-200 bg-gradient-to-br from-purple-50 to-purple-100">
				<div class="text-center">
					<div class="text-3xl mb-2">🔄</div>
					<p class="text-xs text-gray-600 mb-1">Pump Activations</p>
					<p class="text-2xl md:text-3xl font-bold text-purple-900">{analytics.pumpActivations}</p>
				</div>
			</Card>

			<Card class="min-w-full shadow-md border border-orange-200 bg-gradient-to-br from-orange-50 to-orange-100">
				<div class="text-center">
					<div class="text-3xl mb-2">⚡</div>
					<p class="text-xs text-gray-600 mb-1">Watering Frequency</p>
					<p class="text-2xl md:text-3xl font-bold text-orange-900">{analytics.wateringFrequency}%</p>
				</div>
			</Card>
		</div>

		<!-- Detailed Stats -->
		<Card class="min-w-full shadow-md border border-gray-200">
			<h2 class="text-xl md:text-2xl font-bold text-gray-900 mb-4">Detailed Statistics</h2>
			<div class="grid grid-cols-1 sm:grid-cols-3 gap-3">
				<div class="p-3 bg-gray-50 rounded-lg border border-gray-200">
					<p class="text-sm text-gray-600 mb-1.5">Moisture Range</p>
					<p class="text-lg font-bold text-gray-900">
						{analytics.minMoisture} - {analytics.maxMoisture}
					</p>
				</div>
				
				<div class="p-3 bg-gray-50 rounded-lg border border-gray-200">
					<p class="text-sm text-gray-600 mb-1.5">Trend</p>
					<Badge color={analytics.moistureTrend === 'stable' ? 'green' : 'yellow'} class="text-sm">
						{analytics.moistureTrend === 'drying' ? '📈 Drying' : 
						 analytics.moistureTrend === 'wetting' ? '📉 Wetting' : '➡️ Stable'}
					</Badge>
				</div>

				<div class="p-3 bg-gray-50 rounded-lg border border-gray-200">
					<p class="text-sm text-gray-600 mb-1.5">System Efficiency</p>
					<p class="text-lg font-bold text-green-600">
						{analytics.wateringFrequency < 30 ? 'Excellent' : 
						 analytics.wateringFrequency < 50 ? 'Good' : 'Moderate'}
					</p>
				</div>
			</div>
		</Card>

		<!-- Recommendations -->
		<Card class="min-w-full shadow-md border border-yellow-300 bg-gradient-to-br from-yellow-50 to-orange-50">
			<h2 class="text-xl md:text-2xl font-bold text-yellow-900 mb-4 flex items-center gap-2">
				<span>💡</span> Recommendations
			</h2>
			<div class="space-y-2.5">
				{#if analytics.avgMoisture > 300}
					<div class="p-3 bg-white rounded-lg border-l-4 border-red-500">
						<p class="font-semibold text-red-900 text-sm mb-1">High Moisture Alert</p>
						<p class="text-xs text-gray-700">Consider lowering your threshold to water more frequently.</p>
					</div>
				{/if}
				
				{#if analytics.wateringFrequency > 50}
					<div class="p-3 bg-white rounded-lg border-l-4 border-orange-500">
						<p class="font-semibold text-orange-900 text-sm mb-1">High Watering Frequency</p>
						<p class="text-xs text-gray-700">Your pump is running frequently. Check for leaks or adjust threshold.</p>
					</div>
				{/if}

				{#if analytics.moistureTrend === 'stable'}
					<div class="p-3 bg-white rounded-lg border-l-4 border-green-500">
						<p class="font-semibold text-green-900 text-sm mb-1">System Stable</p>
						<p class="text-xs text-gray-700">Your watering system is performing optimally!</p>
					</div>
				{/if}
				
				{#if analytics.avgMoisture <= 300 && analytics.wateringFrequency <= 50 && analytics.moistureTrend === 'stable'}
					<div class="p-3 bg-white rounded-lg border-l-4 border-blue-500">
						<p class="font-semibold text-blue-900 text-sm mb-1">All Systems Optimal</p>
						<p class="text-xs text-gray-700">No issues detected. System is running perfectly!</p>
					</div>
				{/if}
			</div>
		</Card>
	{/if}
</div>
