import { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import { ArrowRight, Truck, Shield, Sparkles, Headphones } from 'lucide-react';
import { supabase } from '@/lib/supabase';
import type { Product, Category, SiteContent } from '@/types';
import ProductCard from '@/components/storefront/ProductCard';

const HERO_IMAGE = 'https://images.pexels.com/photos/6825477/pexels-photo-6825477.jpeg?auto=compress&cs=tinysrgb&w=1920';
const PROMO_IMAGE = 'https://images.pexels.com/photos/9267588/pexels-photo-9267588.jpeg?auto=compress&cs=tinysrgb&w=1920';

export default function HomePage() {
  const [featuredProducts, setFeaturedProducts] = useState<Product[]>([]);
  const [newArrivals, setNewArrivals] = useState<Product[]>([]);
  const [categories, setCategories] = useState<Category[]>([]);
  const [heroImage, setHeroImage] = useState(HERO_IMAGE);
  const [promoImage, setPromoImage] = useState(PROMO_IMAGE);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    async function fetchData() {
      try {
        const [featuredRes, newRes, catRes, contentRes] = await Promise.all([
          supabase
            .from('products')
            .select('*, category:categories(*)')
            .eq('active', true)
            .eq('featured', true)
            .order('created_at', { ascending: false })
            .limit(8),
          supabase
            .from('products')
            .select('*, category:categories(*)')
            .eq('active', true)
            .eq('new_arrival', true)
            .order('created_at', { ascending: false })
            .limit(4),
          supabase
            .from('categories')
            .select('*')
            .eq('active', true)
            .order('name')
            .limit(6),
          supabase.from('site_content').select('*').in('key', ['hero_image', 'promo_banner']),
        ]);

        setFeaturedProducts(featuredRes.data ?? []);
        setNewArrivals(newRes.data ?? []);
        setCategories(catRes.data ?? []);

        const content = contentRes.data as SiteContent[] | null;
        if (content) {
          const hero = content.find((c) => c.key === 'hero_image');
          if (hero?.image_url) setHeroImage(hero.image_url);
          const promo = content.find((c) => c.key === 'promo_banner');
          if (promo?.image_url) setPromoImage(promo.image_url);
        }
      } catch (err) {
        console.error('Failed to load homepage data:', err);
      } finally {
        setLoading(false);
      }
    }
    fetchData();
  }, []);

  return (
    <div className="animate-fade-in">
      {/* Hero Section */}
      <section className="relative h-[80vh] min-h-[500px] flex items-center justify-center overflow-hidden">
        <div className="absolute inset-0">
          <img src={heroImage} alt="NexaMart" className="w-full h-full object-cover" />
          <div className="absolute inset-0 bg-ivory-50/30" />
        </div>
        <div className="relative z-10 text-center px-4 max-w-2xl">
          <p className="eyebrow mb-4">Modern Luxury Living</p>
          <h1 className="font-serif text-4xl md:text-6xl lg:text-7xl font-light text-ink-900 leading-tight mb-6">
            Curated Essentials<br />for the Refined Life
          </h1>
          <p className="text-sm md:text-base text-ink-600 leading-relaxed mb-8 max-w-md mx-auto">
            Discover a thoughtfully selected collection of premium lifestyle products,
            designed for those who appreciate understated elegance.
          </p>
          <Link to="/shop" className="btn-primary">
            Shop Now
            <ArrowRight size={14} />
          </Link>
        </div>
      </section>

      {/* Featured Categories */}
      <section className="container-luxury py-20">
        <div className="text-center mb-12">
          <p className="eyebrow mb-3">Explore</p>
          <h2 className="heading-display text-3xl md:text-4xl text-ink-900">Featured Categories</h2>
        </div>
        {loading ? (
          <div className="text-center text-ink-400 text-sm">Loading categories...</div>
        ) : categories.length === 0 ? (
          <div className="text-center text-ink-400 text-sm">No categories yet.</div>
        ) : (
          <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-6 gap-4">
            {categories.map((cat) => (
              <Link key={cat.id} to={`/shop?category=${cat.slug}`} className="group block">
                <div className="aspect-square overflow-hidden bg-ivory-100 mb-3">
                  {cat.image_url ? (
                    <img
                      src={cat.image_url}
                      alt={cat.name}
                      className="w-full h-full object-cover transition-transform duration-700 group-hover:scale-105"
                    />
                  ) : (
                    <div className="w-full h-full flex items-center justify-center text-ink-300 text-xs">
                      {cat.name}
                    </div>
                  )}
                </div>
                <p className="text-center text-xs font-medium uppercase tracking-widest text-ink-700 group-hover:text-champagne-600 transition-colors">
                  {cat.name}
                </p>
              </Link>
            ))}
          </div>
        )}
      </section>

      {/* Featured Products */}
      <section className="container-luxury py-20 border-t border-ink-100">
        <div className="flex items-center justify-between mb-12">
          <div>
            <p className="eyebrow mb-3">Selected</p>
            <h2 className="heading-display text-3xl md:text-4xl text-ink-900">Featured Products</h2>
          </div>
          <Link to="/shop?filter=featured" className="hidden md:flex items-center gap-2 text-2xs uppercase tracking-widest text-ink-600 hover:text-ink-900 transition-colors">
            View All <ArrowRight size={14} />
          </Link>
        </div>
        {loading ? (
          <div className="text-center text-ink-400 text-sm">Loading products...</div>
        ) : featuredProducts.length === 0 ? (
          <div className="text-center text-ink-400 text-sm">No featured products yet.</div>
        ) : (
          <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-6">
            {featuredProducts.map((product) => (
              <ProductCard key={product.id} product={product} />
            ))}
          </div>
        )}
      </section>

      {/* Promotional Banner */}
      <section className="relative h-[50vh] min-h-[400px] overflow-hidden">
        <div className="absolute inset-0">
          <img src={promoImage} alt="Promotion" className="w-full h-full object-cover" />
          <div className="absolute inset-0 bg-ink-900/40" />
        </div>
        <div className="relative z-10 h-full flex items-center justify-center text-center px-4">
          <div className="max-w-lg">
            <p className="eyebrow text-champagne-200 mb-4">Limited Time</p>
            <h2 className="font-serif text-3xl md:text-5xl font-light text-ivory-50 leading-tight mb-6">
              The Art of<br />Refined Living
            </h2>
            <p className="text-sm text-ivory-100/80 mb-8 max-w-sm mx-auto">
              Explore our curated collection of premium lifestyle products at exceptional value.
            </p>
            <Link to="/shop" className="btn-secondary bg-ivory-50/95 border-ivory-50 text-ink-900 hover:bg-ink-900 hover:text-ivory-50 hover:border-ink-900">
              Explore Collection
              <ArrowRight size={14} />
            </Link>
          </div>
        </div>
      </section>

      {/* New Arrivals */}
      <section className="container-luxury py-20">
        <div className="flex items-center justify-between mb-12">
          <div>
            <p className="eyebrow mb-3">Just In</p>
            <h2 className="heading-display text-3xl md:text-4xl text-ink-900">New Arrivals</h2>
          </div>
          <Link to="/shop?filter=new" className="hidden md:flex items-center gap-2 text-2xs uppercase tracking-widest text-ink-600 hover:text-ink-900 transition-colors">
            View All <ArrowRight size={14} />
          </Link>
        </div>
        {loading ? (
          <div className="text-center text-ink-400 text-sm">Loading products...</div>
        ) : newArrivals.length === 0 ? (
          <div className="text-center text-ink-400 text-sm">No new arrivals yet.</div>
        ) : (
          <div className="grid grid-cols-2 md:grid-cols-4 gap-6">
            {newArrivals.map((product) => (
              <ProductCard key={product.id} product={product} />
            ))}
          </div>
        )}
      </section>

      {/* Why Choose NexaMart */}
      <section className="bg-ink-900 text-ivory-100 py-20">
        <div className="container-luxury">
          <div className="text-center mb-16">
            <p className="text-2xs font-medium uppercase tracking-widest text-champagne-300 mb-3">Why Choose Us</p>
            <h2 className="heading-display text-3xl md:text-4xl text-ivory-50">The NexaMart Difference</h2>
          </div>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-12">
            {[
              { icon: Truck, title: 'Free Delivery', desc: 'Complimentary shipping on every order, no minimum spend.' },
              { icon: Shield, title: 'Quality Assured', desc: 'Each product is carefully curated and quality-checked.' },
              { icon: Sparkles, title: 'Premium Selection', desc: 'Thoughtfully chosen products for the discerning customer.' },
              { icon: Headphones, title: 'Dedicated Support', desc: 'Personalized customer service for all your needs.' },
            ].map((feature) => {
              const Icon = feature.icon;
              return (
                <div key={feature.title} className="text-center">
                  <div className="inline-flex items-center justify-center w-12 h-12 border border-champagne-300/30 mb-6">
                    <Icon size={20} className="text-champagne-300" />
                  </div>
                  <h3 className="font-serif text-lg font-normal text-ivory-50 mb-3">{feature.title}</h3>
                  <p className="text-sm text-ivory-200/60 leading-relaxed">{feature.desc}</p>
                </div>
              );
            })}
          </div>
        </div>
      </section>

      {/* Short About Section */}
      <section className="container-luxury py-20">
        <div className="grid grid-cols-1 md:grid-cols-2 gap-12 items-center">
          <div>
            <p className="eyebrow mb-3">Our Story</p>
            <h2 className="heading-display text-3xl md:text-4xl text-ink-900 mb-6">
              A Vision of<br />Understated Luxury
            </h2>
            <p className="text-sm text-ink-600 leading-relaxed mb-4">
              NexaMart was born from a simple idea: that luxury should be accessible, refined, and
              intentional. We believe in products that stand the test of time, both in quality and design.
            </p>
            <p className="text-sm text-ink-600 leading-relaxed mb-8">
              Every item in our collection is selected with care, ensuring it meets our standards of
              craftsmanship, aesthetics, and value. We invite you to discover the difference.
            </p>
            <Link to="/about" className="btn-secondary">
              Learn More
              <ArrowRight size={14} />
            </Link>
          </div>
          <div className="aspect-[4/3] overflow-hidden bg-ivory-100">
            <img
              src="https://images.pexels.com/photos/6952331/pexels-photo-6952331.jpeg?auto=compress&cs=tinysrgb&w=1200"
              alt="About NexaMart"
              className="w-full h-full object-cover"
            />
          </div>
        </div>
      </section>

      {/* Call to Action */}
      <section className="bg-ivory-100 py-20">
        <div className="container-luxury text-center">
          <h2 className="heading-display text-3xl md:text-5xl text-ink-900 mb-6">
            Begin Your Journey
          </h2>
          <p className="text-sm text-ink-600 mb-8 max-w-md mx-auto">
            Explore our full collection and discover products that elevate your everyday.
          </p>
          <Link to="/shop" className="btn-primary">
            Shop the Collection
            <ArrowRight size={14} />
          </Link>
        </div>
      </section>
    </div>
  );
}
