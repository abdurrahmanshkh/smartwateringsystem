<script>
    import { Card, Input, Button, Badge, Modal, Spinner, Tabs, TabItem } from 'flowbite-svelte';
    import { SearchOutline } from 'flowbite-svelte-icons';
    import { onMount } from 'svelte';
    import plantsData from '$lib/data/plants.json';

    let searchTerm = '';
    let selectedCategory = 'all';
    let selectedPlant = null;
    let showModal = false;
    let applyingThreshold = false;
    let activeTab = 'overview';
    
    $: filteredPlants = plantsData.filter(plant => {
        const matchesSearch = plant.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
            plant.category.toLowerCase().includes(searchTerm.toLowerCase());
        const matchesCategory = selectedCategory === 'all' || plant.category === selectedCategory;
        return matchesSearch && matchesCategory;
    });

    $: categories = ['all', ...new Set(plantsData.map(p => p.category))];

    function selectPlant(plant) {
        selectedPlant = JSON.parse(JSON.stringify(plant)); // clone
        showModal = true;
        activeTab = 'overview';
    }

    async function applyThreshold() {
        if (!selectedPlant) return;
        applyingThreshold = true;
        
        try {
            // POST to internal API to update threshold
            const url = `/api/settings`;
            const body = { threshold: selectedPlant.threshold };
            const response = await fetch(url, {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify(body)
            });

            if (!response.ok) throw new Error(`Status ${response.status}`);
            const resp = await response.json();
            if (resp.ok === false) throw new Error(resp.error || 'Failed to update');

            alert(`✓ Threshold updated to ${selectedPlant.threshold} for ${selectedPlant.name}!`);
            showModal = false;
        } catch (error) {
            console.error('Error:', error);
            alert('Failed to update threshold. Please try again.');
        } finally {
            applyingThreshold = false;
        }
    }

    function getTemperatureColor(temp) {
        if (temp > 30) return 'red';
        if (temp >= 18) return 'green';
        if (temp >= 10) return 'blue';
        return 'cyan';
    }

    function getHumidityColor(humidity) {
        if (humidity > 70) return 'blue';
        if (humidity >= 40) return 'green';
        if (humidity > 30) return 'orange'; 
        return 'red';
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
            Browse and select from <span class="font-bold text-green-600">{plantsData.length} plants</span> with optimized moisture, temperature, and humidity thresholds
        </p>
    </div>

    <!-- Search and Filter -->
    <Card class="min-w-full shadow-md border border-gray-200">
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
                            <!-- Moisture Info -->
                            <div class="flex justify-between items-center">
                                <span class="text-gray-600 text-xs">💧 Moisture:</span>
                                <span class="font-semibold text-xs">{plant.moisture_min}-{plant.moisture_max}%</span>
                            </div>

                            <!-- Temperature Info (NEW) -->
                            {#if plant.temp_min && plant.temp_max}
                            <div class="flex justify-between items-center">
                                <span class="text-gray-600 text-xs">🌡️ Temperature:</span>
                                <span class="font-semibold text-xs">{plant.temp_min}-{plant.temp_max}°C</span>
                            </div>
                            {/if}

                            <!-- Humidity Info (NEW) -->
                            {#if plant.humidity_min && plant.humidity_max}
                            <div class="flex justify-between items-center">
                                <span class="text-gray-600 text-xs">💨 Humidity:</span>
                                <span class="font-semibold text-xs">{plant.humidity_min}-{plant.humidity_max}%</span>
                            </div>
                            {/if}

                            <!-- Threshold -->
                            <div class="flex justify-between items-center">
                                <span class="text-gray-600 text-xs">🎯 Threshold:</span>
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

<!-- Plant Selection Modal (ENHANCED) -->
<Modal bind:open={showModal} size="lg" autoclose={false} class="w-full">
    {#if selectedPlant}
        <div class="space-y-4 p-2">
            <!-- Header -->
            <div class="text-center">
                <h3 class="text-2xl md:text-3xl font-bold text-gray-900 mb-2">{selectedPlant.name}</h3>
                <Badge color="green" class="text-sm">{selectedPlant.category}</Badge>
            </div>

            <!-- Tabs Navigation -->
            <Tabs>
                <TabItem title="Overview" open={activeTab === 'overview'} on:click={() => activeTab = 'overview'}>
                    <Card class="bg-gradient-to-br from-green-50 to-blue-50 border border-green-200 space-y-3">
                        <!-- Moisture Requirements -->
                        <div class="flex justify-between items-center p-3 bg-white rounded-lg border border-green-200">
                            <span class="font-medium text-gray-700 text-sm">💧 Moisture Range</span>
                            <span class="font-bold text-green-600">{selectedPlant.moisture_min}% - {selectedPlant.moisture_max}%</span>
                        </div>

                        <!-- Temperature Requirements (NEW) -->
                        {#if selectedPlant.temp_min && selectedPlant.temp_max}
                        <div class="flex justify-between items-center p-3 bg-white rounded-lg border border-orange-200">
                            <span class="font-medium text-gray-700 text-sm">🌡️ Temperature Range</span>
                            <span class="font-bold text-orange-600">{selectedPlant.temp_min}°C - {selectedPlant.temp_max}°C</span>
                        </div>
                        {/if}

                        <!-- Humidity Requirements (NEW) -->
                        {#if selectedPlant.humidity_min && selectedPlant.humidity_max}
                        <div class="flex justify-between items-center p-3 bg-white rounded-lg border border-cyan-200">
                            <span class="font-medium text-gray-700 text-sm">💨 Humidity Range</span>
                            <span class="font-bold text-cyan-600">{selectedPlant.humidity_min}% - {selectedPlant.humidity_max}%</span>
                        </div>
                        {/if}

                        <!-- Threshold Setting -->
                        <div class="flex justify-between items-center p-3 bg-white rounded-lg border border-gray-200">
                            <span class="font-medium text-gray-700 text-sm">🎯 Recommended Threshold</span>
                            <span class="text-2xl font-bold text-green-600">{selectedPlant.threshold}</span>
                        </div>

                        <!-- Description -->
                        <div class="p-3 bg-blue-50 rounded-lg border border-blue-200">
                            <p class="text-sm text-gray-700">
                                <strong>About:</strong> {selectedPlant.description}
                            </p>
                        </div>
                    </Card>
                </TabItem>

                <TabItem title="Environment" open={activeTab === 'environment'} on:click={() => activeTab = 'environment'}>
                    <Card class="bg-gradient-to-br from-orange-50 to-cyan-50 border border-orange-200 space-y-3">
                        <div class="grid grid-cols-1 sm:grid-cols-2 gap-3">
                            <!-- Temperature Card -->
                            {#if selectedPlant.temp_min && selectedPlant.temp_max}
                            <div class="p-4 bg-gradient-to-br from-orange-100 to-orange-50 rounded-lg border border-orange-300">
                                <p class="text-sm font-semibold text-orange-900 mb-2">🌡️ Temperature</p>
                                <p class="text-2xl font-bold text-orange-600">{selectedPlant.temp_min}°C - {selectedPlant.temp_max}°C</p>
                                <p class="text-xs text-orange-700 mt-2">
                                    {#if selectedPlant.temp_min <= 18 && selectedPlant.temp_max >= 25}
                                        Wide range - Adaptable plant
                                    {:else if selectedPlant.temp_min >= 20}
                                        Warm-loving plant
                                    {:else}
                                        Cool-preferring plant
                                    {/if}
                                </p>
                            </div>
                            {/if}

                            <!-- Humidity Card -->
                            {#if selectedPlant.humidity_min && selectedPlant.humidity_max}
                            <div class="p-4 bg-gradient-to-br from-cyan-100 to-cyan-50 rounded-lg border border-cyan-300">
                                <p class="text-sm font-semibold text-cyan-900 mb-2">💨 Humidity</p>
                                <p class="text-2xl font-bold text-cyan-600">{selectedPlant.humidity_min}% - {selectedPlant.humidity_max}%</p>
                                <p class="text-xs text-cyan-700 mt-2">
                                    {#if selectedPlant.humidity_max > 70}
                                        High humidity preferred
                                    {:else if selectedPlant.humidity_min < 40}
                                        Prefers dry air
                                    {:else}
                                        Moderate humidity
                                    {/if}
                                </p>
                            </div>
                            {/if}

                            <!-- Moisture Card -->
                            <div class="p-4 bg-gradient-to-br from-green-100 to-green-50 rounded-lg border border-green-300">
                                <p class="text-sm font-semibold text-green-900 mb-2">💧 Moisture</p>
                                <p class="text-2xl font-bold text-green-600">{selectedPlant.moisture_min}% - {selectedPlant.moisture_max}%</p>
                                <p class="text-xs text-green-700 mt-2">
                                    {#if selectedPlant.moisture_max > 60}
                                        Requires frequent watering
                                    {:else if selectedPlant.moisture_min < 30}
                                        Drought-tolerant plant
                                    {:else}
                                        Moderate watering
                                    {/if}
                                </p>
                            </div>

                            <!-- Threshold Card -->
                            <div class="p-4 bg-gradient-to-br from-purple-100 to-purple-50 rounded-lg border border-purple-300">
                                <p class="text-sm font-semibold text-purple-900 mb-2">🎯 Threshold Value</p>
                                <p class="text-2xl font-bold text-purple-600">{selectedPlant.threshold}</p>
                                <p class="text-xs text-purple-700 mt-2">
                                    {#if selectedPlant.threshold > 300}
                                        Very dry trigger - Drought tolerant
                                    {:else if selectedPlant.threshold > 200}
                                        Balanced trigger
                                    {:else}
                                        Wet trigger - Moisture loving
                                    {/if}
                                </p>
                            </div>
                        </div>
                    </Card>
                </TabItem>
            </Tabs>

            <!-- Information Box -->
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
                            {#if selectedPlant.temp_min && selectedPlant.temp_max}
                                <br><br>
                                Your current environment should ideally be between <strong>{selectedPlant.temp_min}°C - {selectedPlant.temp_max}°C</strong> 
                                with <strong>{selectedPlant.humidity_min}% - {selectedPlant.humidity_max}%</strong> humidity for optimal growth.
                            {/if}
                        </p>
                    </div>
                </div>
            </div>

            <!-- Action Buttons -->
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
