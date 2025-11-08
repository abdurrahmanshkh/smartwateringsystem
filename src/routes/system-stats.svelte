<script>
	export let uptime = '0h 0m';
	export let dataPoints = 0;
	export let moistureLevel = 0;
	export let pumpStatus = 'OFF';
</script>

<div class="grid grid-cols-2 md:grid-cols-4 gap-3">
	<div class="text-center p-3 bg-white/70 rounded-lg shadow-sm">
		<div class="text-2xl mb-1">⏱️</div>
		<p class="text-xs text-gray-600">Uptime</p>
		<p class="text-sm font-bold text-gray-900">{uptime}</p>
	</div>
	<div class="text-center p-3 bg-white/70 rounded-lg shadow-sm">
		<div class="text-2xl mb-1">📊</div>
		<p class="text-xs text-gray-600">Data Points</p>
		<p class="text-sm font-bold text-gray-900">{dataPoints}</p>
	</div>
	<div class="text-center p-3 bg-white/70 rounded-lg shadow-sm">
		<div class="text-2xl mb-1">💧</div>
		<p class="text-xs text-gray-600">Moisture</p>
		<p class="text-sm font-bold text-gray-900">{moistureLevel}</p>
	</div>
	<div class="text-center p-3 bg-white/70 rounded-lg shadow-sm">
		<div class="text-2xl mb-1">{pumpStatus === 'ON' ? '🔄' : '⏸️'}</div>
		<p class="text-xs text-gray-600">Pump</p>
		<p class="text-sm font-bold text-gray-900">{pumpStatus}</p>
	</div>
</div>
