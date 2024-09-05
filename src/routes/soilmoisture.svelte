<script lang="ts">
	import { Card, Chart } from 'flowbite-svelte';

	let chart: ApexCharts;

	const initialData = [1350, 1375, 1500, 1435, 1335, 1450,];

	let options = {
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
				data: initialData,
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
				<dd class="text-3xl font-bold leading-none text-gray-900 dark:text-white">1405</dd>
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
				<dd class="text-xl font-bold leading-none text-green-500 dark:text-green-400">1450</dd>
			</dl>
			<dl>
				<dt class="pb-1 text-base font-normal text-gray-500 dark:text-gray-400">Wet</dt>
				<dd class="text-xl font-bold leading-none text-yellow-500 dark:text-yellow-400">1650</dd>
			</dl>
			<dl>
				<dt class="pb-1 text-base font-normal text-gray-500 dark:text-gray-400">Dry</dt>
				<dd class="text-xl font-bold leading-none text-red-600 dark:text-red-500">1250</dd>
			</dl>
		</div>
	</div>
	<div class="pt-4">
		<Chart {options} bind:chart />
	</div>
</Card>
