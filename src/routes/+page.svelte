<script>
	import Soilmoisture from './soilmoisture.svelte';
	import Waterpump from './waterpump.svelte';
	import SystemStats from './system-stats.svelte';
	import QuickActions from './quick-actions.svelte';
	import { Alert, Card, Button, Badge, Spinner } from 'flowbite-svelte';
	import { InfoCircleSolid, ExclamationCircleSolid, CheckCircleSolid } from 'flowbite-svelte-icons';
	import { Range, Label, Toggle } from 'flowbite-svelte';
	import { onMount } from 'svelte';

	// Centralized data store
	let channelData = {
		moistureLevel: 0,
		pumpStatus: 'OFF',
		systemStatus: 0,
		threshold: 250,
		feeds: [],
		lastUpdate: null
	};
	
	let updating = false;
	let loading = true;
	let error = '';
	let success = '';
	let localThreshold = 250;
	let connectionStatus = 'connected';
	let autoRefresh = true;
	let refreshInterval = 10000; // 10 seconds

	// Calculate system health score
	$: healthScore = calculateHealthScore(channelData.moistureLevel, channelData.systemStatus);
	
	// Determine moisture status with more detailed levels
	$: moistureStatus = getMoistureStatus(channelData.moistureLevel);
	
	// Calculate uptime from feeds
	$: systemUptime = channelData.feeds.length > 0 ? calculateUptime(channelData.feeds) : '0h 0m';

	function calculateHealthScore(moisture, status) {
		if (status === 0) return { score: 0, label: 'System Off', color: 'gray' };
		
		let score = 100;
		if (moisture > 350) score = 30; // Very dry
		else if (moisture > 300) score = 60; // Dry
		else if (moisture > 250) score = 85; // Slightly dry
		else if (moisture > 150) score = 100; // Optimal
		else if (moisture > 100) score = 75; // Slightly wet
		else score = 40; // Too wet
		
		const label = score >= 85 ? 'Excellent' : score >= 70 ? 'Good' : score >= 50 ? 'Fair' : 'Poor';
		const color = score >= 85 ? 'green' : score >= 70 ? 'blue' : score >= 50 ? 'yellow' : 'red';
		
		return { score, label, color };
	}

	function getMoistureStatus(moisture) {
		if (moisture > 350) return { text: 'Critical - Very Dry', color: 'red', icon: '🔴' };
		if (moisture > 300) return { text: 'Dry - Needs Water', color: 'orange', icon: '🟠' };
		if (moisture > 250) return { text: 'Slightly Dry', color: 'yellow', icon: '🟡' };
		if (moisture > 150) return { text: 'Optimal', color: 'green', icon: '🟢' };
		if (moisture > 100) return { text: 'Slightly Wet', color: 'blue', icon: '🔵' };
		return { text: 'Too Wet', color: 'purple', icon: '🟣' };
	}

	function calculateUptime(feeds) {
		if (feeds.length < 2) return '0h 0m';
		
		const firstFeed = new Date(feeds.created_at);
		const lastFeed = new Date(feeds[feeds.length - 1].created_at);
		const diffMs = lastFeed - firstFeed;
		const diffHrs = Math.floor(diffMs / (1000 * 60 * 60));
		const diffMins = Math.floor((diffMs % (1000 * 60 * 60)) / (1000 * 60));
		
		return `${diffHrs}h ${diffMins}m`;
	}

	onMount(() => {
		fetchAllData();
		
		const intervalId = setInterval(() => {
			if (autoRefresh) {
				fetchAllData();
			}
		}, refreshInterval);
		
		return () => clearInterval(intervalId);
	});

	async function fetchAllData() {
		const url = 'https://api.thingspeak.com/channels/2736648/feeds.json?results=20';
		
		try {
			connectionStatus = 'connecting';
			const response = await fetch(url);
			
			if (!response.ok) {
				throw new Error(`HTTP error! status: ${response.status}`);
			}
			
			const data = await response.json();
			
			if (data.feeds && data.feeds.length > 0) {
				const latestFeed = data.feeds[data.feeds.length - 1];
				
				channelData = {
					moistureLevel: parseInt(latestFeed.field1) || 0,
					pumpStatus: latestFeed.field2 === '1' ? 'ON' : 'OFF',
					systemStatus: parseInt(latestFeed.field3) || 0,
					threshold: parseInt(latestFeed.field4) || 250,
					feeds: data.feeds,
					lastUpdate: new Date(latestFeed.created_at)
				};
				
				localThreshold = channelData.threshold;
				error = '';
				connectionStatus = 'connected';
				console.log('Data updated successfully');
			}
		} catch (err) {
			console.error('Error fetching data:', err);
			error = `Failed to fetch data: ${err.message}. Please check your connection.`;
			connectionStatus = 'disconnected';
		} finally {
			loading = false;
		}
	}

	async function updateSystemSettings() {
		updating = true;
		error = '';
		success = '';
		
		const apiKey = 'CV5WWIPTAVEW6RMD';
		const url = `https://api.thingspeak.com/update?api_key=${apiKey}&field3=${channelData.systemStatus}&field4=${channelData.threshold}`;

		let attempts = 0;
		const maxAttempts = 5;
		let updateSuccess = false;

		while (attempts < maxAttempts && !updateSuccess) {
			try {
				console.log(`Update attempt ${attempts + 1} of ${maxAttempts}`);
				const response = await fetch(url);
				const data = await response.text();
				
				console.log('ThingSpeak update response:', data);
				
				if (data !== '0') {
					console.log('System settings updated successfully. Entry ID:', data);
					updateSuccess = true;
					success = 'Settings updated successfully! ✓';
					error = '';
					setTimeout(() => success = '', 3000);
					setTimeout(fetchAllData, 2000);
				} else {
					throw new Error('ThingSpeak returned 0 - update failed');
				}
			} catch (err) {
				console.error(`Error updating system settings (attempt ${attempts + 1}):`, err);
				attempts++;
				
				if (attempts < maxAttempts) {
					const delay = Math.min(1000 * Math.pow(2, attempts), 10000);
					console.log(`Retrying in ${delay}ms...`);
					await new Promise(resolve => setTimeout(resolve, delay));
				} else {
					error = 'Failed to update system settings after multiple attempts. ThingSpeak may be rate limiting. Please try again later.';
				}
			}
		}
		
		updating = false;
	}

	function toggleSystemStatus() {
		channelData.systemStatus = channelData.systemStatus === 1 ? 0 : 1;
		updateSystemSettings();
	}

	function updateThreshold() {
		channelData.threshold = localThreshold;
		updateSystemSettings();
	}

	// Reactive statements
	$: currentMoisture = channelData.moistureLevel;
	$: currentPumpStatus = channelData.pumpStatus;
	$: currentSystemStatus = channelData.systemStatus;
	$: currentThreshold = channelData.threshold;
	$: currentFeeds = channelData.feeds;
	$: lastUpdateText = channelData.lastUpdate 
		? `Last update: ${channelData.lastUpdate.toLocaleTimeString()}` 
		: 'No data';
