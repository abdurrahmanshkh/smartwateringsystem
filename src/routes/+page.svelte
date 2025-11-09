<script>
    import Soilmoisture from './soilmoisture.svelte';
    import Waterpump from './waterpump.svelte';
    import ClimateConditions from './climate-conditions.svelte';
    import { Alert, Card, Button, Badge, Spinner, Toggle, Range, Label } from 'flowbite-svelte';
    import { InfoCircleSolid, ExclamationCircleSolid, CheckCircleSolid } from 'flowbite-svelte-icons';
    import { onMount } from 'svelte';

    let channelData = {
        moistureLevel: 0,
        pumpStatus: 'OFF',
        systemStatus: 0,
        threshold: 250,
        temperature: 0,
        humidity: 0,
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
    let refreshInterval = 1000; // 1 second for livestreaming

    // Prevent overlapping fetches
    let isFetching = false;

    $: healthScore = calculateHealthScore(channelData.moistureLevel, channelData.systemStatus);
    $: moistureStatus = getMoistureStatus(channelData.moistureLevel);
    $: systemUptime = channelData.feeds.length > 0 ? calculateUptime(channelData.feeds) : '0h 0m';
    $: tempStatus = getTemperatureStatus(channelData.temperature);
    $: humidityStatus = getHumidityStatus(channelData.humidity);

    function calculateHealthScore(moisture, status) {
        if (status === 0) return { score: 0, label: 'System Off', color: 'gray' };
        
        let score = 100;
        if (moisture > 350) score = 30;
        else if (moisture > 300) score = 60;
        else if (moisture > 250) score = 85;
        else if (moisture > 150) score = 100;
        else if (moisture > 100) score = 75;
        else score = 40;
        
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

    function getTemperatureStatus(temp) {
        if (temp === 0) return { text: 'No Data', color: 'gray', icon: '❌' };
        if (temp > 35) return { text: 'Too Hot', color: 'red', icon: '🔥' };
        if (temp > 28) return { text: 'Warm', color: 'orange', icon: '☀️' };
        if (temp >= 18 && temp <= 28) return { text: 'Optimal', color: 'green', icon: '✅' };
        if (temp > 10) return { text: 'Cool', color: 'blue', icon: '❄️' };
        return { text: 'Very Cold', color: 'cyan', icon: '⛸️' };
    }

    function getHumidityStatus(humidity) {
        if (humidity === 0) return { text: 'No Data', color: 'gray', icon: '❌' };
        if (humidity > 80) return { text: 'Very Humid', color: 'blue', icon: '🌧️' };
        if (humidity > 60) return { text: 'Humid', color: 'cyan', icon: '☁️' };
        if (humidity >= 40 && humidity <= 70) return { text: 'Optimal', color: 'green', icon: '✅' };
        if (humidity > 30) return { text: 'Dry', color: 'orange', icon: '🌤️' };
        return { text: 'Very Dry', color: 'red', icon: '☀️' };
    }

    function calculateUptime(feeds) {
        if (!Array.isArray(feeds) || feeds.length < 2) return '0h 0m';
        const firstFeed = feeds[0]?.created_at ? new Date(feeds[0].created_at) : null;
        const lastFeed = feeds[feeds.length - 1]?.created_at ? new Date(feeds[feeds.length - 1].created_at) : null;

        if (!firstFeed || isNaN(firstFeed) || !lastFeed || isNaN(lastFeed)) return '0h 0m';

        const diffMs = lastFeed - firstFeed;
        if (isNaN(diffMs) || diffMs < 0) return '0h 0m';

        const diffHrs = Math.floor(diffMs / (1000 * 60 * 60));
        const diffMins = Math.floor((diffMs % (1000 * 60 * 60)) / (1000 * 60));
        return `${diffHrs}h ${diffMins}m`;
    }

    onMount(() => {
        // Initial fetch
        fetchAllData();
        
        // Polling interval for livestream (1s by default)
        const intervalId = setInterval(() => {
            if (autoRefresh) {
                fetchAllData();
            }
        }, refreshInterval);
        
        return () => clearInterval(intervalId);
    });

    async function fetchAllData() {
        // Avoid overlapping requests
        if (isFetching) return;
        isFetching = true;

        const url = `/api/feeds?limit=20`;

        try {
            connectionStatus = 'connecting';
            const response = await fetch(url, { cache: 'no-store' }); // no-store to help livestreaming
            if (!response.ok) {
                throw new Error(`HTTP error! status: ${response.status}`);
            }

            const data = await response.json();
            const feedsRaw = Array.isArray(data.feeds) ? data.feeds : [];

            if (feedsRaw.length > 0) {
                // Convert to oldest->newest so existing uptime and child components keep working
                const feeds = [...feedsRaw].reverse();

                const latestFeed = feeds[feeds.length - 1];

                channelData = {
                    moistureLevel: parseInt(latestFeed.field1) || 0,
                    pumpStatus: (latestFeed.field2 === '1' || latestFeed.field2 === 1) ? 'ON' : 'OFF',
                    systemStatus: Number.isFinite(Number(latestFeed.field3)) ? parseInt(latestFeed.field3) : (channelData.systemStatus || 0),
                    threshold: parseInt(latestFeed.field4) || channelData.threshold || 250,
                    temperature: parseInt(latestFeed.field5) || 0,
                    humidity: parseInt(latestFeed.field6) || 0,
                    feeds,
                    lastUpdate: latestFeed.created_at ? new Date(latestFeed.created_at) : new Date()
                };

                // Keep localThreshold in sync so slider shows current value
                localThreshold = channelData.threshold;
                error = '';
                connectionStatus = 'connected';
            } else {
                // No feeds available
                channelData.feeds = [];
                connectionStatus = 'connected';
            }
        } catch (err) {
            console.error('Error fetching data:', err);
            error = `Failed to fetch data: ${err.message}`;
            connectionStatus = 'disconnected';
        } finally {
            loading = false;
            isFetching = false;
        }
    }

    // Single-shot update to /api/settings (no retries)
    async function updateSystemSettings() {
        updating = true;
        error = '';
        success = '';

        const url = `/api/settings`;
        const body = {
            systemStatus: channelData.systemStatus,
            threshold: channelData.threshold
        };

        try {
            const response = await fetch(url, {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify(body)
            });

            if (!response.ok) {
                const text = await response.text().catch(()=>null);
                throw new Error(`Status ${response.status}${text ? ` - ${text}` : ''}`);
            }

            const resp = await response.json();
            if (resp && resp.ok === false) {
                throw new Error(resp.error || 'Server rejected update');
            }

            success = 'Settings updated successfully! ✓';
            // Immediately refresh data once to reflect changes in UI
            await fetchAllData();
            setTimeout(() => success = '', 2000);
        } catch (err) {
            console.error('updateSystemSettings error', err);
            error = `Failed to update settings: ${err.message}`;
        } finally {
            updating = false;
        }
    }

    function toggleSystemStatus() {
        // Toggle locally for instant UI feedback, then send to server
        channelData.systemStatus = channelData.systemStatus === 1 ? 0 : 1;
        updateSystemSettings();
    }

    function updateThreshold() {
        // Apply the slider value locally then send to server
        channelData.threshold = localThreshold;
        updateSystemSettings();
    }

    $: lastUpdateText = channelData.lastUpdate 
        ? `Last update: ${channelData.lastUpdate.toLocaleTimeString()}` 
        : 'No data';
</script>

<svelte:head>
    <title>Dashboard - Smart Plant Watering System</title>
</svelte:head>

<div class="space-y-4 md:space-y-5 animate-fade-in">
    <!-- Header -->
    <div class="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-3">
        <div>
            <h1 class="text-2xl md:text-3xl lg:text-4xl font-bold bg-gradient-to-r from-green-600 to-teal-600 bg-clip-text text-transparent">
                System Dashboard
            </h1>
            <div class="flex items-center gap-2 mt-1.5 flex-wrap">
                <p class="text-xs md:text-sm text-gray-600">{lastUpdateText}</p>
                <Badge color={connectionStatus === 'connected' ? 'green' : 'red'} class="text-xs">
                    {connectionStatus === 'connected' ? '● Online' : '● Offline'}
                </Badge>
            </div>
        </div>
        
        <div class="flex items-center gap-2 flex-wrap">
            <div class="flex items-center gap-2 bg-white px-3 py-1.5 rounded-lg shadow-sm border border-gray-200">
                <Toggle bind:checked={autoRefresh} size="small" />
                <span class="text-xs md:text-sm font-medium text-gray-700">Auto-refresh</span>
            </div>
            <Button on:click={fetchAllData} disabled={loading || isFetching} size="sm" color="light" class="shadow-sm">
                {#if loading || isFetching}
                    <Spinner size="4" class="mr-1.5" />
                {:else}
                    <svg class="w-4 h-4 mr-1.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15" />
                    </svg>
                {/if}
                Refresh
            </Button>
        </div>
    </div>

    <!-- Status Alert -->
    {#if error}
        <Alert color="red" dismissable on:dismiss={() => error = ''} class="shadow-sm">
            <ExclamationCircleSolid slot="icon" class="h-4 w-4" />
            <span class="text-sm"><span class="font-semibold">Error:</span> {error}</span>
        </Alert>
    {:else if success}
        <Alert color="green" dismissable on:dismiss={() => success = ''} class="shadow-sm">
            <CheckCircleSolid slot="icon" class="h-4 w-4" />
            <span class="text-sm">{success}</span>
        </Alert>
    {:else if !loading}
        <Alert color="green" dismissable class="shadow-sm">
            <CheckCircleSolid slot="icon" class="h-4 w-4" />
            <span class="text-sm"><span class="font-semibold">All systems operational</span> - Monitoring {channelData.feeds.length} data points</span>
        </Alert>
    {/if}

    <!-- System Health Card -->
    <Card class="min-w-full shadow-md border border-gray-200">
        <div class="flex flex-col lg:flex-row justify-between items-start lg:items-center gap-4">
            <div class="flex items-center gap-4">
                <div class="relative flex-shrink-0">
                    <svg class="w-20 h-20 transform -rotate-90">
                        <circle cx="40" cy="40" r="34" stroke="currentColor" stroke-width="6" fill="none" class="text-gray-200" />
                        <circle 
                            cx="40" 
                            cy="40" 
                            r="34" 
                            stroke="currentColor" 
                            stroke-width="6" 
                            fill="none" 
                            class="text-{healthScore.color}-600 transition-all duration-1000"
                            style="stroke-dasharray: {2 * Math.PI * 34}; stroke-dashoffset: {2 * Math.PI * 34 * (1 - healthScore.score / 100)}; stroke-linecap: round;"
                        />
                    </svg>
                    <span class="absolute inset-0 flex items-center justify-center text-xl font-bold text-gray-900">{healthScore.score}</span>
                </div>
                <div>
                    <h3 class="text-xl md:text-2xl font-bold text-gray-800 mb-1">System Health</h3>
                    <Badge color={healthScore.color} class="mb-1.5">{healthScore.label}</Badge>
                    <p class="text-sm text-gray-600 flex items-center gap-1.5">
                        {moistureStatus.icon} {moistureStatus.text}
                    </p>
                </div>
            </div>
            
            <!-- System Stats -->
            <div class="grid grid-cols-2 sm:grid-cols-4 gap-3 w-full lg:w-auto">
                <div class="text-center p-3 bg-gradient-to-br from-blue-50 to-blue-100 rounded-lg border border-blue-200">
                    <div class="text-xl mb-1">⏱️</div>
                    <p class="text-xs text-gray-600">Uptime</p>
                    <p class="text-sm font-bold text-gray-900">{systemUptime}</p>
                </div>
                <div class="text-center p-3 bg-gradient-to-br from-purple-50 to-purple-100 rounded-lg border border-purple-200">
                    <div class="text-xl mb-1">📊</div>
                    <p class="text-xs text-gray-600">Data Points</p>
                    <p class="text-sm font-bold text-gray-900">{channelData.feeds.length}</p>
                </div>
                <div class="text-center p-3 bg-gradient-to-br from-teal-50 to-teal-100 rounded-lg border border-teal-200">
                    <div class="text-xl mb-1">💧</div>
                    <p class="text-xs text-gray-600">Moisture</p>
                    <p class="text-sm font-bold text-gray-900">{channelData.moistureLevel}</p>
                </div>
                <div class="text-center p-3 bg-gradient-to-br from-green-50 to-green-100 rounded-lg border border-green-200">
                    <div class="text-xl mb-1">{channelData.pumpStatus === 'ON' ? '🔄' : '⏸️'}</div>
                    <p class="text-xs text-gray-600">Pump</p>
                    <p class="text-sm font-bold text-gray-900">{channelData.pumpStatus}</p>
                </div>
            </div>
        </div>
    </Card>

    <!-- Climate Status Quick View (NEW) -->
    <div class="grid grid-cols-1 sm:grid-cols-2 gap-3 md:gap-4">
        <Card class="min-w-full shadow-md border border-orange-200 bg-gradient-to-br from-orange-50 to-orange-100">
            <div class="flex justify-between items-center">
                <div>
                    <p class="text-xs text-orange-700 font-medium mb-1">Temperature</p>
                    <p class="text-2xl md:text-3xl font-bold text-orange-900">{channelData.temperature}°C</p>
                    <p class="text-xs text-orange-700 mt-1">{tempStatus.text}</p>
                </div>
                <div class="text-4xl">{tempStatus.icon}</div>
            </div>
        </Card>

        <Card class="min-w-full shadow-md border border-cyan-200 bg-gradient-to-br from-cyan-50 to-cyan-100">
            <div class="flex justify-between items-center">
                <div>
                    <p class="text-xs text-cyan-700 font-medium mb-1">Humidity</p>
                    <p class="text-2xl md:text-3xl font-bold text-cyan-900">{channelData.humidity}%</p>
                    <p class="text-xs text-cyan-700 mt-1">{humidityStatus.text}</p>
                </div>
                <div class="text-4xl">{humidityStatus.icon}</div>
            </div>
        </Card>
    </div>

    <!-- Quick Actions -->
    <Card class="min-w-full shadow-md border border-purple-200 bg-gradient-to-br from-purple-50 to-pink-50">
        <div class="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-3">
            <div>
                <h3 class="text-lg md:text-xl font-bold text-purple-900 mb-1 flex items-center gap-2">
                    <span>⚡</span> Quick Actions
                </h3>
                <p class="text-sm text-purple-700">
                    System is <Badge color={channelData.systemStatus === 1 ? 'green' : 'red'} class="ml-1">
                        {channelData.systemStatus === 1 ? 'ACTIVE' : 'INACTIVE'}
                    </Badge>
                </p>
            </div>
            
            <div class="flex gap-2 flex-wrap">
                <Button 
                    color={channelData.systemStatus === 1 ? 'red' : 'green'}
                    size="sm"
                    on:click={toggleSystemStatus}
                    disabled={updating}
                >
                    {updating ? 'Processing...' : channelData.systemStatus === 1 ? '⏸️ Pause' : '▶️ Start'}
                </Button>
                <Button color="blue" size="sm" href="/plants">
                    🌿 Browse Plants
                </Button>
                <Button color="purple" size="sm" href="/analytics">
                    📊 Analytics
                </Button>
            </div>
        </div>
    </Card>

    <!-- Charts Grid -->
    <div class="grid grid-cols-1 xl:grid-cols-2 gap-4 md:gap-5">
        <Soilmoisture moistureLevel={channelData.moistureLevel} feeds={channelData.feeds} />
        <Waterpump pumpStatus={channelData.pumpStatus} feeds={channelData.feeds} />
    </div>

    <!-- Climate Conditions Component (NEW) -->
    <ClimateConditions 
        temperature={channelData.temperature}
        humidity={channelData.humidity}
        feeds={channelData.feeds}
    />

    <!-- Control Cards -->
    <div class="grid grid-cols-1 xl:grid-cols-2 gap-4 md:gap-5">
        <!-- System Control -->
        <Card class="min-w-full shadow-md border border-blue-200 bg-gradient-to-br from-blue-50 to-blue-100">
            <div class="space-y-4">
                <!-- Header Section -->
                <div class="flex items-center justify-between">
                    <div>
                        <h3 class="text-lg md:text-xl font-bold text-blue-900">System Control</h3>
                        <p class="text-sm text-blue-700 mt-1">
                            Current:
                            <Badge color={channelData.systemStatus === 1 ? 'green' : 'red'} class="ml-1">
                                {channelData.systemStatus === 1 ? 'ACTIVE' : 'INACTIVE'}
                            </Badge>
                        </p>
                    </div>
                    <div class="text-3xl">
                        {channelData.systemStatus === 1 ? '✅' : '⏸️'}
                    </div>
                </div>

                <!-- Status and Control Button Section -->
                <div class="p-4 bg-white/80 rounded-lg border border-blue-200">
                    <div class="flex flex-col md:flex-row md:items-center md:justify-between">
                        <p class="text-sm text-gray-700 mb-3 md:mb-0 md:mr-4">
                            {channelData.systemStatus === 1
                                ? 'System is actively monitoring and will water plants automatically when needed.'
                                : 'System is paused. No automatic watering will occur.'}
                        </p>

                        <Button
                            on:click={toggleSystemStatus}
                            color={channelData.systemStatus === 1 ? 'red' : 'green'}
                            disabled={updating}
                            class="font-semibold w-full md:w-auto"
                        >
                            {#if updating}
                                <Spinner size="4" class="mr-2" />
                            {:else if channelData.systemStatus === 1}
                                <svg class="w-5 h-5 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                    <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2"
                                        d="M10 9v6m4-6v6m7-3a9 9 0 11-18 0 9 9 0 0118 0z" />
                                </svg>
                                Pause System
                            {:else}
                                <svg class="w-5 h-5 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                    <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2"
                                        d="M14.752 11.168l-3.197-2.132A1 1 0 0010 9.87v4.263a1 1 0 001.555.832l3.197-2.132a1 1 0 000-1.664z" />
                                    <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2"
                                        d="M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
                                </svg>
                                Start System
                            {/if}
                        </Button>
                    </div>
                </div>
            </div>
        </Card>

        <!-- Threshold Control -->
        <Card class="min-w-full shadow-md border border-red-200 bg-gradient-to-br from-red-50 to-orange-50">
            <div class="space-y-4">
                <!-- Header Section -->
                <div class="flex items-center justify-between">
                    <div>
                        <h3 class="text-lg md:text-xl font-bold text-red-900">Moisture Threshold</h3>
                        <p class="text-sm text-red-700 mt-1">
                            Current:
                            <Badge color="red" class="ml-1">{channelData.threshold}</Badge>
                        </p>
                    </div>
                    <div class="text-3xl">🎯</div>
                </div>

                <!-- Threshold Control Section -->
                <div class="p-4 bg-white/80 rounded-lg border border-red-200 space-y-4">
                    <Label class="space-y-2 w-full">
                        <span class="text-gray-800 font-semibold text-sm">Set Threshold Value</span>
                        <Range
                            id="threshold-range"
                            min="70"
                            max="430"
                            bind:value={localThreshold}
                        />
                    </Label>

                    <!-- Threshold Display + Update Button -->
                    <div class="flex flex-col md:flex-row md:items-center md:justify-between">
                        <!-- Value Info -->
                        <div class="flex items-center justify-between w-full md:w-auto md:space-x-6">
                            <div>
                                <p class="text-xl md:text-2xl font-bold text-gray-900">{localThreshold}</p>
                                <p class="text-xs text-gray-600">
                                    {localThreshold > 300
                                        ? 'Dry trigger'
                                        : localThreshold > 200
                                        ? 'Balanced'
                                        : 'Wet trigger'}
                                </p>
                            </div>
                            <div class="text-xs text-gray-600 text-right md:text-left">
                                <p>Range: 70–430</p>
                                <p class="text-blue-600 font-medium">Higher = Drier</p>
                            </div>
                        </div>

                        <!-- Update Button -->
                        <Button
                            on:click={updateThreshold}
                            color="red"
                            disabled={updating || localThreshold === channelData.threshold}
                            class="font-semibold mt-3 md:mt-0 w-full md:w-auto"
                        >
                            {#if updating}
                                <Spinner size="4" class="mr-2" />
                                Updating...
                            {:else}
                                <svg
                                    class="w-5 h-5 mr-2"
                                    fill="none"
                                    stroke="currentColor"
                                    viewBox="0 0 24 24"
                                >
                                    <path
                                        stroke-linecap="round"
                                        stroke-linejoin="round"
                                        stroke-width="2"
                                        d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15"
                                    />
                                </svg>
                                Update Threshold
                            {/if}
                        </Button>
                    </div>
                </div>
            </div>
        </Card>
    </div>
</div>

<style>
    @keyframes fade-in {
        from {
            opacity: 0;
            transform: translateY(10px);
        }
        to {
            opacity: 1;
            transform: translateY(0);
        }
    }

    .animate-fade-in {
        animation: fade-in 0.4s ease-out;
    }
</style>
