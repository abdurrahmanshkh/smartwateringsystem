<script>
    import { Card, Input, Button, Badge, Modal, Spinner, Tabs, TabItem, Textarea } from 'flowbite-svelte';
    import { SearchOutline } from 'flowbite-svelte-icons';
    import { onMount } from 'svelte';
    import plantsData from '$lib/data/plants.json';

    // State
    let searchTerm = '';
    let selectedCategory = 'all';
    let selectedPlant = null;
    let showModal = false;
    let applyingThreshold = false;
    let activeTab = 'overview';
    let isCustom = false; // true when creating/editing a custom plant
    let error = '';
    let success = '';

    $: filteredPlants = plantsData.filter(plant => {
        const matchesSearch = plant.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
            plant.category.toLowerCase().includes(searchTerm.toLowerCase());
        const matchesCategory = selectedCategory === 'all' || plant.category === selectedCategory;
        return matchesSearch && matchesCategory;
    });

    $: categories = ['all', ...new Set(plantsData.map(p => p.category))];

    // Template for a new custom plant
    function newPlantTemplate() {
        return {
            id: null,
            name: '',
            category: '',
            moisture_min: 0,
            moisture_max: 100,
            temp_min: null,
            temp_max: null,
            humidity_min: null,
            humidity_max: null,
            threshold: 250,
            description: ''
        };
    }

    function selectPlant(plant) {
        // Open modal with editable clone of the plant
        selectedPlant = JSON.parse(JSON.stringify(plant));
        isCustom = false;
        showModal = true;
        activeTab = 'overview';
        error = '';
        success = '';
    }

    function addCustomPlant() {
        selectedPlant = newPlantTemplate();
        isCustom = true;
        showModal = true;
        activeTab = 'overview';
        error = '';
        success = '';
    }

    // Validate numeric fields and coerce types
    function normalizePlantForSubmit(plant) {
        const normalized = { ...plant };
        // threshold and numeric ranges
        normalized.threshold = Number(normalized.threshold) || 0;
        normalized.moisture_min = Number(normalized.moisture_min) || 0;
        normalized.moisture_max = Number(normalized.moisture_max) || 0;
        normalized.temp_min = normalized.temp_min !== null && normalized.temp_min !== '' ? Number(normalized.temp_min) : null;
        normalized.temp_max = normalized.temp_max !== null && normalized.temp_max !== '' ? Number(normalized.temp_max) : null;
        normalized.humidity_min = normalized.humidity_min !== null && normalized.humidity_min !== '' ? Number(normalized.humidity_min) : null;
        normalized.humidity_max = normalized.humidity_max !== null && normalized.humidity_max !== '' ? Number(normalized.humidity_max) : null;
        // Ensure name & category strings
        normalized.name = String(normalized.name || '').trim();
        normalized.category = String(normalized.category || '').trim();
        normalized.description = String(normalized.description || '').trim();
        return normalized;
    }

    // Single-shot POST to /api/settings to save threshold + plant details
    async function applyThreshold() {
        if (!selectedPlant) return;
        applyingThreshold = true;
        error = '';
        success = '';

        try {
            const plantToSave = normalizePlantForSubmit(selectedPlant);

            // Minimal validation
            if (!plantToSave.name) {
                throw new Error('Please enter a plant name.');
            }
            if (!plantToSave.category) {
                // allow empty category but warn
                plantToSave.category = plantToSave.category || 'custom';
            }
            if (!Number.isFinite(plantToSave.threshold)) {
                throw new Error('Threshold must be a number.');
            }

            const url = '/api/settings';
            const body = {
                threshold: plantToSave.threshold,
                // save the plant details inside settings (per your request)
                plant: plantToSave,
                // optional flag so server can decide whether to upsert singleton or create record
                source: 'frontend'
            };

            const response = await fetch(url, {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify(body)
            });

            if (!response.ok) {
                const text = await response.text().catch(() => null);
                throw new Error(`Server error ${response.status}${text ? ` - ${text}` : ''}`);
            }

            const resp = await response.json();
            if (resp && resp.ok === false) {
                throw new Error(resp.error || 'Server rejected update');
            }

            success = `✓ Threshold ${plantToSave.threshold} saved for "${plantToSave.name}"`;
            // small UX: close modal after successful apply
            setTimeout(() => {
                showModal = false;
            }, 800);
        } catch (err) {
            console.error('Error saving settings:', err);
            error = err.message || 'Failed to save settings';
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
    <div class="flex items-start justify-between gap-3">
        <div>
            <h1 class="text-2xl md:text-3xl lg:text-4xl font-bold bg-gradient-to-r from-green-600 to-teal-600 bg-clip-text text-transparent flex items-center gap-2">
                <span>🌿</span> Plant Database
            </h1>
            <p class="text-sm md:text-base text-gray-600 mt-1.5">
                Browse and select from <span class="font-bold text-green-600">{plantsData.length} plants</span> with optimized moisture, temperature, and humidity thresholds
            </p>
        </div>

        <div class="flex gap-2">
            <Button color="light" size="sm" on:click={addCustomPlant}>
                ➕ Add Custom Plant
            </Button>
        </div>
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
            <Card class="min-w-full hover:shadow-lg transition-all duration-200 cursor-pointer border border-gray-200 hover:border-green-400 h-full">
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
                            {#if plant.temp_min !== undefined && plant.temp_max !== undefined}
                            <div class="flex justify-between items-center">
                                <span class="text-gray-600 text-xs">🌡️ Temperature:</span>
                                <span class="font-semibold text-xs">{plant.temp_min}-{plant.temp_max}°C</span>
                            </div>
                            {/if}

                            <!-- Humidity Info (NEW) -->
                            {#if plant.humidity_min !== undefined && plant.humidity_max !== undefined}
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

<!-- Plant Selection / Edit Modal -->
<Modal bind:open={showModal} size="lg" autoclose={false} class="w-full">
    {#if selectedPlant}
        <div class="space-y-4 p-2">
            <!-- Header -->
            <div class="flex items-center justify-between">
                <div>
                    <h3 class="text-2xl md:text-3xl font-bold text-gray-900 mb-1">
                        {isCustom ? 'Create Custom Plant' : 'Plant Details'}
                    </h3>
                    <Badge color="green" class="text-sm">{selectedPlant.category || 'custom'}</Badge>
                </div>

                <div class="flex items-center gap-2">
                    <Button color="light" size="xs" on:click={() => {
                        // toggle edit mode: opening as editable already, but user can reset to blank
                        if (!isCustom) {
                            selectedPlant = JSON.parse(JSON.stringify(selectedPlant));
                            isCustom = true;
                        } else {
                            selectedPlant = newPlantTemplate();
                        }
                    }}>
                        {isCustom ? 'Reset' : 'Edit / Make Custom'}
                    </Button>

                    <Button color="alternative" size="xs" on:click={() => { showModal = false; }}>
                        Close
                    </Button>
                </div>
            </div>

            <!-- Tabs Navigation -->
            <Tabs>
                <TabItem title="Overview" open={activeTab === 'overview'} on:click={() => activeTab = 'overview'}>
                    <Card class="min-w-full bg-gradient-to-br from-green-50 to-blue-50 border border-green-200 space-y-3">
                        <!-- Editable fields: name, category -->
                        <div class="grid grid-cols-1 sm:grid-cols-2 gap-3">
                            <div>
                                <label class="text-xs text-gray-700">Plant Name</label>
                                <Input bind:value={selectedPlant.name} placeholder="e.g. Basil" />
                            </div>
                            <div>
                                <label class="text-xs text-gray-700">Category</label>
                                <Input bind:value={selectedPlant.category} placeholder="e.g. Herb, Succulent" />
                            </div>
                        </div>

                        <!-- Moisture Requirements (editable) -->
                        <div class="flex justify-between items-center p-3 bg-white rounded-lg border border-green-200">
                            <div>
                                <span class="font-medium text-gray-700 text-sm">💧 Moisture Range</span>
                                <div class="flex gap-2 mt-2">
                                    <Input bind:value={selectedPlant.moisture_min} type="number" class="w-1/2" />
                                    <Input bind:value={selectedPlant.moisture_max} type="number" class="w-1/2" />
                                </div>
                            </div>
                            <div class="font-bold text-green-600 text-sm">{selectedPlant.moisture_min}-{selectedPlant.moisture_max}%</div>
                        </div>

                        <!-- Temperature Requirements (editable) -->
                        <div class="flex justify-between items-center p-3 bg-white rounded-lg border border-orange-200">
                            <div>
                                <span class="font-medium text-gray-700 text-sm">🌡️ Temperature Range</span>
                                <div class="flex gap-2 mt-2">
                                    <Input bind:value={selectedPlant.temp_min} type="number" placeholder="min" class="w-1/2" />
                                    <Input bind:value={selectedPlant.temp_max} type="number" placeholder="max" class="w-1/2" />
                                </div>
                            </div>
                            <div class="font-bold text-orange-600 text-sm">
                                {selectedPlant.temp_min ?? '—'}°C - {selectedPlant.temp_max ?? '—'}°C
                            </div>
                        </div>

                        <!-- Humidity Requirements (editable) -->
                        <div class="flex justify-between items-center p-3 bg-white rounded-lg border border-cyan-200">
                            <div>
                                <span class="font-medium text-gray-700 text-sm">💨 Humidity Range</span>
                                <div class="flex gap-2 mt-2">
                                    <Input bind:value={selectedPlant.humidity_min} type="number" placeholder="min" class="w-1/2" />
                                    <Input bind:value={selectedPlant.humidity_max} type="number" placeholder="max" class="w-1/2" />
                                </div>
                            </div>
                            <div class="font-bold text-cyan-600 text-sm">
                                {selectedPlant.humidity_min ?? '—'}% - {selectedPlant.humidity_max ?? '—'}%
                            </div>
                        </div>

                        <!-- Threshold Setting (editable) -->
                        <div class="flex justify-between items-center p-3 bg-white rounded-lg border border-gray-200">
                            <div>
                                <span class="font-medium text-gray-700 text-sm">🎯 Recommended Threshold</span>
                                <div class="mt-2">
                                    <Input bind:value={selectedPlant.threshold} type="number" />
                                </div>
                            </div>
                            <div class="text-2xl font-bold text-green-600">{selectedPlant.threshold}</div>
                        </div>

                        <!-- Description (editable) -->
                        <div class="p-3 bg-blue-50 rounded-lg border border-blue-200">
                            <label class="text-xs text-gray-700">About</label>
                            <Textarea bind:value={selectedPlant.description} rows="3" placeholder="Add short notes about the plant..." />
                        </div>
                    </Card>
                </TabItem>

                <TabItem title="Environment" open={activeTab === 'environment'} on:click={() => activeTab = 'environment'}>
                    <Card class="min-w-full bg-gradient-to-br from-orange-50 to-cyan-50 border border-orange-200 space-y-3">
                        <div class="grid grid-cols-1 sm:grid-cols-2 gap-3">
                            <!-- Temperature Card (read-only summary) -->
                            <div class="p-4 bg-gradient-to-br from-orange-100 to-orange-50 rounded-lg border border-orange-300">
                                <p class="text-sm font-semibold text-orange-900 mb-2">🌡️ Temperature</p>
                                <p class="text-2xl font-bold text-orange-600">{selectedPlant.temp_min ?? '—'}°C - {selectedPlant.temp_max ?? '—'}°C</p>
                                <p class="text-xs text-orange-700 mt-2">
                                    {#if selectedPlant.temp_min !== null && selectedPlant.temp_max !== null}
                                        {#if selectedPlant.temp_min <= 18 && selectedPlant.temp_max >= 25}
                                            Wide range - Adaptable plant
                                        {:else if selectedPlant.temp_min >= 20}
                                            Warm-loving plant
                                        {:else}
                                            Cool-preferring plant
                                        {/if}
                                    {/if}
                                </p>
                            </div>

                            <!-- Humidity Card -->
                            <div class="p-4 bg-gradient-to-br from-cyan-100 to-cyan-50 rounded-lg border border-cyan-300">
                                <p class="text-sm font-semibold text-cyan-900 mb-2">💨 Humidity</p>
                                <p class="text-2xl font-bold text-cyan-600">{selectedPlant.humidity_min ?? '—'}% - {selectedPlant.humidity_max ?? '—'}%</p>
                                <p class="text-xs text-cyan-700 mt-2">
                                    {#if selectedPlant.humidity_max !== null}
                                        {#if selectedPlant.humidity_max > 70}
                                            High humidity preferred
                                        {:else if selectedPlant.humidity_min < 40}
                                            Prefers dry air
                                        {:else}
                                            Moderate humidity
                                        {/if}
                                    {/if}
                                </p>
                            </div>

                            <!-- Moisture Card -->
                            <div class="p-4 bg-gradient-to-br from-green-100 to-green-50 rounded-lg border border-green-300">
                                <p class="text-sm font-semibold text-green-900 mb-2">💧 Moisture</p>
                                <p class="text-2xl font-bold text-green-600">{selectedPlant.moisture_min}-{selectedPlant.moisture_max}%</p>
                                <p class="text-xs text-green-700 mt-2">
                                    {#if selectedPlant.moisture_max !== undefined}
                                        {#if selectedPlant.moisture_max > 60}
                                            Requires frequent watering
                                        {:else if selectedPlant.moisture_min < 30}
                                            Drought-tolerant plant
                                        {:else}
                                            Moderate watering
                                        {/if}
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
                            {#if selectedPlant.temp_min !== null && selectedPlant.temp_max !== null}
                                <br><br>
                                Your current environment should ideally be between <strong>{selectedPlant.temp_min}°C - {selectedPlant.temp_max}°C</strong> 
                                with <strong>{selectedPlant.humidity_min ?? '—'}% - {selectedPlant.humidity_max ?? '—'}%</strong> humidity for optimal growth.
                            {/if}
                        </p>
                    </div>
                </div>
            </div>

            <!-- Status messages -->
            {#if error}
                <div class="text-sm text-red-600">{error}</div>
            {/if}
            {#if success}
                <div class="text-sm text-green-600">{success}</div>
            {/if}

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
