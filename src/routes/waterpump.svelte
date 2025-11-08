<script lang="ts">
	import { Card, Chart, Badge } from 'flowbite-svelte';

	export let pumpStatus = 'OFF';
	export let feeds = [];

	$: pumpValues = feeds.map(feed => feed.field2 || '0');
	$: onCount = pumpValues.filter((value) => value === '1').length;
	$: offCount = pumpValues.filter((value) => value === '0').length;
	$: averageOnTime = onCount > 0 ? ((onCount / pumpValues.length) * 100).toFixed(1) : 0;
	$: timestamps = feeds.map(feed => new Date(feed.created_at).toLocaleTimeString('en-US', { hour: '2-digit', minute: '2-digit' }));

	$: options = {
		series: [
			{
				name: 'Pump Status',
				color: '#31C48D',
				data: pumpValues.map(val => parseInt(val))
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
			},
			animations: {
				enabled: true,
				easing: 'easeinout',
				speed: 800
			}
		},
		fill: {
			opacity: 1,
			colors: ['#31C48D']
		},
		plotOptions: {
			bar: {
				horizontal: false,
				columnWidth: '70%',
				borderRadiusApplication: 'end',
				borderRadius: 8,
				dataLabels: {
					position: 'top'
				},
				colors: {
					ranges: [{
						from: 0,
						to: 0,
						color: '#9CA3AF'
					}, {
						from: 1,
						to: 1,
						color: '#31C48D'
					}]
				}
			}
		},
		legend: {
			show: true,
			position: 'top',
			horizontalAlign: 'left'
		},
		dataLabels: {
			enabled: true,
			formatter: function (val) {
				return val === 1 ? 'ON' : 'OFF';
			},
			offsetY: -20,
			style: {
				fontSize: '12px',
				colors: ['#374151']
			}
		},
		tooltip: {
			shared: true,
			intersect: false,
			y: {
				formatter: function (value) {
					return value === 1 ? 'Pump ON' : 'Pump OFF';
				}
			}
		},
		xaxis: {
			labels: {
				show: true,
				style: {
					fontFamily: 'Inter, sans-serif',
					cssClass: 'text-xs font-normal fill-gray-500'
				},
				rotate: -45,
				rotateAlways: false
			},
			categories: timestamps,
			axisTicks: {
				show: false
			},
			axisBorder: {
				show: true
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
			min: 0,
			max: 1.2,
			tickAmount: 2,
			labels: {
				show: true,
				style: {
					fontFamily: 'Inter, sans-serif',
					cssClass: 'text-xs font-normal fill-gray-500'
				},
				formatter: function(value) {
					return value === 1 ? 'ON' : value === 0 ? 'OFF' : '';
				}
			},
			title: {
				text: 'Pump Status',
				style: {
					fontSize: '14px',
					fontWeight: 600
				}
			}
		},
		grid: {
			show: true,
			strokeDashArray: 4,
			padding: {
				left: 10,
				right: 10,
				top: 0
			},
			borderColor: '#E5E7EB'
		}
	};
</script>

<Card class="shadow-xl border-2 border-amber-200 bg-gradient-to-br from-white to-amber-50">
	<div class="border-b-2 border-amber-400 pb-4 mb-4">
		<div class="flex justify-between items-center">
			<h2 class="text-2xl font-bold text-amber-900">⚙️ Water Pump Status</h2>
			<Badge color={pumpStatus === 'ON' ? 'green' : 'gray'} large>
				{pumpStatus === 'ON' ? '● ACTIVE' : '○ INACTIVE'}
			</Badge>
		</div>
	</div>

	<div class="space-y-4">
		<!-- Current Status -->
		<div class="flex justify-between items-center p-4 bg-white rounded-lg shadow-md border-b-2 border-amber-400">
			<div>
				<dt class="text-sm font-medium text-gray-500">Current Status</dt>
				<dd class="mt-1">
					<span class="text-4xl font-bold text-gray-900">{pumpStatus}</span>
				</dd>
			</div>
			<div class="text-5xl">
				{pumpStatus === 'ON' ? '🔄' : '⏸️'}
			</div>
		</div>

		<!-- Statistics -->
		<div class="grid grid-cols-3 gap-4">
			<div class="p-4 bg-green-50 rounded-lg border-2 border-green-200">
				<dt class="text-sm font-medium text-gray-700 mb-1">✓ Active</dt>
				<dd class="text-2xl font-bold text-green-600">{onCount}</dd>
				<p class="text-xs text-gray-600 mt-1">times</p>
			</div>
			<div class="p-4 bg-gray-50 rounded-lg border-2 border-gray-200">
				<dt class="text-sm font-medium text-gray-700 mb-1">○ Inactive</dt>
				<dd class="text-2xl font-bold text-gray-600">{offCount}</dd>
				<p class="text-xs text-gray-600 mt-1">times</p>
			</div>
			<div class="p-4 bg-blue-50 rounded-lg border-2 border-blue-200">
				<dt class="text-sm font-medium text-gray-700 mb-1">📊 Uptime</dt>
				<dd class="text-2xl font-bold text-blue-600">{averageOnTime}%</dd>
				<p class="text-xs text-gray-600 mt-1">of time</p>
			</div>
		</div>

		<!-- Chart -->
		<div class="pt-4">
			<h3 class="text-lg font-semibold text-gray-800 mb-3">Activity History</h3>
			<div class="bg-white p-4 rounded-lg shadow-inner">
				<Chart {options} />
			</div>
		</div>

		<!-- Performance Indicator -->
		<div class="p-4 bg-gradient-to-r from-green-50 to-blue-50 rounded-lg border-2 border-green-200">
			<div class="flex justify-between items-center">
				<div>
					<p class="text-sm font-medium text-gray-700">System Performance</p>
					<p class="text-xs text-gray-600 mt-1">Based on pump activity patterns</p>
				</div>
				<Badge color="green" large>
					{averageOnTime < 30 ? 'Efficient' : averageOnTime < 60 ? 'Normal' : 'High Usage'}
				</Badge>
			</div>
		</div>
	</div>
</Card>
