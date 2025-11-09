<script lang="ts">
    import { Card, Chart, Badge, Progressbar } from 'flowbite-svelte';
    import { ArrowUpOutline, ArrowDownOutline } from 'flowbite-svelte-icons';

    export let temperature = 0;
    export let humidity = 0;
    export let feeds = [];

    let tempStatus = 'Normal';
    let humidityStatus = 'Normal';

    $: {
        // Temperature status assessment
        if (temperature < 10) {
            tempStatus = 'Cold';
        } else if (temperature > 35) {
            tempStatus = 'Hot';
        } else {
            tempStatus = 'Normal';
        }

        // Humidity status assessment
        if (humidity < 30) {
            humidityStatus = 'Dry';
        } else if (humidity > 80) {
            humidityStatus = 'Humid';
        } else {
            humidityStatus = 'Normal';
        }
    }

    $: tempTrend = feeds.length > 5 ? 
        feeds[feeds.length - 1]?.field5 > feeds[feeds.length - 5]?.field5 ? 'rising' : 'falling' 
        : 'stable';

    $: humidityTrend = feeds.length > 5 ? 
        feeds[feeds.length - 1]?.field6 > feeds[feeds.length - 5]?.field6 ? 'rising' : 'falling' 
        : 'stable';

    $: tempValues = feeds.map(feed => feed.field5 || '0');
    $: humidityValues = feeds.map(feed => feed.field6 || '0');
    $: timestamps = feeds.map(feed => new Date(feed.created_at).toLocaleTimeString('en-US', { hour: '2-digit', minute: '2-digit' }));

    $: tempOptions = {
        series: [
            {
                name: 'Temperature (°C)',
                color: '#F97316',
                data: tempValues.map(val => parseInt(val))
            }
        ],
        chart: {
            sparkline: { enabled: false },
            type: 'line',
            width: '100%',
            height: 280,
            toolbar: {
                show: true,
                tools: {
                    download: true,
                    selection: false,
                    zoom: false,
                    zoomin: false,
                    zoomout: false,
                    pan: false,
                    reset: false
                }
            }
        },
        stroke: {
            curve: 'smooth',
            width: 3,
            colors: ['#F97316']
        },
        grid: {
            show: true,
            strokeDashArray: 3,
            borderColor: '#E5E7EB'
        },
        markers: {
            size: 4,
            colors: ['#F97316'],
            strokeColors: '#fff',
            strokeWidth: 2
        },
        xaxis: {
            labels: {
                show: true,
                style: {
                    fontFamily: 'Inter, sans-serif',
                    cssClass: 'text-xs font-normal fill-gray-500'
                }
            },
            categories: timestamps
        },
        yaxis: {
            title: { text: 'Temperature (°C)' }
        },
        tooltip: {
            theme: 'light'
        }
    };

    $: humidityOptions = {
        series: [
            {
                name: 'Humidity (%)',
                color: '#06B6D4',
                data: humidityValues.map(val => parseInt(val))
            }
        ],
        chart: {
            sparkline: { enabled: false },
            type: 'area',
            width: '100%',
            height: 280,
            toolbar: {
                show: true,
                tools: {
                    download: true,
                    selection: false,
                    zoom: false,
                    zoomin: false,
                    zoomout: false,
                    pan: false,
                    reset: false
                }
            }
        },
        stroke: {
            curve: 'smooth',
            width: 2,
            colors: ['#06B6D4']
        },
        fill: {
            colors: ['#06B6D4'],
            opacity: 0.1
        },
        grid: {
            show: true,
            strokeDashArray: 3,
            borderColor: '#E5E7EB'
        },
        xaxis: {
            labels: {
                show: true,
                style: {
                    fontFamily: 'Inter, sans-serif',
                    cssClass: 'text-xs font-normal fill-gray-500'
                }
            },
            categories: timestamps
        },
        yaxis: {
            title: { text: 'Humidity (%)' },
            min: 0,
            max: 100
        },
        tooltip: {
            theme: 'light'
        }
    };
</script>

