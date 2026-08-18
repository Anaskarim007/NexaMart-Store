import { useEffect, useState } from 'react';
import { useParams, Link, useNavigate } from 'react-router-dom';
import { Minus, Plus, ShoppingBag, ArrowLeft, Check } from 'lucide-react';
import { supabase } from '@/lib/supabase';
import type { Product, ProductImage } from '@/types';
import { formatPrice } from '@/lib/utils';

export default function ProductDetailsPage() {
  const { slug } = useParams<{ slug: string }>();
  const navigate = useNavigate();
  const [product, setProduct] = useState<Product | null>(null);
  const [images, setImages] = useState<ProductImage[]>([]);
  const [loading, setLoading] = useState(true);
  const [quantity, setQuantity] = useState(1);
  const [activeImage, setActiveImage] = useState(0);
  const [added, setAdded] = useState(false);

  useEffect(() => {
    async function fetchProduct() {
      if (!slug) return;
      setLoading(true);
      const { data } = await supabase
        .from('products')
        .select('*, category:categories(*)')
        .eq('slug', slug)
        .eq('active', true)
        .maybeSingle();

      if (data) {
        setProduct(data as Product);
        const { data: imgData } = await supabase
          .from('product_images')
          .select('*')
          .eq('product_id', data.id)
          .order('sort_order');
        setImages(imgData ?? []);
      }
      setLoading(false);
    }
    fetchProduct();
  }, [slug]);

  const allImages: string[] = [];
  if (product?.main_image_url) allImages.push(product.main_image_url);
  images.forEach((img) => {
    if (!allImages.includes(img.image_url)) allImages.push(img.image_url);
  });

  const effectivePrice = product?.sale_price ?? product?.price ?? 0;
  const hasSale = product?.sale_price !== null && product?.sale_price !== undefined && product.sale_price < product.price;
  const outOfStock = (product?.stock_quantity ?? 0) <= 0;

  const addToCart = () => {
    if (!product || outOfStock) return;
    const cart = JSON.parse(localStorage.getItem('nexamart-cart') ?? '[]');
    const existing = cart.find((i: { product_id: string }) => i.product_id === product.id);
    if (existing) {
      existing.quantity = Math.min(existing.quantity + quantity, product.stock_quantity);
    } else {
      cart.push({
        product_id: product.id,
        name: product.name,
        slug: product.slug,
        price: product.price,
        sale_price: product.sale_price,
        image_url: product.main_image_url,
        stock_quantity: product.stock_quantity,
        quantity,
      });
    }
    localStorage.setItem('nexamart-cart', JSON.stringify(cart));
    window.dispatchEvent(new Event('cart-updated'));
    setAdded(true);
    setTimeout(() => setAdded(false), 2000);
  };

  const buyNow = () => {
    if (!product || outOfStock) return;
    addToCart();
    navigate('/checkout');
  };

  if (loading) {
    return <div className="container-luxury py-20 text-center text-ink-400 text-sm">Loading product...</div>;
  }

  if (!product) {
    return (
      <div className="container-luxury py-20 text-center">
        <p className="text-ink-400 text-sm mb-4">Product not found.</p>
        <Link to="/shop" className="btn-secondary">Back to Shop</Link>
      </div>
    );
  }

  return (
    <div className="container-luxury py-12 animate-fade-in">
      <Link to="/shop" className="inline-flex items-center gap-2 text-2xs uppercase tracking-widest text-ink-500 hover:text-ink-900 transition-colors mb-8">
        <ArrowLeft size={14} /> Back to Shop
      </Link>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-12">
        {/* Image Gallery */}
        <div>
          <div className="aspect-[4/5] overflow-hidden bg-ivory-100 mb-4">
            {allImages.length > 0 ? (
              <img
                src={allImages[activeImage]}
                alt={product.name}
                className="w-full h-full object-cover"
              />
            ) : (
              <div className="w-full h-full flex items-center justify-center text-ink-300">No image</div>
            )}
          </div>
          {allImages.length > 1 && (
            <div className="flex gap-3 overflow-x-auto scrollbar-hide">
              {allImages.map((img, idx) => (
                <button
                  key={idx}
                  onClick={() => setActiveImage(idx)}
                  className={`flex-shrink-0 w-20 h-24 overflow-hidden border-2 transition-colors ${
                    activeImage === idx ? 'border-ink-900' : 'border-transparent'
                  }`}
                >
                  <img src={img} alt={`${product.name} ${idx + 1}`} className="w-full h-full object-cover" />
                </button>
              ))}
            </div>
          )}
        </div>

        {/* Product Info */}
        <div>
          {product.category && (
            <p className="eyebrow mb-3">{product.category.name}</p>
          )}
          <h1 className="font-serif text-3xl md:text-4xl font-light text-ink-900 mb-4">{product.name}</h1>

          <div className="flex items-center gap-3 mb-6">
            {hasSale && (
              <span className="text-lg text-ink-300 line-through">{formatPrice(product.price)}</span>
            )}
            <span className="text-2xl font-medium text-ink-900">{formatPrice(effectivePrice)}</span>
          </div>

          {product.short_description && (
            <p className="text-sm text-ink-600 leading-relaxed mb-6">{product.short_description}</p>
          )}

          <div className="mb-6">
            {outOfStock ? (
              <span className="inline-block text-2xs uppercase tracking-widest text-red-600 border border-red-200 px-3 py-1">
                Out of Stock
              </span>
            ) : (
              <span className="inline-flex items-center gap-1.5 text-2xs uppercase tracking-widest text-green-700 border border-green-200 px-3 py-1">
                <Check size={12} /> In Stock ({product.stock_quantity} available)
              </span>
            )}
          </div>

          {product.description && (
            <div className="mb-8">
              <h3 className="text-2xs uppercase tracking-widest text-ink-500 mb-3">Description</h3>
              <p className="text-sm text-ink-600 leading-relaxed whitespace-pre-line">{product.description}</p>
            </div>
          )}

          {/* Quantity + Actions */}
          {!outOfStock && (
            <div className="space-y-4">
              <div className="flex items-center gap-4">
                <span className="label mb-0">Quantity</span>
                <div className="flex items-center border border-ink-200">
                  <button
                    onClick={() => setQuantity(Math.max(1, quantity - 1))}
                    className="p-2.5 hover:bg-ink-50 transition-colors"
                  >
                    <Minus size={14} />
                  </button>
                  <span className="px-6 text-sm font-medium">{quantity}</span>
                  <button
                    onClick={() => setQuantity(Math.min(product.stock_quantity, quantity + 1))}
                    className="p-2.5 hover:bg-ink-50 transition-colors"
                  >
                    <Plus size={14} />
                  </button>
                </div>
              </div>

              <div className="flex flex-col sm:flex-row gap-3">
                <button onClick={addToCart} className="btn-secondary flex-1">
                  {added ? <><Check size={14} /> Added</> : <><ShoppingBag size={14} /> Add to Cart</>}
                </button>
                <button onClick={buyNow} className="btn-primary flex-1">
                  Buy Now
                </button>
              </div>
            </div>
          )}

          {product.sku && (
            <p className="text-2xs uppercase tracking-widest text-ink-400 mt-8">SKU: {product.sku}</p>
          )}
        </div>
      </div>
    </div>
  );
}
