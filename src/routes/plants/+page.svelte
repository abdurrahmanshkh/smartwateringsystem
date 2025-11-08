<script>
	import { Card, Input, Button, Badge, Modal, Spinner } from 'flowbite-svelte';
	import { SearchOutline } from 'flowbite-svelte-icons';
	import { onMount } from 'svelte';
	import plantsData from '$lib/data/plants.json';

	let searchTerm = '';
	let selectedCategory = 'all';
	let selectedPlant = null;
	let showModal = false;
	let applyingThreshold = false;
	
	$: filteredPlants = plantsData.filter(plant => {
		const matchesSearch = plant.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
			plant.category.toLowerCase().includes(searchTerm.toLowerCase());
		const matchesCategory = selectedCategory === 'all' || plant.category === selectedCategory;
		return matchesSearch && matchesCategory;
	});

	$: categories = ['all', ...new Set(plantsData.map(p => p.category))];

	function selectPlant(plant) {
		selectedPlant = plant;
		showModal = true;
	}

	async function applyThreshold() {
		applyingThreshold = true;
		
		try {
			const apiKey = 'CV5WWIPTAVEW6RMD';
			const url = `https://api.thingspeak.com/update?api_key=${apiKey}&field4=${selectedPlant.threshold}`;
			
			const response = await fetch(url);
			const data = await response.text();
			
			if (data !== '0') {
				alert(`✓ Threshold updated to ${selectedPlant.threshold} for ${selectedPlant.name}!`);
				showModal = false;
			} else {
				throw new Error('Failed to update threshold');
			}
		} catch (error) {
			console.error('Error:', error);
			alert('Failed to update threshold. Please try again.');
		} finally {
			applyingThreshold = false;
		}
	}
</script>

<svelte:head>
	<title>Plant Database - Smart Plant Watering System</title>
</svelte:head>

