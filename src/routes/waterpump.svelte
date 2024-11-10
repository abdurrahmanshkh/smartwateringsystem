<script lang="ts">
	import { Card, Chart } from 'flowbite-svelte';
	import { onMount } from 'svelte';

	let pumpValues = [];

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

			pumpValues = feeds.map((feed) => feed.field2);
		} catch (error) {
			console.error('Error fetching recent data:', error);
		}
	}

	$: options = {
		series: [
			{
				name: 'Triggered',
				color: '#31C48D',
				data: pumpValues
			}
		],
		chart: {
			sparkline: {
				enabled: false
			},
			type: 'bar',
			width: '100%',
			height: 400,
			toolbar: {
				show: false
			}
		},
		fill: {
			opacity: 1
		},
		plotOptions: {
			bar: {
				horizontal: true,
				columnWidth: '100%',
				borderRadiusApplication: 'end',
				borderRadius: 6,
				dataLabels: {
					position: 'top'
				}
			}
		},
		legend: {
			show: true,
			position: 'bottom'
		},
		dataLabels: {
			enabled: false
		},
		tooltip: {
			shared: true,
			intersect: false,
			formatter: function (value) {
				return value;
			}
		},
		xaxis: {
			labels: {
				show: true,
				style: {
					fontFamily: 'Inter, sans-serif',
					cssClass: 'text-xs font-normal fill-gray-500 dark:fill-gray-400'
				},
				formatter: function (value) {
					if (value === 1) {
						return 'ON';
					} else if (value === 0) {
						return 'OFF';
					}
				}
			},
			categories: [1, 2, 3, 4, 5, 6, 7, 8, 9, 10],
			axisTicks: {
				show: false
			},
			axisBorder: {
				show: false
			}
		},
		yaxis: {
			labels: {
				show: true,
				style: {
					fontFamily: 'Inter, sans-serif',
					cssClass: 'text-xs font-normal fill-gray-500 dark:fill-gray-400'
				}
			}
		},
		grid: {
			show: true,
			strokeDashArray: 4,
			padding: {
				left: 2,
				right: 2,
				top: -20
			}
		}
	};
</script>

<Card class="mt-2 max-w-full border-amber-100 bg-amber-50 md:m-0">
	<span class="border-b border-amber-400 pb-4 font-semibold text-amber-900 md:text-xl">
		Water Pump Status
	</span>
	<div>
		<div class="flex justify-between border-b border-amber-400 py-4 dark:border-gray-700">
			<dl>
				<dt class="pb-1 text-base font-normal text-gray-500 dark:text-gray-400">Status</dt>
				<dd class="text-3xl font-bold leading-none text-gray-900 dark:text-white">
					{pumpValues[0] === '1' ? 'ON' : 'OFF'}
				</dd>
			</dl>
			<div>
				<span
					class="inline-flex items-center rounded-md bg-green-100 px-2.5 py-1 text-xs font-medium text-green-800 dark:bg-green-900 dark:text-green-300"
				>
					Working
				</span>
			</div>
		</div>
		<div class="grid grid-cols-3 border-b border-amber-400 py-4">
			<dl>
				<dt class="pb-1 text-base font-normal text-gray-500 dark:text-gray-400">On</dt>
				<dd class="text-xl font-bold leading-none text-green-500 dark:text-green-400">
					{pumpValues.filter((value) => value === '1').length} Times
				</dd>
			</dl>
			<dl>
				<dt class="pb-1 text-base font-normal text-gray-500 dark:text-gray-400">Off</dt>
				<dd class="text-xl font-bold leading-none text-yellow-500 dark:text-yellow-400">
					{pumpValues.filter((value) => value === '0').length} Times
				</dd>
			</dl>
			<dl>
				<dt class="pb-1 text-base font-normal text-gray-500 dark:text-gray-400">Average</dt>
				<dd class="text-xl font-bold leading-none text-red-600 dark:text-red-500">2 Times</dd>
			</dl>
		</div>
	</div>

	<div class="max-w-full pt-4">
		<Chart {options} />
	</div>
</Card>