<div class="grid grid-cols-1 lg:grid-cols-2 gap-4">
    <!-- Temperature Card -->
    <Card class="min-w-full shadow-lg border border-orange-200 bg-gradient-to-br from-white to-orange-50/30">
        <div class="space-y-4">
            <!-- Header -->
            <div class="flex justify-between items-center pb-3 border-b border-orange-200">
                <h2 class="text-lg md:text-xl font-bold text-orange-900 flex items-center gap-2">
                    <span>🌡️</span> Temperature
                </h2>
                <Badge 
                    color={tempStatus === 'Normal' ? 'blue' : tempStatus === 'Hot' ? 'red' : 'cyan'}
                >
                    {tempStatus}
                </Badge>
            </div>

            <!-- Current Temperature -->
            <div class="flex justify-between items-center p-4 bg-gradient-to-r from-orange-100 to-orange-50 rounded-lg border border-orange-200">
                <div>
                    <p class="text-xs font-medium text-gray-600 mb-1">Current Temperature</p>
                    <p class="text-4xl font-bold text-orange-600">{temperature}°C</p>
                    <p class="text-xs text-gray-600 mt-1">
                        {temperature > 35 ? 'Warm conditions' : temperature < 10 ? 'Cold conditions' : 'Optimal range'}
                    </p>
                </div>
                <div class="text-6xl">
                    {temperature > 28 ? '🔥' : temperature > 15 ? '☀️' : '❄️'}
                </div>
            </div>

            <!-- Trend -->
            <div class="flex items-center gap-2 p-3 bg-blue-50 rounded-lg border border-blue-200">
                <div>
                    {#if tempTrend === 'rising'}
                        <ArrowUpOutline class="w-5 h-5 text-orange-600" />
                    {:else if tempTrend === 'falling'}
                        <ArrowDownOutline class="w-5 h-5 text-blue-600" />
                    {:else}
                        <span class="text-lg">➡️</span>
                    {/if}
                </div>
                <p class="text-sm font-medium text-gray-700">
                    {tempTrend === 'rising' ? 'Temperature Rising' : tempTrend === 'falling' ? 'Temperature Falling' : 'Temperature Stable'}
                </p>
            </div>

            <!-- Chart -->
            <div>
                <h3 class="text-sm font-semibold text-gray-800 mb-2">Temperature Trend</h3>
                <div class="bg-white p-3 rounded-lg border border-gray-200">
                    <Chart options={tempOptions} />
                </div>
            </div>
        </div>
    </Card>

    <!-- Humidity Card -->
    <Card class="min-w-full shadow-lg border border-cyan-200 bg-gradient-to-br from-white to-cyan-50/30">
        <div class="space-y-4">
            <!-- Header -->
            <div class="flex justify-between items-center pb-3 border-b border-cyan-200">
                <h2 class="text-lg md:text-xl font-bold text-cyan-900 flex items-center gap-2">
                    <span>💧</span> Humidity
                </h2>
                <Badge 
                    color={humidityStatus === 'Normal' ? 'green' : humidityStatus === 'Dry' ? 'warning' : 'info'}
                >
                    {humidityStatus}
                </Badge>
            </div>

            <!-- Current Humidity -->
            <div class="flex justify-between items-center p-4 bg-gradient-to-r from-cyan-100 to-cyan-50 rounded-lg border border-cyan-200">
                <div>
                    <p class="text-xs font-medium text-gray-600 mb-1">Current Humidity</p>
                    <p class="text-4xl font-bold text-cyan-600">{humidity}%</p>
                    <p class="text-xs text-gray-600 mt-1">
                        {humidity > 80 ? 'Very humid' : humidity > 60 ? 'Humid' : humidity > 40 ? 'Moderate' : 'Dry'}
                    </p>
                </div>
                <div class="text-6xl">
                    {humidity > 70 ? '🌧️' : humidity > 50 ? '☁️' : '☀️'}
                </div>
            </div>

            <!-- Humidity Progress -->
            <div class="space-y-2">
                <div class="flex justify-between text-xs">
                    <span class="font-medium text-gray-700">Humidity Level</span>
                    <span class="text-cyan-600 font-bold">{humidity}% / 100%</span>
                </div>
                <Progressbar progress={humidity} size="lg" color="cyan" />
            </div>

            <!-- Trend -->
            <div class="flex items-center gap-2 p-3 bg-green-50 rounded-lg border border-green-200">
                <div>
                    {#if humidityTrend === 'rising'}
                        <ArrowUpOutline class="w-5 h-5 text-cyan-600" />
                    {:else if humidityTrend === 'falling'}
                        <ArrowDownOutline class="w-5 h-5 text-blue-600" />
                    {:else}
                        <span class="text-lg">➡️</span>
                    {/if}
                </div>
                <p class="text-sm font-medium text-gray-700">
                    {humidityTrend === 'rising' ? 'Humidity Rising' : humidityTrend === 'falling' ? 'Humidity Falling' : 'Humidity Stable'}
                </p>
            </div>

            <!-- Chart -->
            <div>
                <h3 class="text-sm font-semibold text-gray-800 mb-2">Humidity Trend</h3>
                <div class="bg-white p-3 rounded-lg border border-gray-200">
                    <Chart options={humidityOptions} />
                </div>
            </div>
        </div>
    </Card>
</div>

<style>
    :global(.apexcharts-toolbar) {
        padding: 8px 0;
    }
</style>