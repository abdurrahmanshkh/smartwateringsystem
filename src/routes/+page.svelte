<script>
    import Soilmoisture from './soilmoisture.svelte';
    import Waterpump from './waterpump.svelte';
    import ClimateConditions from './climate-conditions.svelte';
    import { Alert, Card, Button, Badge, Spinner, Toggle, Range, Label } from 'flowbite-svelte';
    import { InfoCircleSolid, ExclamationCircleSolid, CheckCircleSolid } from 'flowbite-svelte-icons';
    import { onMount } from 'svelte';

    // Sensor calibration (same as Arduino)
    const WET_VALUE = 70;
    const DRY_VALUE = 430;

    // state
    let channelData = {
        moistureLevel: 0,    // raw sensor
        moisturePercent: 0,  // mapped 0-100 where 100 = wet
        pumpStatus: 'OFF',
        systemStatus: 0,
        threshold: 250,
        temperature: 0,
        humidity: 0,
        feeds: [],
        lastUpdate: null
    };

    let currentPlant = null; // selected plant object from settings
    let settings = {};       // full settings object from server

    let updating = false;
    let loading = true;
    let error = '';
    let success = '';
    let localThreshold = 250;
    let connectionStatus = 'disconnected';
    let autoRefresh = true;
    let refreshInterval = 1000; // 1 second for livestreaming

    // Prevent overlapping fetches
    let isFetching = false;

    // Track user editing / manual actions to avoid overwrites during live polling
    let isEditingThreshold = false;
    let lastManualChangeAt = 0; // ms since epoch; used to prevent immediate override

    // derived reactive values
    $: healthScore = calculateHealthScore(channelData.moisturePercent, channelData.systemStatus, currentPlant);
    $: moistureStatus = getMoistureStatus(channelData.moisturePercent);
    $: systemUptime = channelData.feeds.length > 0 ? calculateUptime(channelData.feeds) : '0h 0m';
    $: tempStatus = getTemperatureStatus(channelData.temperature);
    $: humidityStatus = getHumidityStatus(channelData.humidity);

    // helper: map a value between ranges
    function mapRange(value, inMin, inMax, outMin, outMax) {
        if (inMax === inMin) return outMin;
        return (value - inMin) * (outMax - outMin) / (inMax - inMin) + outMin;
    }

    // compute the health score; if we have a plant, compute relative to plant ideal range
    function calculateHealthScore(moisturePercent, status, plant) {
        if (status === 0) return { score: 0, label: 'System Off', color: 'gray' };

        if (plant && Number.isFinite(Number(plant.moisture_min)) && Number.isFinite(Number(plant.moisture_max)) && Number(plant.moisture_max) > Number(plant.moisture_min)) {
            const idealMin = Number(plant.moisture_min);
            const idealMax = Number(plant.moisture_max);

            if (moisturePercent >= idealMin && moisturePercent <= idealMax) {
                return { score: 95, label: 'Excellent (Plant Optimal)', color: 'green' };
            }

            const distance = moisturePercent < idealMin ? (idealMin - moisturePercent) : (moisturePercent - idealMax);
            const penalty = Math.min(80, Math.round(distance * 1.5));
            const score = Math.max(10, 95 - penalty);

            const label = score >= 85 ? 'Good' : score >= 70 ? 'Fair' : 'Poor';
            const color = score >= 85 ? 'green' : score >= 70 ? 'blue' : score >= 50 ? 'yellow' : 'red';
            return { score, label: `${label} (Plant-aware)`, color };
        }

        // fallback: generic scoring using percent
        let score = 100;
        if (moisturePercent < 15) score = 30;
        else if (moisturePercent < 25) score = 60;
        else if (moisturePercent < 40) score = 85;
        else if (moisturePercent < 70) score = 100;
        else if (moisturePercent < 85) score = 75;
        else score = 40;

        const label = score >= 85 ? 'Excellent' : score >= 70 ? 'Good' : score >= 50 ? 'Fair' : 'Poor';
        const color = score >= 85 ? 'green' : score >= 70 ? 'blue' : score >= 50 ? 'yellow' : 'red';
        return { score, label, color };
    }

    function getMoistureStatus(moisturePercent) {
        if (moisturePercent >= 85) return { text: 'Too Wet', color: 'purple', icon: '🟣' };
        if (moisturePercent >= 70) return { text: 'Slightly Wet', color: 'blue', icon: '🔵' };
        if (moisturePercent >= 50) return { text: 'Optimal', color: 'green', icon: '🟢' };
        if (moisturePercent >= 30) return { text: 'Slightly Dry', color: 'yellow', icon: '🟡' };
        if (moisturePercent >= 15) return { text: 'Dry - Needs Water', color: 'orange', icon: '🟠' };
        return { text: 'Critical - Very Dry', color: 'red', icon: '🔴' };
    }

    function getTemperatureStatus(temp) {
        if (!temp) return { text: 'No Data', color: 'gray', icon: '❌' };
        if (temp > 35) return { text: 'Too Hot', color: 'red', icon: '🔥' };
        if (temp > 28) return { text: 'Warm', color: 'orange', icon: '☀️' };
        if (temp >= 18 && temp <= 28) return { text: 'Optimal', color: 'green', icon: '✅' };
        if (temp > 10) return { text: 'Cool', color: 'blue', icon: '❄️' };
        return { text: 'Very Cold', color: 'cyan', icon: '⛸️' };
    }

    function getHumidityStatus(humidity) {
        if (!humidity) return { text: 'No Data', color: 'gray', icon: '❌' };
        if (humidity > 80) return { text: 'Very Humid', color: 'blue', icon: '🌧️' };
        if (humidity > 60) return { text: 'Humid', color: 'cyan', icon: '☁️' };
        if (humidity >= 40 && humidity <= 70) return { text: 'Optimal', color: 'green', icon: '✅' };
        if (humidity > 30) return { text: 'Dry', color: 'orange', icon: '🌤️' };
        return { text: 'Very Dry', color: 'red', icon: '☀️' };
    }

	function calculateUptime(feeds) {
		if (!feeds || feeds.length < 2) return '0h 10m';
		const validFeeds = feeds.filter(f => f.created_at && !isNaN(new Date(f.created_at)));
		if (validFeeds.length < 2) return '0h 10m';
		const timestamps = validFeeds.map(f => new Date(f.created_at).getTime());
		const minTime = Math.min(...timestamps);
		const maxTime = Math.max(...timestamps);
		const diffMs = maxTime - minTime;
		if (diffMs <= 0) return '0h 10m';
		const diffHrs = Math.floor(diffMs / (1000 * 60 * 60));
		const diffMins = Math.floor((diffMs % (1000 * 60 * 60)) / (1000 * 60));
		return `${diffHrs}h ${diffMins}m`;
	}

    // Fetch settings (selected plant, threshold, systemStatus) — less frequent (every 5s)
    async function fetchSettings() {
        try {
            const resp = await fetch('/api/settings', { cache: 'no-store' });
            if (!resp.ok) throw new Error(`Status ${resp.status}`);
            const data = await resp.json();
            settings = data || {};

            // Map settings fields defensively
            if (settings.selectedPlant) currentPlant = settings.selectedPlant;
            else if (settings.plant) currentPlant = settings.plant;
            else currentPlant = null;

            // only override channelData.threshold/localThreshold if user isn't editing and lastManualChange is older than 3s
            const now = Date.now();
            if (settings.threshold !== undefined && !isEditingThreshold && (now - lastManualChangeAt > 3000)) {
                channelData.threshold = Number(settings.threshold);
                localThreshold = channelData.threshold;
            }
            if (settings.systemStatus !== undefined && (now - lastManualChangeAt > 3000)) {
                channelData.systemStatus = Number(settings.systemStatus);
            }
        } catch (err) {
            // don't break livestream if settings fail; just log
            console.warn('Failed to fetch settings:', err);
        }
    }

    onMount(() => {
        // initial loads
        fetchAllData();
        fetchSettings();

        // Polling intervals
        const feedsInterval = setInterval(() => {
            if (autoRefresh) fetchAllData();
        }, refreshInterval);

        const settingsInterval = setInterval(() => {
            // fetch settings less frequently to avoid clobbering user edits
            if (autoRefresh) fetchSettings();
        }, 5000);

        return () => {
            clearInterval(feedsInterval);
            clearInterval(settingsInterval);
        };
    });

    // Main fetch: feeds + integrate settings
    async function fetchAllData() {
        if (isFetching) return;
        isFetching = true;

        const url = `/api/feeds?limit=20`;

        try {
            const response = await fetch(url, { cache: 'no-store' });
            if (!response.ok) throw new Error(`HTTP ${response.status}`);

            const data = await response.json();
            const feedsRaw = Array.isArray(data.feeds) ? data.feeds : [];

            if (feedsRaw.length > 0) {
                // API returns most-recent-first; reverse to oldest->newest for components
                const feeds = [...feedsRaw].reverse();
                const latestFeed = feeds[feeds.length - 1];

                // parse numbers defensively
                const rawMoisture = parseInt(latestFeed.field1) || 0;
                const pump = (latestFeed.field2 === '1' || latestFeed.field2 === 1) ? 'ON' : 'OFF';
                const feedSysStatus = Number.isFinite(Number(latestFeed.field3)) ? parseInt(latestFeed.field3) : channelData.systemStatus;
                const feedThr = (latestFeed.field4 !== undefined && latestFeed.field4 !== null && latestFeed.field4 !== '') ? parseInt(latestFeed.field4) : channelData.threshold;
                const temp = parseInt(latestFeed.field5) || 0;
                const hum = parseInt(latestFeed.field6) || 0;
                const createdAt = latestFeed.created_at ? new Date(latestFeed.created_at) : new Date();

                // map raw sensor to percent (100 = wet, 0 = dry) and clamp
                let sensorPercent = Math.round(mapRange(rawMoisture, WET_VALUE, DRY_VALUE, 100, 0));
                sensorPercent = Math.max(0, Math.min(100, sensorPercent));

                const now = Date.now();

                // Only update threshold/localThreshold if user isn't currently editing and no recent manual change
                if (!isEditingThreshold && (now - lastManualChangeAt > 3000)) {
                    channelData.threshold = feedThr;
                    localThreshold = feedThr;
                }

                // Only update systemStatus from feed if no recent manual toggle
                if (now - lastManualChangeAt > 3000) {
                    channelData.systemStatus = feedSysStatus;
                }

                channelData = {
                    ...channelData,
                    moistureLevel: rawMoisture,
                    moisturePercent: sensorPercent,
                    pumpStatus: pump,
                    temperature: temp,
                    humidity: hum,
                    feeds,
                    lastUpdate: createdAt
                };

                // calculate online/offline using timestamp age (5s threshold)
                const ageSec = (Date.now() - createdAt.getTime()) / 1000;
                connectionStatus = ageSec <= 5 ? 'connected' : 'disconnected';

                error = '';
            } else {
                // no feeds -> mark as disconnected & keep existing data
                connectionStatus = 'disconnected';
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

    // User started editing slider
    function onThresholdInput(e) {
        // e.detail or e.target? Flowbite Range forwards input event and value binding still works via bind:value.
        isEditingThreshold = true;
        lastManualChangeAt = Date.now();
        // localThreshold already bound; ensure it's numeric
        localThreshold = Number(localThreshold);
    }

    // User finished interacting slider (optional)
    function onThresholdChange(e) {
        // keep editing true until user explicitly clicks Update
        lastManualChangeAt = Date.now();
    }

    // Single-shot update to /api/settings (no retries). Include currentPlant when present.
    async function updateSystemSettings() {
        updating = true;
        error = '';
        success = '';

        const url = `/api/settings`;
        const body = {
            systemStatus: channelData.systemStatus,
            threshold: channelData.threshold
        };

        // include plant info if available (so server can persist selectedPlant)
        if (currentPlant) body.plant = currentPlant;

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
            // mark the manual change time so incoming polls don't immediately overwrite
            lastManualChangeAt = Date.now();
            // refresh settings once
            await fetchSettings();
            // refresh feeds quickly to reflect changes
            await fetchAllData();
            setTimeout(() => success = '', 2000);
        } catch (err) {
            console.error('updateSystemSettings error', err);
            error = `Failed to update settings: ${err.message}`;
        } finally {
            updating = false;
        }
    }

    // Apply threshold explicitly (user action)
    async function updateThreshold() {
        // apply local value to channelData for instant feedback
        channelData.threshold = Number(localThreshold);
        // mark editing done (we will allow server to sync after manual change window)
        // but keep isEditingThreshold true until server confirms; set manual timestamp
        lastManualChangeAt = Date.now();

        // send update (includes selected plant if present)
        updating = true;
        error = '';
        success = '';

        const url = `/api/settings`;
        const body = {
            threshold: channelData.threshold
        };
        if (currentPlant) body.plant = currentPlant;

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

            success = `Threshold updated to ${channelData.threshold} ✓`;
            // stop editing after successful save
            isEditingThreshold = false;
            lastManualChangeAt = Date.now();
            // refresh settings and feeds
            await fetchSettings();
            await fetchAllData();
            setTimeout(() => success = '', 2000);
        } catch (err) {
            console.error('updateThreshold error', err);
            error = `Failed to update threshold: ${err.message}`;
        } finally {
            updating = false;
        }
    }

    // Toggle system status (immediate optimistic UI, then server)
    async function toggleSystemStatus() {
        // don't allow toggle if already updating or offline
        if (updating || connectionStatus === 'disconnected') return;

        const newStatus = channelData.systemStatus === 1 ? 0 : 1;
        // optimistic UI
        channelData.systemStatus = newStatus;
        lastManualChangeAt = Date.now();
        updating = true;
        error = '';
        success = '';

        const url = `/api/settings`;
        const body = {
            systemStatus: newStatus
        };
        if (currentPlant) body.plant = currentPlant;

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

            success = newStatus === 1 ? 'System turned ON' : 'System turned OFF';
            lastManualChangeAt = Date.now();
            // refresh settings/feeds once
            await fetchSettings();
            await fetchAllData();
            setTimeout(() => success = '', 2000);
        } catch (err) {
            console.error('toggleSystemStatus error', err);
            // revert optimistic UI on failure
            channelData.systemStatus = newStatus === 1 ? 0 : 1;
            error = `Failed to change system status: ${err.message}`;
        } finally {
            updating = false;
        }
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

            <!-- Current Plant Summary -->
            <div class="mt-3">
                {#if currentPlant}
                    <div class="flex items-center gap-3">
                        <div class="p-2 rounded-md bg-green-50 border border-green-100">
                            <div class="font-semibold text-green-700">{currentPlant.name}</div>
                            <div class="text-xs text-gray-600">{currentPlant.category || 'Custom'}</div>
                        </div>
                        <div class="text-sm text-gray-700">
                            <div>Threshold: <strong>{currentPlant.threshold ?? channelData.threshold}</strong></div>
                            <div>Moisture ideal: <strong>{currentPlant.moisture_min ?? '—'}% - {currentPlant.moisture_max ?? '—'}%</strong></div>
                            <div class="text-xs text-gray-500 mt-1">{currentPlant.description}</div>
                        </div>
                    </div>
                {:else}
                    <div class="text-sm text-gray-600">No plant selected. Choose a plant on the <a class="text-blue-600 underline" href="/plants">Plants</a> page.</div>
                {/if}
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
        <Alert color={connectionStatus === 'connected' ? 'green' : 'yellow'} dismissable class="shadow-sm">
            <CheckCircleSolid slot="icon" class="h-4 w-4" />
            <span class="text-sm">
                {connectionStatus === 'connected' ? 'Live data streaming' : 'Device offline — showing last known data'} — Monitoring {channelData.feeds.length} data points
            </span>
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
                        {moistureStatus.icon} {moistureStatus.text} — {channelData.moisturePercent}% (sensor)
                    </p>
                    {#if currentPlant}
                        <p class="text-xs text-gray-500 mt-1">Plant ideal: {currentPlant.moisture_min ?? '—'}% - {currentPlant.moisture_max ?? '—'}%</p>
                    {/if}
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
                    <p class="text-sm font-bold text-gray-900">{channelData.moisturePercent}%</p>
                </div>
                <div class="text-center p-3 bg-gradient-to-br from-green-50 to-green-100 rounded-lg border border-green-200">
                    <div class="text-xl mb-1">{channelData.pumpStatus === 'ON' ? '🔄' : '⏸️'}</div>
                    <p class="text-xs text-gray-600">Pump</p>
                    <p class="text-sm font-bold text-gray-900">{channelData.pumpStatus}</p>
                </div>
            </div>
        </div>
    </Card>

    <!-- Climate Status Quick View -->
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
                    disabled={updating || connectionStatus === 'disconnected'}
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

    <!-- Climate Conditions Component -->
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
                            on:input={onThresholdInput}
                            on:change={onThresholdChange}
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
                            disabled={updating || Number(localThreshold) === Number(channelData.threshold)}
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
