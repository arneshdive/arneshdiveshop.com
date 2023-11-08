'use client';

import { useState } from 'react';
import { Icon } from '@iconify/react';
import { mockBanners, type HeroBanner, type SplitBanner } from '@/lib/data/mock-banners';

const heroBanner = mockBanners.find((b): b is HeroBanner => b.id === 'hero')!;
const splitBanners = mockBanners.filter((b): b is SplitBanner => b.id.startsWith('split-'));

export default function BannersPage() {
  const [editingBanner, setEditingBanner] = useState<string | null>(null);

  return (
    <div className="max-w-7xl">
      {/* Header */}
      <div className="mb-8">
        <h1 className="text-2xl font-semibold tracking-tight text-neutral-900">Banner</h1>
        <p className="text-sm text-neutral-500 mt-1">Kelola banner yang tampil di halaman utama toko</p>
      </div>

      {/* Hero Banner Section */}
      <section className="mb-10">
        <div className="flex items-center gap-2 mb-4">
          <Icon icon="solar:gallery-wide-linear" className="w-5 h-5 text-neutral-500" />
          <h2 className="text-lg font-semibold tracking-tight text-neutral-900">Hero Banner</h2>
        </div>
        <p className="text-sm text-neutral-500 mb-4">
          Banner utama yang ditampilkan di bagian atas halaman beranda
        </p>

        <div className="bg-white rounded-2xl border border-neutral-200 overflow-hidden">
          {/* Preview */}
          <div className="relative aspect-[21/9] bg-gradient-to-r from-neutral-700 to-neutral-500">
            <img
              src={heroBanner.backgroundImage}
              alt="Hero banner preview"
              className="w-full h-full object-cover"
            />
            <div className="absolute inset-0 bg-black/40 flex items-center">
              <div className="px-8 lg:px-12">
                <span className="text-xs uppercase tracking-widest text-white/70 mb-2 block">
                  {heroBanner.eyebrow}
                </span>
                <h3 className="text-2xl lg:text-4xl font-bold text-white mb-2">
                  {heroBanner.heading}
                </h3>
                <p className="text-white/80 text-sm lg:text-base max-w-md mb-4">
                  {heroBanner.description}
                </p>
                <span className="inline-block bg-white px-4 py-2 text-sm font-medium text-neutral-900 rounded-full">
                  {heroBanner.ctaText}
                </span>
              </div>
            </div>
          </div>

          {/* Details */}
          <div className="p-6 border-t border-neutral-100">
            <div className="grid sm:grid-cols-2 lg:grid-cols-4 gap-4 text-sm">
              <div>
                <span className="text-neutral-500 block mb-1">Eyebrow</span>
                <span className="text-neutral-900 font-medium">{heroBanner.eyebrow}</span>
              </div>
              <div>
                <span className="text-neutral-500 block mb-1">Heading</span>
                <span className="text-neutral-900 font-medium">{heroBanner.heading}</span>
              </div>
              <div>
                <span className="text-neutral-500 block mb-1">CTA Text</span>
                <span className="text-neutral-900 font-medium">{heroBanner.ctaText}</span>
              </div>
              <div>
                <span className="text-neutral-500 block mb-1">CTA Link</span>
                <span className="text-neutral-900 font-medium">{heroBanner.ctaLink}</span>
              </div>
            </div>
            <div className="flex justify-end mt-4">
              <button
                onClick={() => setEditingBanner('hero')}
                className="inline-flex items-center gap-2 px-4 py-2 text-sm font-medium text-neutral-600 hover:text-neutral-900 hover:bg-neutral-100 rounded-lg transition-colors"
              >
                <Icon icon="solar:pen-linear" className="w-4 h-4" />
                Edit Banner
              </button>
            </div>
          </div>
        </div>
      </section>

      {/* Split Collection Banners Section */}
      <section>
        <div className="flex items-center gap-2 mb-4">
          <Icon icon="solar:columns-linear" className="w-5 h-5 text-neutral-500" />
          <h2 className="text-lg font-semibold tracking-tight text-neutral-900">Collection Banners</h2>
        </div>
        <p className="text-sm text-neutral-500 mb-4">
          Dua banner berdampingan untuk koleksi Freediving dan Scuba
        </p>

        <div className="grid md:grid-cols-2 gap-4">
          {splitBanners.map((banner) => (
            <div
              key={banner.id}
              className="bg-white rounded-2xl border border-neutral-200 overflow-hidden"
            >
              {/* Preview */}
              <div className="relative aspect-[4/3] bg-gradient-to-br from-neutral-200 to-neutral-300">
                {banner.backgroundImage && (
                  <img
                    src={banner.backgroundImage}
                    alt={`${banner.collection} banner preview`}
                    className="w-full h-full object-cover"
                  />
                )}
                <div className="absolute inset-0 bg-gradient-to-t from-black/50 to-transparent flex items-end">
                  <div className="p-6">
                    <span className="text-xs uppercase tracking-widest text-white/70 mb-1 block">
                      {banner.eyebrow}
                    </span>
                    <h3 className="text-xl font-semibold text-white mb-2">
                      {banner.heading}
                    </h3>
                    <span className="inline-block bg-white px-4 py-2 text-sm font-medium text-neutral-900 rounded-full">
                      {banner.ctaText}
                    </span>
                  </div>
                </div>
              </div>

              {/* Details */}
              <div className="p-5 border-t border-neutral-100">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-3">
                    <div className={`w-10 h-10 rounded-lg flex items-center justify-center ${
                      banner.collection === 'freediving' ? 'bg-blue-50' : 'bg-green-50'
                    }`}>
                      <Icon
                        icon={banner.collection === 'freediving' ? 'solar:swimming-linear' : 'solar:bottle-linear'}
                        className={`w-5 h-5 ${
                          banner.collection === 'freediving' ? 'text-blue-600' : 'text-green-600'
                        }`}
                      />
                    </div>
                    <div>
                      <span className="text-sm text-neutral-500 block capitalize">{banner.collection}</span>
                      <span className="text-sm font-medium text-neutral-900">{banner.heading}</span>
                    </div>
                  </div>
                  <button
                    onClick={() => setEditingBanner(banner.id)}
                    className="w-9 h-9 rounded-lg flex items-center justify-center text-neutral-500 hover:text-neutral-900 hover:bg-neutral-100 transition-colors"
                    aria-label={`Edit ${banner.collection} banner`}
                  >
                    <Icon icon="solar:pen-linear" className="w-4 h-4" />
                  </button>
                </div>
              </div>
            </div>
          ))}
        </div>
      </section>

      {/* Edit Modal Placeholder */}
      {editingBanner && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
          <div
            className="absolute inset-0 bg-black/50"
            onClick={() => setEditingBanner(null)}
          />
          <div className="relative bg-white rounded-2xl shadow-xl w-full max-w-lg p-6">
            <div className="flex items-center justify-between mb-6">
              <h3 className="text-lg font-semibold text-neutral-900">
                Edit {editingBanner === 'hero' ? 'Hero Banner' : `${editingBanner.replace('split-', '')} Banner`}
              </h3>
              <button
                onClick={() => setEditingBanner(null)}
                className="w-8 h-8 rounded-lg flex items-center justify-center text-neutral-500 hover:text-neutral-900 hover:bg-neutral-100 transition-colors"
              >
                <Icon icon="solar:close-circle-linear" className="w-5 h-5" />
              </button>
            </div>

            <div className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-neutral-700 mb-1.5">
                  Eyebrow
                </label>
                <input
                  type="text"
                  defaultValue={editingBanner === 'hero' ? heroBanner.eyebrow : splitBanners.find(b => b.id === editingBanner)?.eyebrow}
                  className="w-full px-4 py-2.5 text-sm bg-neutral-50 border border-neutral-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-neutral-900 focus:border-transparent"
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-neutral-700 mb-1.5">
                  Heading
                </label>
                <input
                  type="text"
                  defaultValue={editingBanner === 'hero' ? heroBanner.heading : splitBanners.find(b => b.id === editingBanner)?.heading}
                  className="w-full px-4 py-2.5 text-sm bg-neutral-50 border border-neutral-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-neutral-900 focus:border-transparent"
                />
              </div>
              {editingBanner === 'hero' && (
                <div>
                  <label className="block text-sm font-medium text-neutral-700 mb-1.5">
                    Description
                  </label>
                  <textarea
                    defaultValue={heroBanner.description}
                    rows={3}
                    className="w-full px-4 py-2.5 text-sm bg-neutral-50 border border-neutral-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-neutral-900 focus:border-transparent resize-none"
                  />
                </div>
              )}
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium text-neutral-700 mb-1.5">
                    CTA Text
                  </label>
                  <input
                    type="text"
                    defaultValue={editingBanner === 'hero' ? heroBanner.ctaText : splitBanners.find(b => b.id === editingBanner)?.ctaText}
                    className="w-full px-4 py-2.5 text-sm bg-neutral-50 border border-neutral-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-neutral-900 focus:border-transparent"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-neutral-700 mb-1.5">
                    CTA Link
                  </label>
                  <input
                    type="text"
                    defaultValue={editingBanner === 'hero' ? heroBanner.ctaLink : splitBanners.find(b => b.id === editingBanner)?.ctaLink}
                    className="w-full px-4 py-2.5 text-sm bg-neutral-50 border border-neutral-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-neutral-900 focus:border-transparent"
                  />
                </div>
              </div>
              {editingBanner === 'hero' && (
                <div>
                  <label className="block text-sm font-medium text-neutral-700 mb-1.5">
                    Background Image
                  </label>
                  <div className="flex items-center gap-3">
                    <div className="w-16 h-12 rounded-lg bg-neutral-100 flex items-center justify-center overflow-hidden">
                      <img
                        src={heroBanner.backgroundImage}
                        alt="Current background"
                        className="w-full h-full object-cover"
                      />
                    </div>
                    <button
                      type="button"
                      className="px-4 py-2 text-sm font-medium text-neutral-600 hover:text-neutral-900 bg-neutral-100 hover:bg-neutral-200 rounded-lg transition-colors"
                    >
                      Change Image
                    </button>
                  </div>
                </div>
              )}
            </div>

            <div className="flex justify-end gap-3 mt-6 pt-6 border-t border-neutral-100">
              <button
                onClick={() => setEditingBanner(null)}
                className="px-4 py-2.5 text-sm font-medium text-neutral-600 hover:text-neutral-900 transition-colors"
              >
                Cancel
              </button>
              <button
                onClick={() => {
                  // TODO: Save banner changes
                  setEditingBanner(null);
                }}
                className="px-6 py-2.5 text-sm font-medium text-white bg-neutral-900 hover:bg-neutral-800 rounded-lg transition-colors"
              >
                Save Changes
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
