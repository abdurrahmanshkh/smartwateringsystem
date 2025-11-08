<script>
    import Soilmoisture from './soilmoisture.svelte';
    import Waterpump from './waterpump.svelte';
    import { Alert, Card, Button } from 'flowbite-svelte';
    import { InfoCircleSolid } from 'flowbite-svelte-icons';
    import { Range, Label } from 'flowbite-svelte';
    import { onMount } from 'svelte';

    let moistureLevel = 0;
    let pumpStatus = 'OFF';
    let systemStatus = 0; // 0 = Off, 1 = On
    let threshold = 250; // Default threshold value - calibrated for new sensor
    let updating = false;
    let error = '';

    // Call function on mount
    onMount(() => {
        fetchInitialData();
        setInterval(fetchLatestData, 10000); // Increased to 10 seconds
    });

    // Fetch initial data including system status and threshold
    async function fetchInitialData() {
        const url = 'https://api.thingspeak.com/channels/2736648/feeds.json?results=1';
        try {
            const response = await fetch(url);
            if (!response.ok) throw new Error('Network response was not ok');
            const data = await response.json();
            if (data.feeds && data.feeds.length > 0) {
                const feed = data.feeds[0];
                moistureLevel = parseInt(feed.field1) || 0;
                pumpStatus = feed.field2 === '1' ? 'ON' : 'OFF';
                systemStatus = parseInt(feed.field3) || 0;
                threshold = parseInt(feed.field4) || 250; // Updated default
                error = '';
                console.log('Initial data loaded:', { moistureLevel, pumpStatus, systemStatus, threshold });
            }
        } catch (error) {
            console.error('Error fetching initial data:', error);
            error = 'Failed to fetch initial data. Please check your connection.';
        }
    }

    async function fetchLatestData() {
        const url = 'https://api.thingspeak.com/channels/2736648/feeds.json?results=1';
        try {
            const response = await fetch(url);
            if (!response.ok) throw new Error('Network response was not ok');
            const data = await response.json();
            if (data.feeds && data.feeds.length > 0) {
                const feed = data.feeds[0];
                moistureLevel = parseInt(feed.field1) || 0;
                pumpStatus = feed.field2 === '1' ? 'ON' : 'OFF';
                error = '';
            }
        } catch (error) {
            console.error('Error fetching latest data:', error);
            error = 'Failed to fetch latest data.';
        }
    }

    async function updateSystemSettings() {
        updating = true;
        error = '';
        
        // Note: We only update fields 3 and 4 (systemStatus and threshold)
        // Fields 1 and 2 are updated by the Arduino
        const apiKey = 'CV5WWIPTAVEW6RMD';
        const url = `https://api.thingspeak.com/update?api_key=${apiKey}&field3=${systemStatus}&field4=${threshold}`;

        try {
            const response = await fetch(url);
            const data = await response.text();
            
            console.log('ThingSpeak update response:', data);
            
            if (data !== '0') {
                console.log('System settings updated successfully. Entry ID:', data);
                error = '';
                // Refresh data to confirm update
                setTimeout(fetchInitialData, 2000);
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
        systemStatus = systemStatus === 1 ? 0 : 1;
        updateSystemSettings();
    }

    function updateThreshold() {
        updateSystemSettings();
    }
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
        <Soilmoisture {moistureLevel} />
        <Waterpump {pumpStatus} />
        <Card class="mt-2 grid min-w-full grid-cols-3 items-center gap-4 bg-blue-100 md:mt-0">
            <div class="col-span-2 border-blue-400 text-xl font-bold text-blue-900">
                System Status: {systemStatus === 1 ? 'ON' : 'OFF'}
            </div>
            {#if updating}
                <Button color="blue" disabled>Updating...</Button>
            {:else}
                <Button on:click={toggleSystemStatus} color="blue">
                    {systemStatus === 1 ? 'Turn System Off' : 'Turn System On'}
                </Button>
            {/if}
        </Card>
        <Card class="mt-2 grid min-w-full grid-cols-3 items-center gap-4 bg-red-100 md:mt-0">
            <Label class="col-span-2">
                Moisture Threshold
                <Range id="range-minmax" min="70" max="430" bind:value={threshold} />
                <p>Current Value: {threshold}</p>
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
