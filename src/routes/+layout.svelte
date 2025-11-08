<script>
	import '../app.css';
	import { Navbar, NavBrand, NavLi, NavUl, NavHamburger, Footer, FooterCopyright } from 'flowbite-svelte';
	import { onMount } from 'svelte';
	import { page } from '$app/stores';
	
	let scrolled = false;
	
	onMount(() => {
		const handleScroll = () => {
			scrolled = window.scrollY > 10;
		};
		
		window.addEventListener('scroll', handleScroll);
		return () => window.removeEventListener('scroll', handleScroll);
	});
</script>

<div class="min-h-screen flex flex-col bg-gradient-to-br from-green-50 via-blue-50 to-teal-50">
	<Navbar 
		let:hidden 
		let:toggle 
		class="sticky top-0 z-50 transition-all duration-300 border-b border-gray-200 {scrolled ? 'shadow-md bg-white backdrop-blur-sm' : 'bg-white/90'}"
		padding="px-4 py-2.5"
	>
		<NavBrand href="/" class="flex items-center gap-2">
			<span class="text-2xl">🌱</span>
			<span class="self-center whitespace-nowrap text-lg md:text-xl font-bold bg-gradient-to-r from-green-600 to-teal-600 bg-clip-text text-transparent">
				Smart Plant Watering System
			</span>
		</NavBrand>
		<NavHamburger on:click={toggle} />
		<NavUl {hidden} class="gap-1 md:gap-2">
			<NavLi href="/" active={$page.url.pathname === '/'} class="font-medium text-sm md:text-base">Dashboard</NavLi>
			<NavLi href="/plants" active={$page.url.pathname === '/plants'} class="font-medium text-sm md:text-base">Plant Database</NavLi>
			<NavLi href="/analytics" active={$page.url.pathname === '/analytics'} class="font-medium text-sm md:text-base">Analytics</NavLi>
		</NavUl>
	</Navbar>

	<main class="flex-1 w-full">
		<div class="container mx-auto px-3 py-4 md:px-4 md:py-6 max-w-7xl">
			<slot />
		</div>
	</main>

	<Footer class="bg-gradient-to-r from-green-600 to-teal-600 text-white mt-auto">
		<div class="w-full text-center py-4">
			<FooterCopyright 
				href="/" 
				by="Smart Plant Watering System" 
				year={2024}
				class="text-white/90 text-sm"
			/>
			<span class="block text-xs text-white/80 mt-1">
				Powered by IoT & AI • Sustainable Gardening
			</span>
		</div>
	</Footer>
</div>

<style>
	:global(body) {
		overflow-x: hidden;
		margin: 0;
		padding: 0;
	}
	
	:global(*) {
		box-sizing: border-box;
	}
</style>
