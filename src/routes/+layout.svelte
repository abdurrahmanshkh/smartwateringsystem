<script>
	import '../app.css';
	import { Card, Navbar, NavBrand, NavLi, NavUl, NavHamburger, Footer, FooterCopyright } from 'flowbite-svelte';
	import { onMount } from 'svelte';
	
	let scrolled = false;
	
	onMount(() => {
		const handleScroll = () => {
			scrolled = window.scrollY > 20;
		};
		
		window.addEventListener('scroll', handleScroll);
		return () => window.removeEventListener('scroll', handleScroll);
	});
</script>

<div class="min-h-screen flex flex-col bg-gradient-to-br from-green-50 via-blue-50 to-teal-50">
	<Navbar 
		let:hidden 
		let:toggle 
		class="sticky top-0 z-50 transition-all duration-300 {scrolled ? 'shadow-lg bg-white/95 backdrop-blur-sm' : 'bg-white/80'}"
	>
		<NavBrand href="/">
			<span class="flex items-center gap-2">
				<span class="text-3xl">🌱</span>
				<span class="self-center whitespace-nowrap text-xl font-bold bg-gradient-to-r from-green-600 to-teal-600 bg-clip-text text-transparent">
					Smart Plant Watering System
				</span>
			</span>
		</NavBrand>
		<NavHamburger on:click={toggle} />
		<NavUl {hidden} class="gap-4">
			<NavLi href="/" active={true} class="font-semibold">Dashboard</NavLi>
			<NavLi href="/plants" class="font-semibold">Plant Database</NavLi>
			<NavLi href="/analytics" class="font-semibold">Analytics</NavLi>
			<NavLi href="/settings" class="font-semibold">Settings</NavLi>
		</NavUl>
	</Navbar>

	<main class="flex-1 container mx-auto p-4 md:p-6">
		<slot />
	</main>

	<Footer footerType="logo" class="bg-gradient-to-r from-green-600 to-teal-600 text-white">
		<div class="w-full text-center">
			<FooterCopyright 
				href="/" 
				by="Smart Plant Watering System" 
				year={2024}
				class="text-white/90"
			/>
			<span class="block text-sm text-white/80 mt-2">
				Powered by IoT & AI • Sustainable Gardening
			</span>
		</div>
	</Footer>
</div>

<style>
	:global(body) {
		overflow-x: hidden;
	}
</style>
