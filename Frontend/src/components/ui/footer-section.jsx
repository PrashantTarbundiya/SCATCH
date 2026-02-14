import React from 'react';
import { InstagramIcon, LinkedinIcon } from 'lucide-react';

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
		label: 'Support',
		links: [
			{ title: 'My Orders', href: '/profile' },
			{ title: 'Track Order', href: '/profile' },
			{ title: 'Shopping Cart', href: '/cart' },
			{ title: 'Wishlist', href: '/shop?filter=wishlist&sortBy=newest' },
		],
	},
	{
		label: 'Company',
		links: [
			{ title: 'About Scatch', href: '/' },
			{ title: 'Contact Us', href: '#contact' },
			{ title: 'Privacy Policy', href: '/privacy' },
			{ title: 'Terms of Service', href: '/terms' },
		],
	},
];

export function Footer() {
	return (
		<footer className="w-full flex flex-col items-center justify-center border-t-4 border-black bg-white px-6 py-12 lg:py-16 font-sans">
			<div className="w-full max-w-7xl grid gap-10 md:grid-cols-2 lg:grid-cols-4 xl:gap-8 text-left">
				{/* Section 1: Brand */}
				<div className="space-y-6">
					<span className="text-3xl font-black uppercase border-4 border-black p-3 shadow-neo bg-black text-white inline-block transform -rotate-2">
						Scatch
					</span>
					<p className="text-black mt-4 text-sm font-bold max-w-xs leading-relaxed uppercase border-l-4 border-black pl-4">
						Elevate your style with the raw power of Neo-Brutalism. Bold choices for bold people.
					</p>
					<div className="flex gap-4 mt-6">
						<a href="https://www.instagram.com/prashanttarbundiya/" target="_blank" rel="noopener noreferrer" className="w-10 h-10 flex items-center justify-center border-2 border-black bg-white hover:bg-black hover:text-white transition-all shadow-neo-sm hover:shadow-none hover:translate-x-[2px] hover:translate-y-[2px]">
							<InstagramIcon className="size-5" />
						</a>
						<a href="mailto:scatchotp@gmail.com" className="w-10 h-10 flex items-center justify-center border-2 border-black bg-white hover:bg-black hover:text-white transition-all shadow-neo-sm hover:shadow-none hover:translate-x-[2px] hover:translate-y-[2px]">
							<i className="ri-mail-send-fill text-xl"></i>
						</a>
						<a href="https://www.linkedin.com/in/prashant-tarbundiya/" target="_blank" rel="noopener noreferrer" className="w-10 h-10 flex items-center justify-center border-2 border-black bg-white hover:bg-black hover:text-white transition-all shadow-neo-sm hover:shadow-none hover:translate-x-[2px] hover:translate-y-[2px]">
							<LinkedinIcon className="size-5" />
						</a>
					</div>
				</div>

				{/* Section 2: Shop */}
				<div>
					<h3 className="text-lg font-black text-black uppercase tracking-wider mb-6 bg-yellow-300 border-2 border-black shadow-neo-sm inline-block px-2 py-1 transform -rotate-1">
						{footerLinks[0].label}
					</h3>
					<ul className="space-y-3">
						{footerLinks[0].links.map((link) => (
							<li key={link.title}>
								<a
									href={link.href}
									className="text-black font-bold text-sm uppercase hover:underline decoration-2 underline-offset-2 hover:text-blue-600 transition-colors flex items-center gap-2 group"
								>
									<span className="w-2 h-2 bg-black scale-0 group-hover:scale-100 transition-transform duration-200"></span>
									{link.title}
								</a>
							</li>
						))}
					</ul>
				</div>

				{/* Section 3: Support */}
				<div>
					<h3 className="text-lg font-black text-black uppercase tracking-wider mb-6 bg-blue-300 border-2 border-black shadow-neo-sm inline-block px-2 py-1 transform rotate-1">
						{footerLinks[1].label}
					</h3>
					<ul className="space-y-3">
						{footerLinks[1].links.map((link) => (
							<li key={link.title}>
								<a
									href={link.href}
									className="text-black font-bold text-sm uppercase hover:underline decoration-2 underline-offset-2 hover:text-purple-600 transition-colors flex items-center gap-2 group"
								>
									<span className="w-2 h-2 bg-black scale-0 group-hover:scale-100 transition-transform duration-200"></span>
									{link.title}
								</a>
							</li>
						))}
					</ul>
				</div>

				{/* Section 4: Company/Contact */}
				<div>
					<h3 className="text-lg font-black text-black uppercase tracking-wider mb-6 bg-red-300 border-2 border-black shadow-neo-sm inline-block px-2 py-1 transform -rotate-1">
						{footerLinks[2].label}
					</h3>
					<ul className="space-y-3">
						{footerLinks[2].links.map((link) => (
							<li key={link.title}>
								<a
									href={link.href}
									className="text-black font-bold text-sm uppercase hover:underline decoration-2 underline-offset-2 hover:text-green-600 transition-colors flex items-center gap-2 group"
								>
									<span className="w-2 h-2 bg-black scale-0 group-hover:scale-100 transition-transform duration-200"></span>
									{link.title}
								</a>
							</li>
						))}
						{/* Extra Contact Details */}
						<li className="pt-2 mt-2 border-t-2 border-black border-dashed">
							<a href="tel:+917984104910" className="text-black font-bold text-xs uppercase flex items-center gap-1 hover:text-gray-600">
								<i className="ri-phone-fill"></i> +91 7984104910
							</a>
						</li>
						<li>
							<span className="text-black font-bold text-xs uppercase flex items-center gap-1">
								<i className="ri-map-pin-fill"></i> Ahmedabad, India
							</span>
						</li>
					</ul>
				</div>
			</div>

			<div className="w-full max-w-7xl mt-16 pt-8 border-t-4 border-black flex flex-col md:flex-row items-center justify-between gap-4">
				<p className="text-black font-black uppercase text-sm">
					© {new Date().getFullYear()} Scatch. All rights reserved.
				</p>
				<p className="text-black font-bold text-xs uppercase flex items-center gap-2">
					Made with <span className="text-red-500 text-lg">♥</span> in India
				</p>
			</div>
		</footer>
	);
}




