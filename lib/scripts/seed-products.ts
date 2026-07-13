import { db, categories, brands, products, productVariants } from '@/lib/db';
import { eq } from 'drizzle-orm';

const IMAGES = {
  mask1: 'https://duruwpeexnyc4tce.public.blob.vercel-storage.com/products/mask-1.jpg',
  mask2: 'https://duruwpeexnyc4tce.public.blob.vercel-storage.com/products/mask-2.jpg',
  fins: 'https://duruwpeexnyc4tce.public.blob.vercel-storage.com/products/fins-1.jpg',
  bcd: 'https://duruwpeexnyc4tce.public.blob.vercel-storage.com/products/bcd-1.jpg',
  wetsuit: 'https://duruwpeexnyc4tce.public.blob.vercel-storage.com/products/wetsuit-1.jpg',
  gloves: 'https://duruwpeexnyc4tce.public.blob.vercel-storage.com/products/gloves-1.jpg',
};

async function main() {
  const allCategories = await db.select().from(categories);
  const categoryMap = Object.fromEntries(allCategories.map(c => [c.slug, c.id]));
  const allBrands = await db.select().from(brands);
  const brandMap = Object.fromEntries(allBrands.map(b => [b.slug, b.id]));

  // Delete old seeded products
  const slugs = ['mares-x-free-mask', 'cressi-nano-mask', 'beuchat-mundial-carbon-fins', 'mares-avanti-quattro-plus-fins', 'salvimar-natural-wetsuit-3mm', 'cressi-lontra-wetsuit-5mm', 'apeks-rk3-fins', 'scubapro-hydros-pro-bcd', 'mares-rover-2s-regulator', 'cressi-polimer-gloves-3mm'];
  for (const slug of slugs) {
    const existing = await db.select().from(products).where(eq(products.slug, slug));
    if (existing.length > 0 && existing[0]) {
      await db.delete(productVariants).where(eq(productVariants.productId, existing[0].id));
      await db.delete(products).where(eq(products.id, existing[0].id));
    }
  }

  const productData = [
    { name: 'Mares X-Free Mask', slug: 'mares-x-free-mask', sku: 'MSK-MRES-XFREE', description: 'Low volume freediving mask with ultra-soft silicone skirt.', priceCents: 85000000, compareAtPriceCents: 95000000, categoryId: categoryMap['masker']!, brandId: brandMap['mares']!, divingTypes: ['freediving'] as const, images: [IMAGES.mask1], isActive: true, isFeatured: true, isNewArrival: true, weightGrams: 200, variants: [{ name: 'Black', options: { color: 'Black' } }, { name: 'Clear', options: { color: 'Clear' } }] },
    { name: 'Cressi Nano Mask', slug: 'cressi-nano-mask', sku: 'MSK-CRSI-NANO', description: 'Compact low volume mask for freediving.', priceCents: 72000000, categoryId: categoryMap['masker']!, brandId: brandMap['cressi']!, divingTypes: ['freediving'], images: [IMAGES.mask2], isActive: true, weightGrams: 180, variants: [{ name: 'Black', options: { color: 'Black' } }, { name: 'Clear', options: { color: 'Clear' } }] },
    { name: 'Beuchat Mundial Carbon Fins', slug: 'beuchat-mundial-carbon-fins', sku: 'FIN-BCHT-MND-CB', description: 'Professional carbon fiber fins. 100% carbon blades.', priceCents: 450000000, compareAtPriceCents: 520000000, categoryId: categoryMap['fin']!, brandId: brandMap['beuchat']!, divingTypes: ['freediving'], images: [IMAGES.fins], isActive: true, isFeatured: true, isNewArrival: true, isOnSale: true, weightGrams: 1200, variants: [{ name: 'Soft / 39-41', options: { stiffness: 'Soft', size: '39-41' } }, { name: 'Medium / 39-41', options: { stiffness: 'Medium', size: '39-41' } }, { name: 'Medium / 42-44', options: { stiffness: 'Medium', size: '42-44' } }] },
    { name: 'Mares Avanti Quattro Plus Fins', slug: 'mares-avanti-quattro-plus-fins', sku: 'FIN-MRES-AVT-QP', description: 'Channel thrust technology for excellent performance.', priceCents: 145000000, categoryId: categoryMap['fin']!, brandId: brandMap['mares']!, divingTypes: ['scuba', 'freediving'], images: [IMAGES.fins], isActive: true, weightGrams: 950, variants: [{ name: 'S', options: { size: 'S' } }, { name: 'M', options: { size: 'M' } }, { name: 'L', options: { size: 'L' } }] },
    { name: 'Salvimar Natural Wetsuit 3mm', slug: 'salvimar-natural-wetsuit-3mm', sku: 'WET-SLVM-NAT-3', description: '3mm neoprene wetsuit for tropical waters.', priceCents: 285000000, categoryId: categoryMap['wetsuit']!, brandId: brandMap['salvimar']!, divingTypes: ['freediving'], images: [IMAGES.wetsuit], isActive: true, isFeatured: true, weightGrams: 1500, variants: [{ name: 'M', options: { size: 'M' } }, { name: 'L', options: { size: 'L' } }, { name: 'XL', options: { size: 'XL' } }] },
    { name: 'Cressi Lontra Wetsuit 5mm', slug: 'cressi-lontra-wetsuit-5mm', sku: 'WET-CRSI-LNT-5', description: '5mm semi-dry wetsuit for temperate waters.', priceCents: 360000000, categoryId: categoryMap['wetsuit']!, brandId: brandMap['cressi']!, divingTypes: ['scuba'], images: [IMAGES.wetsuit], isActive: true, isNewArrival: true, weightGrams: 2200, variants: [{ name: 'M', options: { size: 'M' } }, { name: 'L', options: { size: 'L' } }] },
    { name: 'Apeks RK3 Fins', slug: 'apeks-rk3-fins', sku: 'FIN-APKS-RK3', description: 'Military-grade thermal plastic rubber fins.', priceCents: 135000000, categoryId: categoryMap['fin']!, brandId: brandMap['apeks']!, divingTypes: ['scuba'], images: [IMAGES.fins], isActive: true, isFeatured: true, weightGrams: 1100, variants: [{ name: 'Black / Regular', options: { color: 'Black', size: 'Regular' } }, { name: 'Yellow / Regular', options: { color: 'Yellow', size: 'Regular' } }] },
    { name: 'Scubapro Hydros Pro BCD', slug: 'scubapro-hydros-pro-bcd', sku: 'BCD-SCBP-HYD-PRO', description: 'Premium back-inflation BCD with monocoque design.', priceCents: 850000000, compareAtPriceCents: 950000000, categoryId: categoryMap['bcd']!, brandId: brandMap['scubapro']!, divingTypes: ['scuba'], images: [IMAGES.bcd], isActive: true, isFeatured: true, isNewArrival: true, isOnSale: true, weightGrams: 2800, variants: [{ name: 'S', options: { size: 'S' } }, { name: 'M', options: { size: 'M' } }, { name: 'L', options: { size: 'L' } }] },
    { name: 'Mares Rover 2S Regulator', slug: 'mares-rover-2s-regulator', sku: 'REG-MRES-RVR2S', description: 'Reliable balanced diaphragm regulator.', priceCents: 520000000, categoryId: categoryMap['regulator']!, brandId: brandMap['mares']!, divingTypes: ['scuba'], images: [IMAGES.bcd], isActive: true, weightGrams: 950, variants: [{ name: 'DIN', options: { connection: 'DIN' } }, { name: 'Yoke', options: { connection: 'Yoke' } }] },
    { name: 'Cressi Polimer Gloves 3mm', slug: 'cressi-polimer-gloves-3mm', sku: 'GLV-CRSI-PLM-3', description: '3mm neoprene gloves with polymer coating.', priceCents: 45000000, categoryId: categoryMap['aksesoris']!, brandId: brandMap['cressi']!, divingTypes: ['scuba', 'freediving'], images: [IMAGES.gloves], isActive: true, weightGrams: 150, variants: [{ name: 'M', options: { size: 'M' } }, { name: 'L', options: { size: 'L' } }] },
  ];

  console.log('🌱 Seeding products...');
  for (const p of productData) {
    const { variants, ...fields } = p;
    const [inserted] = await db.insert(products).values({ ...fields, divingTypes: fields.divingTypes as ('freediving' | 'scuba')[] }).returning();
    if (inserted) {
      for (const v of variants) await db.insert(productVariants).values({ productId: inserted.id, name: v.name, options: v.options, isActive: true });
      console.log(`✓ ${p.name}`);
    }
  }
  console.log('✅ Done!');
}

main().catch(console.error);
