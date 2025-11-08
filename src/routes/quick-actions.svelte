<script>
	import { Card, Button, Badge } from 'flowbite-svelte';
	
	export let systemStatus = 0;
	export let onToggleSystem = () => {};
	export let updating = false;
</script>

<Card class="shadow-xl bg-gradient-to-r from-purple-50 to-pink-50 border-2 border-purple-200">
	<div class="flex flex-col md:flex-row justify-between items-start md:items-center gap-4">
		<div>
			<h3 class="text-xl font-bold text-purple-900 mb-2">⚡ Quick Actions</h3>
			<p class="text-sm text-purple-700">
				System is currently <Badge color={systemStatus === 1 ? 'green' : 'red'}>
					{systemStatus === 1 ? 'ACTIVE' : 'INACTIVE'}
				</Badge>
			</p>
		</div>
		
		<div class="flex gap-3">
			<Button 
				color={systemStatus === 1 ? 'red' : 'green'}
				on:click={onToggleSystem}
				disabled={updating}
			>
				{updating ? 'Processing...' : systemStatus === 1 ? '⏸️ Pause' : '▶️ Start'}
			</Button>
			<Button color="blue" href="/plants">
				🌿 Browse Plants
			</Button>
			<Button color="purple" href="/analytics">
				📊 View Analytics
			</Button>
		</div>
	</div>
</Card>
