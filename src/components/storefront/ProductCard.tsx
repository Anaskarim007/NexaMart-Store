import { Link } from 'react-router-dom';
import type { Product } from '@/types';
import { formatPrice } from '@/lib/utils';

export default function ProductCard({ product }: { product: Product }) {
  const effectivePrice = product.sale_price ?? product.price;
  const hasSale = product.sale_price !== null && product.sale_price < product.price;
  const outOfStock = product.stock_quantity <= 0;

  return (
    <Link to={`/product/${product.slug}`} className="group block">
      <div className="relative overflow-hidden bg-ivory-100 aspect-[4/5] mb-4">
        {product.main_image_url ? (
          <img
            src={product.main_image_url}
            alt={product.name}
            className="w-full h-full object-cover transition-transform duration-700 group-hover:scale-105"
          />
        ) : (
          <div className="w-full h-full flex items-center justify-center text-ink-300">
            <span className="text-sm">No image</span>
          </div>
        )}
        {outOfStock && (
          <div className="absolute inset-0 bg-ink-900/40 flex items-center justify-center">
            <span className="bg-ivory-50 text-ink-900 text-2xs font-medium uppercase tracking-widest px-4 py-2">
              Out of Stock
            </span>
          </div>
        )}
        {hasSale && !outOfStock && (
          <span className="absolute top-3 left-3 bg-ink-900 text-ivory-50 text-2xs font-medium uppercase tracking-widest px-3 py-1">
            Sale
          </span>
        )}
        {product.new_arrival && !hasSale && !outOfStock && (
          <span className="absolute top-3 left-3 bg-champagne-400 text-ink-900 text-2xs font-medium uppercase tracking-widest px-3 py-1">
            New
          </span>
        )}
      </div>
      <div className="text-center">
        {product.category && (
          <p className="text-2xs uppercase tracking-widest text-ink-400 mb-1">
            {product.category.name}
          </p>
        )}
        <h3 className="font-serif text-base font-normal text-ink-900 mb-2 group-hover:text-champagne-600 transition-colors">
          {product.name}
        </h3>
        <div className="flex items-center justify-center gap-2">
          {hasSale && (
            <span className="text-sm text-ink-300 line-through">{formatPrice(product.price)}</span>
          )}
          <span className="text-sm font-medium text-ink-900">{formatPrice(effectivePrice)}</span>
        </div>
      </div>
    </Link>
  );
}