<div class="space-y-4 md:space-y-5">
	<!-- Header -->
	<div>
		<h1 class="text-2xl md:text-3xl lg:text-4xl font-bold bg-gradient-to-r from-green-600 to-teal-600 bg-clip-text text-transparent flex items-center gap-2">
			<span>🌿</span> Plant Database
		</h1>
		<p class="text-sm md:text-base text-gray-600 mt-1.5">
			Browse and select from <span class="font-bold text-green-600">{plantsData.length} plants</span> with optimized moisture thresholds
		</p>
	</div>

	<!-- Search and Filter -->
	<Card class="shadow-md border border-gray-200">
		<div class="space-y-3">
			<div>
				<Input 
					bind:value={searchTerm}
					placeholder="Search plants by name or category..."
					size="md"
					class="w-full"
				>
					<SearchOutline slot="left" class="w-4 h-4 text-gray-500" />
				</Input>
			</div>
			<div class="flex gap-2 flex-wrap">
				{#each categories as category}
					<Button 
						color={selectedCategory === category ? 'green' : 'light'}
						on:click={() => selectedCategory = category}
						size="xs"
						class="text-xs"
					>
						{category === 'all' ? 'All Plants' : category}
					</Button>
				{/each}
			</div>
		</div>
	</Card>

	<!-- Results Count -->
	<div class="flex justify-between items-center px-1">
		<p class="text-sm text-gray-600">
			Showing <span class="font-bold text-green-600">{filteredPlants.length}</span> plant{filteredPlants.length !== 1 ? 's' : ''}
		</p>
	</div>

	<!-- Plants Grid -->
	<div class="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-3 md:gap-4">
		{#each filteredPlants as plant (plant.id)}
			<Card class="hover:shadow-lg transition-all duration-200 cursor-pointer border border-gray-200 hover:border-green-400 h-full">
				<button class="w-full text-left h-full" on:click={() => selectPlant(plant)}>
					<div class="space-y-2.5 flex flex-col h-full">
						<div class="flex justify-between items-start gap-2">
							<h3 class="text-base font-bold text-gray-900 line-clamp-2">{plant.name}</h3>
							<Badge color="green" class="text-xs flex-shrink-0">{plant.category}</Badge>
						</div>
						
						<div class="space-y-1.5 text-sm flex-grow">
							<div class="flex justify-between items-center">
								<span class="text-gray-600 text-xs">Moisture Range:</span>
								<span class="font-semibold text-xs">{plant.moisture_min}-{plant.moisture_max}%</span>
							</div>
							<div class="flex justify-between items-center">
								<span class="text-gray-600 text-xs">Threshold:</span>
								<span class="font-bold text-green-600 text-sm">{plant.threshold}</span>
							</div>
						</div>

						<div class="pt-2 border-t border-gray-200">
							<p class="text-xs text-gray-600 line-clamp-2">{plant.description}</p>
						</div>

						<Button color="green" size="xs" class="w-full mt-auto">
							Select Plant
						</Button>
					</div>
				</button>
			</Card>
		{/each}
	</div>
</div>

<!-- Plant Selection Modal -->
<Modal bind:open={showModal} size="md" autoclose={false} class="w-full">
	{#if selectedPlant}
		<div class="space-y-4 p-2">
			<div class="text-center">
				<h3 class="text-2xl md:text-3xl font-bold text-gray-900 mb-2">{selectedPlant.name}</h3>
				<Badge color="green" class="text-sm">{selectedPlant.category}</Badge>
			</div>

			<Card class="bg-gradient-to-br from-green-50 to-blue-50 border border-green-200">
				<div class="space-y-2.5">
					<div class="flex justify-between items-center p-2.5 bg-white rounded-lg border border-gray-200">
						<span class="font-medium text-gray-700 text-sm">Moisture Range</span>
						<span class="font-bold text-green-600">{selectedPlant.moisture_min}% - {selectedPlant.moisture_max}%</span>
					</div>
					
					<div class="flex justify-between items-center p-2.5 bg-white rounded-lg border border-gray-200">
						<span class="font-medium text-gray-700 text-sm">Recommended Threshold</span>
						<span class="text-xl font-bold text-green-600">{selectedPlant.threshold}</span>
					</div>

					<div class="p-2.5 bg-blue-50 rounded-lg border border-blue-200">
						<p class="text-sm text-gray-700">
							<strong>About:</strong> {selectedPlant.description}
						</p>
					</div>
				</div>
			</Card>

			<div class="bg-yellow-50 border-l-4 border-yellow-400 p-3 rounded">
				<div class="flex gap-2">
					<div class="flex-shrink-0">
						<svg class="h-5 w-5 text-yellow-400" fill="currentColor" viewBox="0 0 20 20">
							<path fill-rule="evenodd" d="M8.257 3.099c.765-1.36 2.722-1.36 3.486 0l5.58 9.92c.75 1.334-.213 2.98-1.742 2.98H4.42c-1.53 0-2.493-1.646-1.743-2.98l5.58-9.92zM11 13a1 1 0 11-2 0 1 1 0 012 0zm-1-8a1 1 0 00-1 1v3a1 1 0 002 0V6a1 1 0 00-1-1z" clip-rule="evenodd" />
						</svg>
					</div>
					<div>
						<p class="text-xs text-yellow-700">
							This will update your system's moisture threshold to <strong>{selectedPlant.threshold}</strong>. 
							The system will automatically water when the sensor reading exceeds this value.
						</p>
					</div>
				</div>
			</div>

			<div class="flex gap-2.5">
				<Button 
					color="green" 
					class="flex-1"
					disabled={applyingThreshold}
					on:click={applyThreshold}
				>
					{#if applyingThreshold}
						<Spinner size="4" class="mr-2" />
					{/if}
					{applyingThreshold ? 'Applying...' : 'Apply This Threshold'}
				</Button>
				<Button 
					color="alternative" 
					on:click={() => showModal = false}
					disabled={applyingThreshold}
				>
					Cancel
				</Button>
			</div>
		</div>
	{/if}
</Modal>

<style>
	:global(.line-clamp-2) {
		display: -webkit-box;
		-webkit-line-clamp: 2;
		-webkit-box-orient: vertical;
		overflow: hidden;
	}
</style>
