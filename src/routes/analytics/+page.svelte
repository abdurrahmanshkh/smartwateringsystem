<script>
    import { Card, Badge, Spinner, Progressbar } from 'flowbite-svelte';
    import { onMount } from 'svelte';
    
    let loading = true;
    let channelData = { feeds: [] };
    let analytics = {
        totalReadings: 0,
        avgMoisture: 0,
        minMoisture: 0,
        maxMoisture: 0,
        pumpActivations: 0,
        wateringFrequency: 0,
        moistureTrend: 'stable',
        // NEW: Temperature and Humidity
        avgTemp: 0,
        minTemp: 0,
        maxTemp: 0,
        tempTrend: 'stable',
        avgHumidity: 0,
        minHumidity: 0,
        maxHumidity: 0,
        humidityTrend: 'stable'
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

        // Existing moisture analysis
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

        // NEW: Temperature analysis
        const tempValues = feeds.map(f => parseInt(f.field5) || 0).filter(v => v > 0);
        if (tempValues.length > 0) {
            analytics.avgTemp = Math.round(tempValues.reduce((a, b) => a + b, 0) / tempValues.length);
            analytics.minTemp = Math.min(...tempValues);
            analytics.maxTemp = Math.max(...tempValues);
            
            const recentTemp = tempValues.slice(-10).reduce((a, b) => a + b, 0) / Math.min(10, tempValues.length);
            const olderTemp = tempValues.slice(0, 10).reduce((a, b) => a + b, 0) / Math.min(10, tempValues.length);
            
            if (recentTemp > olderTemp + 2) analytics.tempTrend = 'warming';
            else if (recentTemp < olderTemp - 2) analytics.tempTrend = 'cooling';
            else analytics.tempTrend = 'stable';
        }

        // NEW: Humidity analysis
        const humidityValues = feeds.map(f => parseInt(f.field6) || 0).filter(v => v > 0);
        if (humidityValues.length > 0) {
            analytics.avgHumidity = Math.round(humidityValues.reduce((a, b) => a + b, 0) / humidityValues.length);
            analytics.minHumidity = Math.min(...humidityValues);
            analytics.maxHumidity = Math.max(...humidityValues);
            
            const recentHumidity = humidityValues.slice(-10).reduce((a, b) => a + b, 0) / Math.min(10, humidityValues.length);
            const olderHumidity = humidityValues.slice(0, 10).reduce((a, b) => a + b, 0) / Math.min(10, humidityValues.length);
            
            if (recentHumidity > olderHumidity + 10) analytics.humidityTrend = 'wetting';
            else if (recentHumidity < olderHumidity - 10) analytics.humidityTrend = 'drying';
            else analytics.humidityTrend = 'stable';
        }
    }
</script>

<svelte:head>
    <title>Analytics - Smart Plant Watering System</title>
</svelte:head>

