<script lang="ts">
	import { Card, Chart, Badge } from 'flowbite-svelte';

	export let moistureLevel = 0;
	export let feeds = [];
	
	let chart: ApexCharts;

	$: currentStatus = getMoistureStatus(moistureLevel);
	$: moistureValues = feeds.map(feed => parseInt(feed.field1) || 0);
	$: moisturePercentage = Math.round(((430 - moistureLevel) / (430 - 70)) * 100);
	$: timestamps = feeds.map(feed => new Date(feed.created_at).toLocaleTimeString('en-US', { hour: '2-digit', minute: '2-digit' }));

	function getMoistureStatus(moisture) {
		if (moisture > 350) return { text: 'Critical - Very Dry', color: 'red' };
		if (moisture > 300) return { text: 'Dry', color: 'orange' };
		if (moisture > 250) return { text: 'Slightly Dry', color: 'yellow' };
		if (moisture > 150) return { text: 'Optimal', color: 'green' };
		if (moisture > 100) return { text: 'Slightly Wet', color: 'blue' };
		return { text: 'Too Wet', color: 'purple' };
	}

	$: options = {
		chart: {
			height: '400px',
			maxWidth: '100%',
			type: 'area',
			fontFamily: 'Inter, sans-serif',
			dropShadow: {
				enabled: true,
				top: 3,
				left: 0,
				blur: 4,
				opacity: 0.1
			},
			toolbar: {
				show: true,
				tools: {
					download: true,
					selection: true,
					zoom: true,
					zoomin: true,
					zoomout: true,
					pan: true,
					reset: true
				}
			},
			animations: {
				enabled: true,
				easing: 'easeinout',
				speed: 800
			}
		},
		tooltip: {
			enabled: true,
			x: {
				show: true
			},
			y: {
				formatter: function(value) {
					return `${value} (${Math.round(((430 - value) / 360) * 100)}%)`;
				}
			}
		},
		fill: {
			type: 'gradient',
			gradient: {
				opacityFrom: 0.7,
				opacityTo: 0.2,
				stops: [0, 90, 100]
			}
		},
		dataLabels: {
			enabled: false
		},
		stroke: {
			curve: 'smooth',
			width: 3
		},
		xaxis: {
			categories: timestamps,
			labels: {
				style: {
					colors: '#6B7280',
					fontSize: '12px'
				},
				rotate: -45,
				rotateAlways: false
			},
			title: {
				text: 'Time',
				style: {
					fontSize: '14px',
					fontWeight: 600
				}
			}
		},
		yaxis: {
			min: 50,
			max: 450,
			labels: {
				style: {
					colors: '#6B7280',
					fontSize: '12px'
				},
				formatter: function(value) {
					return Math.round(value);
				}
			},
			title: {
				text: 'Moisture Level (Raw)',
				style: {
					fontSize: '14px',
					fontWeight: 600
				}
			}
		},
		grid: {
			borderColor: '#E5E7EB',
			strokeDashArray: 4
		},
		annotations: {
			yaxis: [
				{
					y: 350,
					borderColor: '#EF4444',
					label: {
						text: 'Critical Dry',
						style: {
							color: '#fff',
							background: '#EF4444'
						}
					}
				},
				{
					y: 150,
					borderColor: '#10B981',
					label: {
						text: 'Optimal Zone',
						style: {
							color: '#fff',
							background: '#10B981'
						}
					}
				}
			]
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

<Card class="shadow-xl border-2 border-primary-300 bg-gradient-to-br from-white to-primary-50">
	<div class="border-b-2 border-primary-400 pb-4 mb-4">
		<div class="flex justify-between items-center">
			<h2 class="text-2xl font-bold text-primary-900">💧 Soil Moisture Levels</h2>
			<Badge color={currentStatus.color} large>{currentStatus.text}</Badge>
		</div>
	</div>

	<div class="space-y-4">
		<!-- Current Reading -->
		<div class="flex justify-between items-center p-4 bg-white rounded-lg shadow-md border-b-2 border-primary-400">
			<div>
				<dt class="text-sm font-medium text-gray-500">Current Reading</dt>
				<dd class="mt-1 flex items-baseline gap-2">
					<span class="text-4xl font-bold text-gray-900">{moistureLevel}</span>
					<span class="text-lg text-gray-600">({moisturePercentage}%)</span>
				</dd>
			</div>
			<div class="text-right">
				<span class="inline-flex items-center rounded-full px-4 py-2 text-sm font-medium bg-{currentStatus.color}-100 text-{currentStatus.color}-800">
					{#if currentStatus.color === 'green'}
						✓ {currentStatus.text}
					{:else if currentStatus.color === 'red'}
						⚠ {currentStatus.text}
					{:else}
						● {currentStatus.text}
					{/if}
				</span>
			</div>
		</div>

		<!-- Moisture Ranges -->
		<div class="grid grid-cols-3 gap-4">
			<div class="p-4 bg-blue-50 rounded-lg border-2 border-blue-200">
				<dt class="text-sm font-medium text-gray-700 mb-1">💧 Wet Zone</dt>
				<dd class="text-xl font-bold text-blue-600">&lt;150</dd>
				<p class="text-xs text-gray-600 mt-1">Too much moisture</p>
			</div>
			<div class="p-4 bg-green-50 rounded-lg border-2 border-green-200">
				<dt class="text-sm font-medium text-gray-700 mb-1">✓ Optimal Zone</dt>
				<dd class="text-xl font-bold text-green-600">150-300</dd>
				<p class="text-xs text-gray-600 mt-1">Perfect conditions</p>
			</div>
			<div class="p-4 bg-red-50 rounded-lg border-2 border-red-200">
				<dt class="text-sm font-medium text-gray-700 mb-1">🔥 Dry Zone</dt>
				<dd class="text-xl font-bold text-red-600">&gt;300</dd>
				<p class="text-xs text-gray-600 mt-1">Needs watering</p>
			</div>
		</div>

		<!-- Chart -->
		<div class="pt-4">
			<h3 class="text-lg font-semibold text-gray-800 mb-3">Historical Trend</h3>
			<div class="bg-white p-4 rounded-lg shadow-inner">
				<Chart {options} bind:chart />
			</div>
		</div>

		<!-- Stats Summary -->
		<div class="grid grid-cols-2 md:grid-cols-4 gap-3 pt-4">
			<div class="text-center p-3 bg-white rounded-lg shadow-sm">
				<p class="text-xs text-gray-600">Min</p>
				<p class="text-lg font-bold text-gray-900">{Math.min(...moistureValues)}</p>
			</div>
			<div class="text-center p-3 bg-white rounded-lg shadow-sm">
				<p class="text-xs text-gray-600">Max</p>
				<p class="text-lg font-bold text-gray-900">{Math.max(...moistureValues)}</p>
			</div>
			<div class="text-center p-3 bg-white rounded-lg shadow-sm">
				<p class="text-xs text-gray-600">Avg</p>
				<p class="text-lg font-bold text-gray-900">
					{Math.round(moistureValues.reduce((a, b) => a + b, 0) / moistureValues.length)}
				</p>
			</div>
			<div class="text-center p-3 bg-white rounded-lg shadow-sm">
				<p class="text-xs text-gray-600">Data Points</p>
				<p class="text-lg font-bold text-gray-900">{feeds.length}</p>
			</div>
		</div>
	</div>
</Card>
