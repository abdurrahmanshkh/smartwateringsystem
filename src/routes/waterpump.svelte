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
			height: 320,
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
				speed: 600
			}
		},
		fill: {
			opacity: 1,
			colors: ['#31C48D']
		},
		plotOptions: {
			bar: {
				horizontal: false,
				columnWidth: '65%',
				borderRadiusApplication: 'end',
				borderRadius: 6,
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
			show: false
		},
		dataLabels: {
			enabled: true,
			formatter: function (val) {
				return val === 1 ? 'ON' : 'OFF';
			},
			offsetY: -18,
			style: {
				fontSize: '10px',
				colors: ['#374151'],
				fontWeight: 600
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
					cssClass: 'text-xs font-normal fill-gray-500',
					fontSize: '11px'
				},
				rotate: -45,
				rotateAlways: false
			},
			categories: timestamps,
			axisTicks: {
				show: false
			},
			axisBorder: {
				show: true,
				color: '#E5E7EB'
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
			min: 0,
			max: 1.15,
			tickAmount: 2,
			labels: {
				show: true,
				style: {
					fontFamily: 'Inter, sans-serif',
					cssClass: 'text-xs font-normal fill-gray-500',
					fontSize: '11px'
				},
				formatter: function(value) {
					return value === 1 ? 'ON' : value === 0 ? 'OFF' : '';
				}
			},
			title: {
				text: 'Status',
				style: {
					fontSize: '12px',
					fontWeight: 600
				}
			}
		},
		grid: {
			show: true,
			strokeDashArray: 3,
			padding: {
				left: 10,
				right: 10,
				top: 0,
				bottom: 0
			},
			borderColor: '#E5E7EB'
		}
	};
</script>

<Card class="shadow-md border border-amber-200 bg-gradient-to-br from-white to-amber-50/30 h-full">
	<div class="space-y-4">
		<!-- Header -->
		<div class="flex justify-between items-center pb-3 border-b border-amber-200">
			<h2 class="text-lg md:text-xl font-bold text-amber-900 flex items-center gap-2">
				<span>⚙️</span> Water Pump Status
			</h2>
			<Badge color={pumpStatus === 'ON' ? 'green' : 'gray'}>
				{pumpStatus === 'ON' ? '● ACTIVE' : '○ INACTIVE'}
			</Badge>
		</div>

		<!-- Current Status -->
		<div class="flex justify-between items-center p-3 bg-white rounded-lg shadow-sm border border-amber-100">
			<div>
				<dt class="text-xs font-medium text-gray-600">Current Status</dt>
				<dd class="mt-1">
					<span class="text-3xl font-bold text-gray-900">{pumpStatus}</span>
				</dd>
			</div>
			<div class="text-4xl">
				{pumpStatus === 'ON' ? '🔄' : '⏸️'}
			</div>
		</div>

		<!-- Statistics -->
		<div class="grid grid-cols-3 gap-2">
			<div class="p-2.5 bg-green-50 rounded-lg border border-green-200">
				<dt class="text-xs font-medium text-gray-700 mb-0.5">✓ Active</dt>
				<dd class="text-xl font-bold text-green-600">{onCount}</dd>
				<p class="text-xs text-gray-600 mt-0.5">times</p>
			</div>
			<div class="p-2.5 bg-gray-50 rounded-lg border border-gray-200">
				<dt class="text-xs font-medium text-gray-700 mb-0.5">○ Inactive</dt>
				<dd class="text-xl font-bold text-gray-600">{offCount}</dd>
				<p class="text-xs text-gray-600 mt-0.5">times</p>
			</div>
			<div class="p-2.5 bg-blue-50 rounded-lg border border-blue-200">
				<dt class="text-xs font-medium text-gray-700 mb-0.5">📊 Uptime</dt>
				<dd class="text-xl font-bold text-blue-600">{averageOnTime}%</dd>
				<p class="text-xs text-gray-600 mt-0.5">of time</p>
			</div>
		</div>

		<!-- Chart -->
		<div>
			<h3 class="text-sm font-semibold text-gray-800 mb-2">Activity History</h3>
			<div class="bg-white p-3 rounded-lg shadow-sm border border-gray-200">
				<Chart {options} />
			</div>
		</div>

		<!-- Performance -->
		<div class="p-3 bg-gradient-to-r from-green-50 to-blue-50 rounded-lg border border-green-200">
			<div class="flex justify-between items-center">
				<div>
					<p class="text-sm font-semibold text-gray-800">System Performance</p>
					<p class="text-xs text-gray-600 mt-0.5">Based on pump activity</p>
				</div>
				<Badge color="green">
					{averageOnTime < 30 ? 'Efficient' : averageOnTime < 60 ? 'Normal' : 'High Usage'}
				</Badge>
			</div>
		</div>
	</div>
</Card>
