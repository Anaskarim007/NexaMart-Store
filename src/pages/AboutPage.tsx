import { useEffect, useState } from 'react';
import { supabase } from '@/lib/supabase';

export default function AboutPage() {
  const [aboutImage, setAboutImage] = useState<string>(
    'https://images.pexels.com/photos/6952331/pexels-photo-6952331.jpeg?auto=compress&cs=tinysrgb&w=1200',
  );

  useEffect(() => {
    async function fetchImage() {
      const { data } = await supabase
        .from('site_content')
        .select('image_url')
        .eq('key', 'about_image')
        .maybeSingle();
      if (data?.image_url) setAboutImage(data.image_url);
    }
    fetchImage();
  }, []);

  return (
    <div className="animate-fade-in">
      {/* Hero */}
      <section className="relative h-[50vh] min-h-[400px] overflow-hidden">
        <img src={aboutImage} alt="About NexaMart" className="w-full h-full object-cover" />
        <div className="absolute inset-0 bg-ivory-50/20" />
        <div className="relative z-10 h-full flex items-center justify-center text-center px-4">
          <div>
            <p className="eyebrow mb-3">About Us</p>
            <h1 className="heading-display text-4xl md:text-5xl text-ink-900">Our Story</h1>
          </div>
        </div>
      </section>

      {/* Introduction */}
      <section className="container-luxury py-20 max-w-3xl mx-auto text-center">
        <p className="text-lg font-serif text-ink-700 leading-relaxed mb-6">
          NexaMart was born from a belief that luxury should be intentional, accessible, and enduring.
        </p>
        <p className="text-sm text-ink-600 leading-relaxed">
          We curate products that combine exceptional craftsmanship with timeless design, offering a
          collection that speaks to those who appreciate the finer things in life. Every item we select
          is chosen for its quality, its story, and its ability to elevate the everyday.
        </p>
      </section>

      {/* Mission */}
      <section className="bg-ivory-100 py-20">
        <div className="container-luxury max-w-3xl mx-auto text-center">
          <p className="eyebrow mb-3">Our Mission</p>
          <h2 className="heading-display text-3xl md:text-4xl text-ink-900 mb-6">
            To Redefine Accessible Luxury
          </h2>
          <p className="text-sm text-ink-600 leading-relaxed">
            Our mission is to make refined living accessible to everyone. We believe that premium
            quality should not be reserved for a select few — it should be available to anyone who
            values thoughtful design, lasting craftsmanship, and understated elegance.
          </p>
        </div>
      </section>

      {/* Values */}
      <section className="container-luxury py-20">
        <div className="text-center mb-12">
          <p className="eyebrow mb-3">What We Stand For</p>
          <h2 className="heading-display text-3xl md:text-4xl text-ink-900">Our Values</h2>
        </div>
        <div className="grid grid-cols-1 md:grid-cols-3 gap-12 max-w-4xl mx-auto">
          {[
            { title: 'Quality', desc: 'We never compromise on the quality of our products. Every item is carefully vetted to ensure it meets our standards of excellence.' },
            { title: 'Integrity', desc: 'We believe in honest, transparent relationships with our customers. What you see is what you get — always.' },
            { title: 'Elegance', desc: 'We celebrate understated luxury. Our products are designed for those who appreciate subtlety over ostentation.' },
          ].map((value) => (
            <div key={value.title} className="text-center">
              <h3 className="font-serif text-xl text-ink-900 mb-4">{value.title}</h3>
              <p className="text-sm text-ink-600 leading-relaxed">{value.desc}</p>
            </div>
          ))}
        </div>
      </section>

      {/* Brand Story */}
      <section className="bg-ink-900 text-ivory-100 py-20">
        <div className="container-luxury max-w-3xl mx-auto text-center">
          <p className="text-2xs font-medium uppercase tracking-widest text-champagne-300 mb-3">The Journey</p>
          <h2 className="heading-display text-3xl md:text-4xl text-ivory-50 mb-6">
            From Vision to Reality
          </h2>
          <p className="text-sm text-ivory-200/70 leading-relaxed mb-4">
            What began as a simple idea — that luxury should be within reach — has grown into a curated
            destination for discerning customers. We partner with makers and brands who share our
            commitment to quality, ensuring every product tells a story of craftsmanship and care.
          </p>
          <p className="text-sm text-ivory-200/70 leading-relaxed">
            Today, NexaMart stands as a testament to the belief that the best things in life are
            thoughtfully made, carefully chosen, and built to last.
          </p>
        </div>
      </section>
    </div>
  );
}
