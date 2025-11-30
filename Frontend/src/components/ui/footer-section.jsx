import React from 'react';
import { motion, useReducedMotion } from 'motion/react';
import { FacebookIcon, FrameIcon, InstagramIcon, LinkedinIcon, YoutubeIcon } from 'lucide-react';

const footerLinks = [
	{
		label: 'Shop',
		links: [
			{ title: 'All Products', href: '/shop' },
			{ title: 'New Arrivals', href: '/shop?filter=newCollection&sortBy=newest' },
			{ title: 'Best Sellers', href: '/shop?sortBy=popular' },
			{ title: 'Sale', href: '/shop?filter=discounted&sortBy=popular' },
		],
	},
	{
		label: 'Customer Service',
		links: [
			{ title: 'My Orders', href: '/profile' },
			{ title: 'Track Order', href: '/profile' },
			{ title: 'Shopping Cart', href: '/cart' },
			{ title: 'Wishlist', href: '/shop?filter=wishlist&sortBy=newest' },
		],
	},
	{
		label: 'About',
		links: [
			{ title: 'About Scatch', href: '/' },
			{ title: 'Contact Us', href: '#contact' },
			{ title: 'Privacy Policy', href: '/privacy' },
			{ title: 'Terms of Service', href: '/terms' },
		],
	},
	{
		label: 'Contact',
		links: [
			{ title: 'Email: scatchotp@gmail.com', href: 'mailto:scatchotp@gmail.com' },
			{ title: 'Phone: +91 7984104910', href: 'tel:+917984104910' },
			{ title: 'Address: Ahmedabad, India', href: '#' },
			{ title: 'Follow Us', href: 'https://www.instagram.com/prashanttarbundiya/', icon: InstagramIcon },
		],
	},
];

function AnimatedContainer({ className, delay = 0.1, children }) {
	const shouldReduceMotion = useReducedMotion();

	if (shouldReduceMotion) {
		return children;
	}

	return (
		<motion.div
			initial={{ filter: 'blur(4px)', translateY: -8, opacity: 0 }}
			whileInView={{ filter: 'blur(0px)', translateY: 0, opacity: 1 }}
			viewport={{ once: true }}
			transition={{ delay, duration: 0.8 }}
			className={className}
		>
			{children}
		</motion.div>
	);
}

export function Footer() {
	return (
		<footer className="md:rounded-t-6xl relative w-full max-w-6xl mx-auto flex flex-col items-center justify-center rounded-t-4xl border-t bg-[radial-gradient(35%_128px_at_50%_0%,theme(backgroundColor.white/8%),transparent)] px-6 py-12 lg:py-16">
			<div className="bg-foreground/20 absolute top-0 right-1/2 left-1/2 h-px w-1/3 -translate-x-1/2 -translate-y-1/2 rounded-full blur" />

			<div className="grid w-full gap-8 xl:grid-cols-3 xl:gap-8">
				<AnimatedContainer className="space-y-4">
					<FrameIcon className="size-8 text-gray-900 dark:text-purple-100" />
					<p className="text-gray-900 dark:text-purple-100 mt-8 text-sm md:mt-0">
						© {new Date().getFullYear()} Scatch. All rights reserved.
					</p>
				</AnimatedContainer>

				<div className="mt-10 grid grid-cols-2 gap-8 md:grid-cols-4 xl:col-span-2 xl:mt-0">
					{footerLinks.map((section, index) => (
						<AnimatedContainer key={section.label} delay={0.1 + index * 0.1}>
							<div className="mb-10 md:mb-0">
								<h3 className="text-xs font-semibold text-gray-900 dark:text-gray-100">{section.label}</h3>
								<ul className="text-gray-800 dark:text-purple-200 mt-4 space-y-2 text-sm">
									{section.links.map((link) => (
										<li key={link.title}>
											<a
												href={link.href}
												className="hover:text-blue-500 dark:hover:text-blue-300 inline-flex items-center transition-all duration-300"
											>
												{link.icon && <link.icon className="me-1 size-4" />}
												{link.title}
											</a>
										</li>
									))}
								</ul>
							</div>
						</AnimatedContainer>
					))}
				</div>
			</div>
		</footer>
	);
}