</script>

<svelte:head>
	<title>Dashboard - Smart Plant Watering System</title>
</svelte:head>

<div class="space-y-6 animate-fade-in">
	<!-- Header Section -->
	<div class="flex flex-col md:flex-row justify-between items-start md:items-center gap-4">
		<div>
			<h1 class="text-4xl font-bold bg-gradient-to-r from-green-600 to-teal-600 bg-clip-text text-transparent">
				System Dashboard
			</h1>
			<p class="text-gray-600 mt-2 flex items-center gap-2">
				<span class="text-sm">{lastUpdateText}</span>
				<Badge color={connectionStatus === 'connected' ? 'green' : 'red'} class="text-xs">
					{connectionStatus === 'connected' ? '● Online' : '● Offline'}
				</Badge>
			</p>
		</div>
		
		<div class="flex items-center gap-3">
			<Toggle bind:checked={autoRefresh} class="text-sm">
				Auto-refresh
			</Toggle>
			<Button on:click={fetchAllData} disabled={loading} size="sm" color="alternative">
				{#if loading}
					<Spinner size="4" class="mr-2" />
				{:else}
					<svg class="w-4 h-4 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
						<path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15" />
					</svg>
				{/if}
				Refresh
			</Button>
		</div>
	</div>

	<!-- Status Alerts -->
	{#if error}
		<Alert color="red" dismissable on:dismiss={() => error = ''} class="shadow-lg">
			<ExclamationCircleSolid slot="icon" class="h-5 w-5" />
			<span class="font-semibold">Error:</span> {error}
		</Alert>
	{:else if success}
		<Alert color="green" dismissable on:dismiss={() => success = ''} class="shadow-lg">
			<CheckCircleSolid slot="icon" class="h-5 w-5" />
			{success}
		</Alert>
	{:else if !loading}
		<Alert color="green" dismissable class="shadow-lg">
			<CheckCircleSolid slot="icon" class="h-5 w-5" />
			<span class="font-semibold">All systems operational</span> - Monitoring {currentFeeds.length} data points
		</Alert>
	{/if}

	<!-- System Health Card -->
	<Card class="shadow-xl border-2 border-{healthScore.color}-200 bg-gradient-to-br from-white to-{healthScore.color}-50">
		<div class="flex flex-col md:flex-row justify-between items-start md:items-center gap-4">
			<div>
				<h3 class="text-2xl font-bold text-gray-800 mb-2">System Health</h3>
				<div class="flex items-center gap-3">
					<div class="relative w-16 h-16">
						<svg class="w-16 h-16 transform -rotate-90">
							<circle cx="32" cy="32" r="28" stroke="currentColor" stroke-width="4" fill="none" class="text-gray-200" />
							<circle 
								cx="32" 
								cy="32" 
								r="28" 
								stroke="currentColor" 
								stroke-width="4" 
								fill="none" 
								class="text-{healthScore.color}-600 transition-all duration-1000"
								style="stroke-dasharray: {2 * Math.PI * 28}; stroke-dashoffset: {2 * Math.PI * 28 * (1 - healthScore.score / 100)}"
							/>
						</svg>
						<span class="absolute inset-0 flex items-center justify-center text-lg font-bold">{healthScore.score}</span>
					</div>
					<div>
						<Badge color={healthScore.color} large>{healthScore.label}</Badge>
						<p class="text-sm text-gray-600 mt-1">Status: {moistureStatus.icon} {moistureStatus.text}</p>
					</div>
				</div>
			</div>
			
			<SystemStats 
				uptime={systemUptime}
				dataPoints={currentFeeds.length}
				moistureLevel={currentMoisture}
				pumpStatus={currentPumpStatus}
			/>
		</div>
	</Card>

	<!-- Quick Actions -->
	<QuickActions 
		systemStatus={currentSystemStatus}
		onToggleSystem={toggleSystemStatus}
		{updating}
	/>

	<!-- Main Dashboard Grid -->
	<div class="grid grid-cols-1 lg:grid-cols-2 gap-6">
		<!-- Soil Moisture -->
		<div class="transform transition-transform hover:scale-[1.02]">
			<Soilmoisture moistureLevel={currentMoisture} feeds={currentFeeds} />
		</div>

		<!-- Water Pump -->
		<div class="transform transition-transform hover:scale-[1.02]">
			<Waterpump pumpStatus={currentPumpStatus} feeds={currentFeeds} />
		</div>
	</div>

	<!-- Control Cards -->
	<div class="grid grid-cols-1 lg:grid-cols-2 gap-6">
		<!-- System Control -->
		<Card class="shadow-xl bg-gradient-to-br from-blue-50 to-blue-100 border-2 border-blue-300">
			<div class="space-y-4">
				<div class="flex items-center justify-between">
					<div>
						<h3 class="text-xl font-bold text-blue-900">System Control</h3>
						<p class="text-sm text-blue-700 mt-1">
							Current: <Badge color={currentSystemStatus === 1 ? 'green' : 'red'}>
								{currentSystemStatus === 1 ? 'ACTIVE' : 'INACTIVE'}
							</Badge>
						</p>
					</div>
					<div class="text-4xl">{currentSystemStatus === 1 ? '✅' : '⏸️'}</div>
				</div>
				
				<div class="p-4 bg-white/70 rounded-lg">
					<p class="text-sm text-gray-700 mb-3">
						{currentSystemStatus === 1 
							? 'System is actively monitoring and will water plants automatically when needed.' 
							: 'System is paused. No automatic watering will occur.'}
					</p>
					<Button 
						on:click={toggleSystemStatus} 
						color={currentSystemStatus === 1 ? 'red' : 'green'}
						disabled={updating}
						class="w-full font-semibold"
						size="lg"
					>
						{#if updating}
							<Spinner size="4" class="mr-2" />
						{:else if currentSystemStatus === 1}
							<svg class="w-5 h-5 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
								<path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M10 9v6m4-6v6m7-3a9 9 0 11-18 0 9 9 0 0118 0z" />
							</svg>
							Pause System
						{:else}
							<svg class="w-5 h-5 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
								<path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M14.752 11.168l-3.197-2.132A1 1 0 0010 9.87v4.263a1 1 0 001.555.832l3.197-2.132a1 1 0 000-1.664z" />
								<path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
							</svg>
							Start System
						{/if}
					</Button>
				</div>
			</div>
		</Card>

		<!-- Threshold Control -->
		<Card class="shadow-xl bg-gradient-to-br from-red-50 to-red-100 border-2 border-red-300">
			<div class="space-y-4">
				<div class="flex items-center justify-between">
					<div>
						<h3 class="text-xl font-bold text-red-900">Moisture Threshold</h3>
						<p class="text-sm text-red-700 mt-1">
							Current: <Badge color="red">{currentThreshold}</Badge>
						</p>
					</div>
					<div class="text-4xl">🎯</div>
				</div>
				
				<div class="p-4 bg-white/70 rounded-lg space-y-4">
					<Label>
						<span class="text-gray-800 font-semibold">Set Threshold Value</span>
						<Range 
							id="threshold-range" 
							min="70" 
							max="430" 
							bind:value={localThreshold}
							class="mt-2"
						/>
						<div class="flex justify-between items-center mt-3">
							<div>
								<p class="text-2xl font-bold text-gray-900">{localThreshold}</p>
								<p class="text-xs text-gray-600">
									{localThreshold > 300 ? 'Dry trigger' : localThreshold > 200 ? 'Balanced' : 'Wet trigger'}
								</p>
							</div>
							<div class="text-xs text-gray-600 text-right">
								<p>Range: 70 (Wet) - 430 (Dry)</p>
								<p class="text-blue-600 font-medium mt-1">
									Higher = Drier soil triggers watering
								</p>
							</div>
						</div>
					</Label>
					
					<Button 
						on:click={updateThreshold} 
						color="red"
						disabled={updating || localThreshold === currentThreshold}
						class="w-full font-semibold"
						size="lg"
					>
						{#if updating}
							<Spinner size="4" class="mr-2" />
							Updating...
						{:else}
							<svg class="w-5 h-5 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
								<path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15" />
							</svg>
							Update Threshold
						{/if}
					</Button>
				</div>
			</div>
		</Card>
	</div>
</div>

<style>
	@keyframes fade-in {
		from {
			opacity: 0;
			transform: translateY(20px);
		}
		to {
			opacity: 1;
			transform: translateY(0);
		}
	}

	.animate-fade-in {
		animation: fade-in 0.5s ease-out;
	}
</style>
