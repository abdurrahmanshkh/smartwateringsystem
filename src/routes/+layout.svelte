<script>
	import '../app.css';
	import { Navbar, NavBrand, NavHamburger, Button, Input, Footer, FooterCopyright, Card } from 'flowbite-svelte';
  	import { SearchOutline } from 'flowbite-svelte-icons';
</script>

<header class="p-2">
	<Card class="max-w-full text-center md:text-xl font-bold text-gray-800 bg-gray-200 border-gray-300">
		Smart Plant Watering System
	</Card>
</header>

<main style="min-height: 81.5vh;" class="">
	<slot/>
</main>

<footer class="p-2">
	<Card class="max-w-full text-sm text-center font-medium text-gray-800 bg-gray-200 border-gray-300" padding="sm">
		© 2024 Smart Plant Watering System - All Rights Reserved.
	</Card>
</footer>
