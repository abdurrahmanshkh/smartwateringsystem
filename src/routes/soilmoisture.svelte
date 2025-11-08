<script lang="ts">
    import { Card, Chart } from 'flowbite-svelte';

    export let moistureLevel = 0;
    export let feeds = []; // Receive feeds from parent
    
    let chart: ApexCharts;

    // Updated calibration for new sensor: 70 (Wet) to 430 (Dry)
    $: currentStatus = moistureLevel > 300 ? 'Dry' : moistureLevel > 150 ? 'Optimal' : 'Wet';
    
    // Extract moisture values from feeds for the chart
    $: moistureValues = feeds.map(feed => parseInt(feed.field1) || 0);

    $: options = {
        chart: {
            height: '400px',
            maxWidth: '100%',
            type: 'area',
            fontFamily: 'Inter, sans-serif',
            dropShadow: {
                enabled: false
            },
            toolbar: {
                show: false
            }
        },
        tooltip: {
            enabled: true,
            x: {
                show: false
            }
        },
        fill: {
            type: 'gradient',
            gradient: {
                opacityFrom: 0.55,
                opacityTo: 0
            }
        },
        dataLabels: {
            enabled: false
        },
        stroke: {
            curve: 'smooth'
        },
        xaxis: {
            categories: Array.from({length: feeds.length}, (_, i) => (i + 1).toString()),
            labels: {
                style: {
                    colors: '#6B7280'
                }
            }
        },
        yaxis: {
            min: 50,
            max: 450,
            labels: {
                style: {
                    colors: '#6B7280'
                }
            }
        },
        series: [
            {
                name: 'Moisture Level',
                data: moistureValues,
                color: '#1A56DB'
            }
        ]
    };
</script>

<Card class="max-w-full border-primary-300 bg-primary-200">
    <div class="border-b border-primary-400 pb-4 text-xl font-semibold text-primary-900">
        Soil Moisture Levels
    </div>
    <div>
        <div class="flex justify-between border-b border-primary-400 py-4 dark:border-gray-700">
            <dl>
                <dt class="pb-1 text-base font-normal text-gray-500 dark:text-gray-400">Current</dt>
                <dd class="text-3xl font-bold leading-none text-gray-900 dark:text-white">
                    {moistureLevel}
                </dd>
            </dl>
            <div>
                {#if currentStatus === 'Optimal'}
                    <span class="inline-flex items-center rounded-md bg-green-100 px-2.5 py-1 text-xs font-medium text-green-800 dark:bg-green-900 dark:text-green-300">
                        Optimal
                    </span>
                {:else if currentStatus === 'Wet'}
                    <span class="inline-flex items-center rounded-md bg-blue-100 px-2.5 py-1 text-xs font-medium text-blue-800 dark:bg-blue-900 dark:text-blue-300">
                        Wet
                    </span>
                {:else}
                    <span class="inline-flex items-center rounded-md bg-red-100 px-2.5 py-1 text-xs font-medium text-red-800 dark:bg-red-900 dark:text-red-300">
                        Dry
                    </span>
                {/if}
            </div>
        </div>
        <div class="grid grid-cols-3 border-b border-primary-400 py-4">
            <dl>
                <dt class="pb-1 text-base font-normal text-gray-500 dark:text-gray-400">Wet</dt>
                <dd class="text-xl font-bold leading-none text-blue-500 dark:text-blue-400">{"<150"}</dd>
            </dl>
            <dl>
                <dt class="pb-1 text-base font-normal text-gray-500 dark:text-gray-400">Optimal</dt>
                <dd class="text-xl font-bold leading-none text-green-500 dark:text-green-400">150-300</dd>
            </dl>
            <dl>
                <dt class="pb-1 text-base font-normal text-gray-500 dark:text-gray-400">Dry</dt>
                <dd class="text-xl font-bold leading-none text-red-600 dark:text-red-500">{">300"}</dd>
            </dl>
        </div>
    </div>
    <div class="pt-4">
        <Chart {options} bind:chart />
    </div>
</Card>