<div class="space-y-4 md:space-y-5">
    <div>
        <h1 class="text-2xl md:text-3xl lg:text-4xl font-bold bg-gradient-to-r from-green-600 to-teal-600 bg-clip-text text-transparent flex items-center gap-2">
            📊 System Analytics
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
        <!-- Key Metrics Grid (Enhanced with Temperature & Humidity) -->
        <div class="grid grid-cols-2 lg:grid-cols-6 gap-3 md:gap-4">
            <!-- Existing Metrics -->
            <Card class="min-w-full shadow-md border border-blue-200 bg-gradient-to-br from-blue-50 to-blue-100">
                <div class="text-center">
                    <div class="text-2xl mb-2">📈</div>
                    <p class="text-xs text-gray-600 mb-1">Total Readings</p>
                    <p class="text-xl md:text-2xl font-bold text-blue-900">{analytics.totalReadings}</p>
                </div>
            </Card>

            <Card class="min-w-full shadow-md border border-green-200 bg-gradient-to-br from-green-50 to-green-100">
                <div class="text-center">
                    <div class="text-2xl mb-2">💧</div>
                    <p class="text-xs text-gray-600 mb-1">Avg Moisture</p>
                    <p class="text-xl md:text-2xl font-bold text-green-900">{analytics.avgMoisture}</p>
                </div>
            </Card>

            <Card class="min-w-full shadow-md border border-purple-200 bg-gradient-to-br from-purple-50 to-purple-100">
                <div class="text-center">
                    <div class="text-2xl mb-2">🔄</div>
                    <p class="text-xs text-gray-600 mb-1">Pump Cycles</p>
                    <p class="text-xl md:text-2xl font-bold text-purple-900">{analytics.pumpActivations}</p>
                </div>
            </Card>

            <!-- NEW: Temperature -->
            <Card class="min-w-full shadow-md border border-orange-200 bg-gradient-to-br from-orange-50 to-orange-100">
                <div class="text-center">
                    <div class="text-2xl mb-2">🌡️</div>
                    <p class="text-xs text-gray-600 mb-1">Avg Temp</p>
                    <p class="text-xl md:text-2xl font-bold text-orange-900">{analytics.avgTemp}°C</p>
                </div>
            </Card>

            <!-- NEW: Humidity -->
            <Card class="min-w-full shadow-md border border-cyan-200 bg-gradient-to-br from-cyan-50 to-cyan-100">
                <div class="text-center">
                    <div class="text-2xl mb-2">💧</div>
                    <p class="text-xs text-gray-600 mb-1">Avg Humidity</p>
                    <p class="text-xl md:text-2xl font-bold text-cyan-900">{analytics.avgHumidity}%</p>
                </div>
            </Card>

            <!-- Watering Frequency -->
            <Card class="min-w-full shadow-md border border-amber-200 bg-gradient-to-br from-amber-50 to-amber-100">
                <div class="text-center">
                    <div class="text-2xl mb-2">⚡</div>
                    <p class="text-xs text-gray-600 mb-1">Frequency</p>
                    <p class="text-xl md:text-2xl font-bold text-amber-900">{analytics.wateringFrequency}%</p>
                </div>
            </Card>
        </div>

        <!-- Detailed Statistics -->
        <Card class="min-w-full shadow-md border border-gray-200">
            <h2 class="text-xl md:text-2xl font-bold text-gray-900 mb-4">Detailed Statistics</h2>
            
            <div class="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3">
                <!-- Moisture -->
                <div class="p-3 bg-green-50 rounded-lg border border-green-200">
                    <p class="text-sm text-gray-600 mb-1.5">Moisture Range</p>
                    <p class="text-lg font-bold text-gray-900">{analytics.minMoisture} - {analytics.maxMoisture}</p>
                    <Badge color="green" class="text-xs mt-2">
                        {analytics.moistureTrend === 'stable' ? '➡️ Stable' : 
                         analytics.moistureTrend === 'drying' ? '📈 Drying' : '📉 Wetting'}
                    </Badge>
                </div>

                <!-- Temperature (NEW) -->
                <div class="p-3 bg-orange-50 rounded-lg border border-orange-200">
                    <p class="text-sm text-gray-600 mb-1.5">Temperature Range</p>
                    <p class="text-lg font-bold text-gray-900">{analytics.minTemp}°C - {analytics.maxTemp}°C</p>
                    <Badge color="orange" class="text-xs mt-2">
                        {analytics.tempTrend === 'stable' ? '➡️ Stable' : 
                         analytics.tempTrend === 'warming' ? '📈 Warming' : '📉 Cooling'}
                    </Badge>
                </div>

                <!-- Humidity (NEW) -->
                <div class="p-3 bg-cyan-50 rounded-lg border border-cyan-200">
                    <p class="text-sm text-gray-600 mb-1.5">Humidity Range</p>
                    <p class="text-lg font-bold text-gray-900">{analytics.minHumidity}% - {analytics.maxHumidity}%</p>
                    <Badge color="cyan" class="text-xs mt-2">
                        {analytics.humidityTrend === 'stable' ? '➡️ Stable' : 
                         analytics.humidityTrend === 'wetting' ? '📈 Wetting' : '📉 Drying'}
                    </Badge>
                </div>
            </div>
        </Card>

        <!-- Environmental Recommendations (NEW) -->
        <Card class="min-w-full shadow-md border border-cyan-300 bg-gradient-to-br from-cyan-50 to-blue-50">
            <h2 class="text-xl md:text-2xl font-bold text-gray-900 mb-4 flex items-center gap-2">
                💡 Environmental Recommendations
            </h2>
            <div class="space-y-2.5">
                {#if analytics.avgTemp > 35}
                    <div class="p-3 bg-white rounded-lg border-l-4 border-red-500">
                        <p class="font-semibold text-red-900 text-sm mb-1">🌡️ Temperature Alert</p>
                        <p class="text-xs text-gray-700">Temperature is very high (avg {analytics.avgTemp}°C). Increase ventilation and provide shade.</p>
                    </div>
                {/if}

                {#if analytics.avgTemp < 5}
                    <div class="p-3 bg-white rounded-lg border-l-4 border-blue-500">
                        <p class="font-semibold text-blue-900 text-sm mb-1">❄️ Cold Alert</p>
                        <p class="text-xs text-gray-700">Temperature is very low (avg {analytics.avgTemp}°C). Consider adding heating.</p>
                    </div>
                {/if}

                {#if analytics.avgHumidity > 85}
                    <div class="p-3 bg-white rounded-lg border-l-4 border-orange-500">
                        <p class="font-semibold text-orange-900 text-sm mb-1">💧 High Humidity</p>
                        <p class="text-xs text-gray-700">Humidity is very high ({analytics.avgHumidity}%). Increase air circulation to prevent mold.</p>
                    </div>
                {/if}

                {#if analytics.avgHumidity < 30}
                    <div class="p-3 bg-white rounded-lg border-l-4 border-amber-500">
                        <p class="font-semibold text-amber-900 text-sm mb-1">🌵 Dry Air</p>
                        <p class="text-xs text-gray-700">Humidity is very low ({analytics.avgHumidity}%). Consider misting or using a humidifier.</p>
                    </div>
                {/if}

                {#if analytics.wateringFrequency > 50}
                    <div class="p-3 bg-white rounded-lg border-l-4 border-purple-500">
                        <p class="font-semibold text-purple-900 text-sm mb-1">🔄 Frequent Watering</p>
                        <p class="text-xs text-gray-700">Pump running frequently ({analytics.wateringFrequency}%). Check for leaks or adjust threshold.</p>
                    </div>
                {/if}

                {#if analytics.avgTemp >= 15 && analytics.avgTemp <= 30 && analytics.avgHumidity >= 40 && analytics.avgHumidity <= 70}
                    <div class="p-3 bg-white rounded-lg border-l-4 border-green-500">
                        <p class="font-semibold text-green-900 text-sm mb-1">✅ Optimal Conditions</p>
                        <p class="text-xs text-gray-700">Environmental conditions are perfect! Temperature and humidity are in optimal ranges.</p>
                    </div>
                {/if}
            </div>
        </Card>

        <!-- System Efficiency -->
        <Card class="min-w-full shadow-md border border-gray-200">
            <h2 class="text-xl md:text-2xl font-bold text-gray-900 mb-4">System Efficiency</h2>
            <div class="space-y-3">
                <div>
                    <div class="flex justify-between mb-1">
                        <span class="text-sm font-medium text-gray-700">Watering Efficiency</span>
                        <span class="text-sm font-bold text-green-600">{analytics.wateringFrequency < 30 ? 'Excellent' : analytics.wateringFrequency < 50 ? 'Good' : 'Moderate'}</span>
                    </div>
                    <Progressbar progress={Math.min(100, analytics.wateringFrequency * 2)} />
                </div>
                
                <div>
                    <div class="flex justify-between mb-1">
                        <span class="text-sm font-medium text-gray-700">Climate Stability</span>
                        <span class="text-sm font-bold text-blue-600">
                            {analytics.tempTrend === 'stable' && analytics.humidityTrend === 'stable' ? 'Excellent' : 'Good'}
                        </span>
                    </div>
                    <Progressbar progress={analytics.tempTrend === 'stable' && analytics.humidityTrend === 'stable' ? 100 : 75} />
                </div>
            </div>
        </Card>
    {/if}
</div>
