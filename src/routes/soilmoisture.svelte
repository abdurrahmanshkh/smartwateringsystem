<script lang="ts">
	import { Card, Chart } from 'flowbite-svelte';
	import { onMount } from 'svelte';

	let chart: ApexCharts;

	let moistureValues = [];

	//call function on mount
	onMount(() => {
		fetchRecentData();
	});

	// Function to fetch the 10 most recent values for graphs
	async function fetchRecentData() {
		const url = 'https://api.thingspeak.com/channels/2736648/feeds.json?results=10';
		try {
			const response = await fetch(url);
			const data = await response.json();
			const feeds = data.feeds;

			moistureValues = feeds.map((feed) => feed.field1);
		} catch (error) {
			console.error('Error fetching recent data:', error);
		}
	}

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
					{moistureValues[9]}
				</dd>
			</dl>
			<div>
				<span
					class="inline-flex items-center rounded-md bg-green-100 px-2.5 py-1 text-xs font-medium text-green-800 dark:bg-green-900 dark:text-green-300"
				>
					Optimal
				</span>
			</div>
		</div>
		<div class="grid grid-cols-3 border-b border-primary-400 py-4">
			<dl>
				<dt class="pb-1 text-base font-normal text-gray-500 dark:text-gray-400">Optimal</dt>
				<dd class="text-xl font-bold leading-none text-green-500 dark:text-green-400">800</dd>
			</dl>
			<dl>
				<dt class="pb-1 text-base font-normal text-gray-500 dark:text-gray-400">Wet</dt>
				<dd class="text-xl font-bold leading-none text-yellow-500 dark:text-yellow-400">600</dd>
			</dl>
			<dl>
				<dt class="pb-1 text-base font-normal text-gray-500 dark:text-gray-400">Dry</dt>
				<dd class="text-xl font-bold leading-none text-red-600 dark:text-red-500">1000</dd>
			</dl>
		</div>
	</div>
	<div class="pt-4">
		<Chart {options} bind:chart />
	</div>
</Card>
