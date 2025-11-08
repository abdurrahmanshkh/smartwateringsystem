<script>
    import Soilmoisture from './soilmoisture.svelte';
    import Waterpump from './waterpump.svelte';
    import { Alert, Card, Button } from 'flowbite-svelte';
    import { InfoCircleSolid } from 'flowbite-svelte-icons';
    import { Range, Label } from 'flowbite-svelte';
    import { onMount } from 'svelte';

    // Centralized data store
    let channelData = {
        moistureLevel: 0,
        pumpStatus: 'OFF',
        systemStatus: 0,
        threshold: 250,
        feeds: []
    };
    
    let updating = false;
    let error = '';

    // Call function on mount
    onMount(() => {
        fetchAllData();
        setInterval(fetchAllData, 10000); // Single API call every 10 seconds
    });

    // Fetch all data including historical feeds
    async function fetchAllData() {
        const url = 'https://api.thingspeak.com/channels/2736648/feeds.json?results=10';
        try {
            const response = await fetch(url);
            if (!response.ok) throw new Error('Network response was not ok');
            const data = await response.json();
            
            if (data.feeds && data.feeds.length > 0) {
                const latestFeed = data.feeds[data.feeds.length - 1]; // Get the latest entry
                
                // Update centralized data
                channelData = {
                    moistureLevel: parseInt(latestFeed.field1) || 0,
                    pumpStatus: latestFeed.field2 === '1' ? 'ON' : 'OFF',
                    systemStatus: parseInt(latestFeed.field3) || 0,
                    threshold: parseInt(latestFeed.field4) || 250,
                    feeds: data.feeds
                };
                
                error = '';
                console.log('Data updated successfully');
            }
        } catch (error) {
            console.error('Error fetching data:', error);
            error = 'Failed to fetch data. Please check your connection.';
        }
    }

    async function updateSystemSettings() {
        updating = true;
        error = '';
        
        // Note: We only update fields 3 and 4 (systemStatus and threshold)
        const apiKey = 'CV5WWIPTAVEW6RMD';
        const url = `https://api.thingspeak.com/update?api_key=${apiKey}&field3=${channelData.systemStatus}&field4=${channelData.threshold}`;

        try {
            const response = await fetch(url);
            const data = await response.text();
            
            console.log('ThingSpeak update response:', data);
            
            if (data !== '0') {
                console.log('System settings updated successfully. Entry ID:', data);
                error = '';
                // Refresh data to confirm update
                setTimeout(fetchAllData, 2000);
            } else {
                throw new Error('ThingSpeak update failed - rate limiting or invalid API key');
            }
        } catch (error) {
            console.error('Error updating system settings:', error);
            error = 'Failed to update system settings. ThingSpeak may be rate limiting (1 update every 15s). Please wait and try again.';
        } finally {
            updating = false;
        }
    }

    function toggleSystemStatus() {
        channelData.systemStatus = channelData.systemStatus === 1 ? 0 : 1;
        updateSystemSettings();
    }

    function updateThreshold() {
        updateSystemSettings();
    }

    // Computed properties for reactive updates
    $: currentMoisture = channelData.moistureLevel;
    $: currentPumpStatus = channelData.pumpStatus;
    $: currentSystemStatus = channelData.systemStatus;
    $: currentThreshold = channelData.threshold;
    $: currentFeeds = channelData.feeds;
</script>

<main class="max-w-full space-y-2 px-2">
    {#if error}
        <Card padding="none" class="max-w-full border-red-200">
            <Alert color="red" dismissable on:dismiss={() => error = ''}>
                <InfoCircleSolid slot="icon" class="h-5 w-5" />
                {error}
            </Alert>
        </Card>
    {:else}
        <Card padding="none" class="max-w-full border-green-200">
            <Alert color="green" dismissable>
                <InfoCircleSolid slot="icon" class="h-5 w-5" />
                All systems are currently functional
            </Alert>
        </Card>
    {/if}
    
    <div class="gap-2 md:grid md:grid-cols-2">
        <Soilmoisture moistureLevel={currentMoisture} feeds={currentFeeds} />
        <Waterpump pumpStatus={currentPumpStatus} feeds={currentFeeds} />
        <Card class="mt-2 grid min-w-full grid-cols-3 items-center gap-4 bg-blue-100 md:mt-0">
            <div class="col-span-2 border-blue-400 text-xl font-bold text-blue-900">
                System Status: {currentSystemStatus === 1 ? 'ON' : 'OFF'}
            </div>
            {#if updating}
                <Button color="blue" disabled>Updating...</Button>
            {:else}
                <Button on:click={toggleSystemStatus} color="blue">
                    {currentSystemStatus === 1 ? 'Turn System Off' : 'Turn System On'}
                </Button>
            {/if}
        </Card>
        <Card class="mt-2 grid min-w-full grid-cols-3 items-center gap-4 bg-red-100 md:mt-0">
            <Label class="col-span-2">
                Moisture Threshold
                <Range id="range-minmax" min="70" max="430" bind:value={currentThreshold} />
                <p>Current Value: {currentThreshold}</p>
                <p class="text-xs text-gray-600">
                    Higher values = drier soil will trigger watering<br>
                    Sensor Range: 70 (Wet) to 430 (Dry)
                </p>
            </Label>
            {#if updating}
                <Button color="red" disabled>Updating...</Button>
            {:else}
                <Button on:click={updateThreshold} color="red">Update Threshold</Button>
            {/if}
        </Card>
    </div>
</main>
