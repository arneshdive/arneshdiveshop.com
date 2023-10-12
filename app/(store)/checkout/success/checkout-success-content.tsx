'use client';

import { useEffect, useState } from 'react';
import { useSearchParams } from 'next/navigation';
import { OrderConfirmationCard } from '@/components/checkout/order-confirmation-card';
import { useCartStore } from '@/lib/store/cart';
import { useCheckoutStore } from '@/lib/store/checkout';
import { shippingMethods } from '@/lib/constants/shipping';

export function CheckoutSuccessContent() {
  const searchParams = useSearchParams();
  const { items, clearCart } = useCartStore();
  const { data, reset } = useCheckoutStore();
  const [hasCleared, setHasCleared] = useState(false);

  const orderId = searchParams.get('order_id') || `ARD-${new Date().getFullYear()}-0000`;

  // Clear cart and checkout data on successful order
  useEffect(() => {
    if (!hasCleared) {
      setHasCleared(true);
      setTimeout(() => {
        clearCart();
        reset();
      }, 1000);
    }
  }, [hasCleared, clearCart, reset]);

  const selectedMethod = shippingMethods.find((m) => m.id === data.shippingMethod);
  const subtotal = items.reduce((sum, item) => {
    const price = parseFloat(item.product.price.replace(/[^0-9]/g, ''));
    return sum + price * item.quantity;
  }, 0);

  const fullAddress = [data.address1, data.address2, data.city, data.province, data.postalCode]
    .filter(Boolean)
    .join(', ');

  return (
    <div className="min-h-screen bg-neutral-100">
      <OrderConfirmationCard
        orderId={orderId}
        customerName={data.fullName || 'Customer'}
        email={data.email || 'email@example.com'}
        address={fullAddress || 'Alamat tidak tersedia'}
        shippingMethod={selectedMethod ? `${selectedMethod.name} (${selectedMethod.description})` : 'JNE Reguler'}
        items={items.map((item) => ({
          title: item.product.title,
          variant: item.selectedVariant?.color || item.selectedVariant?.size,
          quantity: item.quantity,
          price: item.product.price,
        }))}
        subtotal={subtotal}
        shippingCost={selectedMethod?.price || 0}
        total={subtotal + (selectedMethod?.price || 0)}
      />
    </div>
  );
}
