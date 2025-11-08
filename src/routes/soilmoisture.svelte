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
			height: '320px',
			maxWidth: '100%',
			type: 'area',
			fontFamily: 'Inter, sans-serif',
			dropShadow: {
				enabled: true,
				top: 2,
				left: 0,
				blur: 3,
				opacity: 0.08
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
				speed: 600
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
				opacityFrom: 0.6,
				opacityTo: 0.1,
				stops: [0, 90, 100]
			}
		},
		dataLabels: {
			enabled: false
		},
		stroke: {
			curve: 'smooth',
			width: 2.5
		},
		xaxis: {
			categories: timestamps,
			labels: {
				style: {
					colors: '#6B7280',
					fontSize: '11px'
				},
				rotate: -45,
				rotateAlways: false
			},
			title: {
				text: 'Time',
				style: {
					fontSize: '12px',
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
					fontSize: '11px'
				},
				formatter: function(value) {
					return Math.round(value);
				}
			},
			title: {
				text: 'Moisture Level',
				style: {
					fontSize: '12px',
					fontWeight: 600
				}
			}
		},
		grid: {
			borderColor: '#E5E7EB',
			strokeDashArray: 3,
			padding: {
				top: 0,
				right: 10,
				bottom: 0,
				left: 10
			}
		},
		annotations: {
			yaxis: [
				{
					y: 350,
					borderColor: '#EF4444',
					label: {
						text: 'Critical',
						style: {
							color: '#fff',
							background: '#EF4444',
							fontSize: '10px'
						}
					}
				},
				{
					y: 150,
					borderColor: '#10B981',
					label: {
						text: 'Optimal',
						style: {
							color: '#fff',
							background: '#10B981',
							fontSize: '10px'
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

<Card class="shadow-md border border-blue-200 bg-gradient-to-br from-white to-blue-50/30 h-full">
	<div class="space-y-4">
		<!-- Header -->
		<div class="flex justify-between items-center pb-3 border-b border-blue-200">
			<h2 class="text-lg md:text-xl font-bold text-blue-900 flex items-center gap-2">
				<span>💧</span> Soil Moisture Levels
			</h2>
			<Badge color={currentStatus.color}>{currentStatus.text}</Badge>
		</div>

		<!-- Current Reading -->
		<div class="flex justify-between items-center p-3 bg-white rounded-lg shadow-sm border border-blue-100">
			<div>
				<dt class="text-xs font-medium text-gray-600">Current Reading</dt>
				<dd class="mt-1 flex items-baseline gap-2">
					<span class="text-3xl font-bold text-gray-900">{moistureLevel}</span>
					<span class="text-base text-gray-600">({moisturePercentage}%)</span>
				</dd>
			</div>
			<div class="text-right">
				<span class="inline-flex items-center rounded-full px-3 py-1.5 text-xs font-semibold bg-{currentStatus.color}-100 text-{currentStatus.color}-800 border border-{currentStatus.color}-200">
					{#if currentStatus.color === 'green'}
						✓ Optimal
					{:else if currentStatus.color === 'red'}
						⚠ Critical
					{:else}
						● {currentStatus.text.split(' - ')}
					{/if}
				</span>
			</div>
		</div>

		<!-- Moisture Ranges -->
		<div class="grid grid-cols-3 gap-2">
			<div class="p-2.5 bg-blue-50 rounded-lg border border-blue-200">
				<dt class="text-xs font-medium text-gray-700 mb-0.5">💧 Wet</dt>
				<dd class="text-base font-bold text-blue-600">&lt;150</dd>
				<p class="text-xs text-gray-600 mt-0.5">Too much</p>
			</div>
			<div class="p-2.5 bg-green-50 rounded-lg border border-green-200">
				<dt class="text-xs font-medium text-gray-700 mb-0.5">✓ Optimal</dt>
				<dd class="text-base font-bold text-green-600">150-300</dd>
				<p class="text-xs text-gray-600 mt-0.5">Perfect</p>
			</div>
			<div class="p-2.5 bg-red-50 rounded-lg border border-red-200">
				<dt class="text-xs font-medium text-gray-700 mb-0.5">🔥 Dry</dt>
				<dd class="text-base font-bold text-red-600">&gt;300</dd>
				<p class="text-xs text-gray-600 mt-0.5">Needs water</p>
			</div>
		</div>

		<!-- Chart -->
		<div>
			<h3 class="text-sm font-semibold text-gray-800 mb-2">Historical Trend</h3>
			<div class="bg-white p-3 rounded-lg shadow-sm border border-gray-200">
				<Chart {options} bind:chart />
			</div>
		</div>

		<!-- Stats -->
		<div class="grid grid-cols-2 md:grid-cols-4 gap-2">
			<div class="text-center p-2 bg-white rounded-lg shadow-sm border border-gray-200">
				<p class="text-xs text-gray-600">Min</p>
				<p class="text-base font-bold text-gray-900">{Math.min(...moistureValues)}</p>
			</div>
			<div class="text-center p-2 bg-white rounded-lg shadow-sm border border-gray-200">
				<p class="text-xs text-gray-600">Max</p>
				<p class="text-base font-bold text-gray-900">{Math.max(...moistureValues)}</p>
			</div>
			<div class="text-center p-2 bg-white rounded-lg shadow-sm border border-gray-200">
				<p class="text-xs text-gray-600">Avg</p>
				<p class="text-base font-bold text-gray-900">
					{Math.round(moistureValues.reduce((a, b) => a + b, 0) / moistureValues.length)}
				</p>
			</div>
			<div class="text-center p-2 bg-white rounded-lg shadow-sm border border-gray-200">
				<p class="text-xs text-gray-600">Points</p>
				<p class="text-base font-bold text-gray-900">{feeds.length}</p>
			</div>
		</div>
	</div>
</Card>
