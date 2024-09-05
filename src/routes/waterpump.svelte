<script lang="ts">
	import { Card, Chart} from 'flowbite-svelte';

	const options = {
		series: [
			{
				name: 'Triggered',
				color: '#31C48D',
				data: ['5', '7', '6', '4', '5', '3','6']
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
					return value;
				}
			},
			categories: ['Mon', 'Tue', 'Wed', 'Thurs', 'Fri', 'Sat', 'Sun'],
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

<Card class="max-w-full border-amber-100 bg-amber-50 md:m-0 mt-2">
	<span class="border-b border-amber-400 pb-4 md:text-xl font-semibold text-amber-900">
		Water Pump Status
	</span>
	<div>
		<div class="flex justify-between border-b border-amber-400 py-4 dark:border-gray-700">
			<dl>
				<dt class="pb-1 text-base font-normal text-gray-500 dark:text-gray-400">Status</dt>
				<dd class="text-3xl font-bold leading-none text-gray-900 dark:text-white">OFF</dd>
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
				<dt class="pb-1 text-base font-normal text-gray-500 dark:text-gray-400">Average</dt>
				<dd class="text-xl font-bold leading-none text-green-500 dark:text-green-400">5</dd>
			</dl>
			<dl>
				<dt class="pb-1 text-base font-normal text-gray-500 dark:text-gray-400">Maximum</dt>
				<dd class="text-xl font-bold leading-none text-yellow-500 dark:text-yellow-400">7</dd>
			</dl>
			<dl>
				<dt class="pb-1 text-base font-normal text-gray-500 dark:text-gray-400">Minimum</dt>
				<dd class="text-xl font-bold leading-none text-red-600 dark:text-red-500">3</dd>
			</dl>
		</div>
	</div>

	<div class="pt-4 max-w-full">
		<Chart {options}/>
	</div>
</Card>
