import { Link } from 'react-router-dom';
import { Instagram, Facebook, Twitter } from 'lucide-react';

export default function Footer() {
  return (
    <footer className="bg-ink-900 text-ivory-100 mt-24">
      <div className="container-luxury py-16">
        <div className="grid grid-cols-1 md:grid-cols-4 gap-12">
          {/* Brand */}
          <div className="md:col-span-1">
            <h3 className="font-serif text-2xl font-light tracking-widest mb-4">NEXAMART</h3>
            <p className="text-sm text-ivory-200/60 leading-relaxed">
              A premium destination for refined lifestyle products. Curated essentials for modern luxury living.
            </p>
          </div>

          {/* Shop */}
          <div>
            <h4 className="text-2xs font-medium uppercase tracking-widest text-champagne-300 mb-4">Shop</h4>
            <ul className="space-y-2 text-sm text-ivory-200/60">
              <li><Link to="/shop" className="hover:text-ivory-50 transition-colors">All Products</Link></li>
              <li><Link to="/categories" className="hover:text-ivory-50 transition-colors">Categories</Link></li>
              <li><Link to="/shop?filter=featured" className="hover:text-ivory-50 transition-colors">Featured</Link></li>
              <li><Link to="/shop?filter=new" className="hover:text-ivory-50 transition-colors">New Arrivals</Link></li>
            </ul>
          </div>

          {/* Company */}
          <div>
            <h4 className="text-2xs font-medium uppercase tracking-widest text-champagne-300 mb-4">Company</h4>
            <ul className="space-y-2 text-sm text-ivory-200/60">
              <li><Link to="/about" className="hover:text-ivory-50 transition-colors">About Us</Link></li>
              <li><Link to="/contact" className="hover:text-ivory-50 transition-colors">Contact</Link></li>
              <li><Link to="/admin/login" className="hover:text-ivory-50 transition-colors">Admin Portal</Link></li>
            </ul>
          </div>

          {/* Connect */}
          <div>
            <h4 className="text-2xs font-medium uppercase tracking-widest text-champagne-300 mb-4">Connect</h4>
            <div className="flex gap-4">
              <a href="https://www.instagram.com/nexamart02?igsh=MW4wbThzeGJnOWs4Ng==&igsi=MW4wbThzeGJnOWs4Ng==" className="text-ivory-200/60 hover:text-ivory-50 transition-colors" aria-label="Instagram">
                <Instagram size={18} />
              </a>
              <a href="https://www.facebook.com/profile.php?id=61593478889320" className="text-ivory-200/60 hover:text-ivory-50 transition-colors" aria-label="Facebook">
                <Facebook size={18} />
              </a>
             
            </div>
            <p className="text-sm text-ivory-200/40 mt-4">Free delivery on all orders</p>
          </div>
        </div>

        <div className="border-t border-ivory-200/10 mt-12 pt-8 flex flex-col md:flex-row justify-between items-center gap-4">
          <p className="text-2xs text-ivory-200/40 tracking-widest uppercase">
            © {new Date().getFullYear()} NexaMart. All rights reserved.
          </p>
        </div>
      </div>
    </footer>
  );
}
