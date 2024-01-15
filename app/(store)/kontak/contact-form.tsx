'use client';

import { useState } from 'react';
import { Icon } from '@iconify/react';
import { AnimatedButton } from '@/components/ui/animated-button';

const subjectOptions = [
  { value: 'order', label: 'Pesanan' },
  { value: 'shipping', label: 'Pengiriman' },
  { value: 'return', label: 'Pengembalian & Penukaran' },
  { value: 'product', label: 'Produk' },
  { value: 'other', label: 'Lainnya' },
];

interface FormData {
  name: string;
  email: string;
  subject: string;
  message: string;
}

export function ContactForm() {
  const [formData, setFormData] = useState<FormData>({
    name: '',
    email: '',
    subject: '',
    message: '',
  });
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [isSubmitted, setIsSubmitted] = useState(false);

  const handleChange = (
    e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement | HTMLSelectElement>
  ) => {
    const { name, value } = e.target;
    setFormData((prev) => ({ ...prev, [name]: value }));
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsSubmitting(true);

    // Simulate form submission
    await new Promise((resolve) => setTimeout(resolve, 1500));

    setIsSubmitting(false);
    setIsSubmitted(true);
  };

  if (isSubmitted) {
    return (
      <div className="bg-neutral-50 rounded-xl p-8 text-center">
        <div className="w-16 h-16 rounded-full bg-green-100 flex items-center justify-center mx-auto mb-4">
          <Icon icon="solar:check-circle-linear" className="w-8 h-8 text-green-600" />
        </div>
        <h3 className="text-lg font-semibold mb-2">Pesan Terkirim!</h3>
        <p className="text-neutral-500 mb-6">
          Terima kasih telah menghubungi kami. Tim kami akan merespons dalam 1-2 hari kerja.
        </p>
        <AnimatedButton
          variant="outline"
          size="sm"
          onClick={() => {
            setIsSubmitted(false);
            setFormData({ name: '', email: '', subject: '', message: '' });
          }}
        >
          Kirim Pesan Lain
        </AnimatedButton>
      </div>
    );
  }

  return (
    <form onSubmit={handleSubmit} className="space-y-6">
      {/* Name */}
      <div>
        <label htmlFor="name" className="block text-xs uppercase tracking-wider text-neutral-500 mb-2">
          Nama Lengkap
        </label>
        <input
          type="text"
          id="name"
          name="name"
          value={formData.name}
          onChange={handleChange}
          required
          className="w-full px-4 py-3 border border-neutral-200 rounded-lg text-base focus:outline-none focus:ring-2 focus:ring-neutral-900"
        />
      </div>

      {/* Email */}
      <div>
        <label htmlFor="email" className="block text-xs uppercase tracking-wider text-neutral-500 mb-2">
          Email
        </label>
        <input
          type="email"
          id="email"
          name="email"
          value={formData.email}
          onChange={handleChange}
          required
          className="w-full px-4 py-3 border border-neutral-200 rounded-lg text-base focus:outline-none focus:ring-2 focus:ring-neutral-900"
        />
      </div>

      {/* Subject */}
      <div>
        <label htmlFor="subject" className="block text-xs uppercase tracking-wider text-neutral-500 mb-2">
          Subjek
        </label>
        <select
          id="subject"
          name="subject"
          value={formData.subject}
          onChange={handleChange}
          required
          className="w-full px-4 py-3 border border-neutral-200 rounded-lg text-base focus:outline-none focus:ring-2 focus:ring-neutral-900 bg-white"
        >
          <option value="">Pilih subjek...</option>
          {subjectOptions.map((option) => (
            <option key={option.value} value={option.value}>
              {option.label}
            </option>
          ))}
        </select>
      </div>

      {/* Message */}
      <div>
        <label htmlFor="message" className="block text-xs uppercase tracking-wider text-neutral-500 mb-2">
          Pesan
        </label>
        <textarea
          id="message"
          name="message"
          value={formData.message}
          onChange={handleChange}
          required
          rows={5}
          className="w-full px-4 py-3 border border-neutral-200 rounded-lg text-base focus:outline-none focus:ring-2 focus:ring-neutral-900 resize-none"
        />
      </div>

      {/* Submit */}
      <AnimatedButton type="submit" className="w-full sm:w-auto" disabled={isSubmitting}>
        {isSubmitting ? (
          <>
            <Icon icon="solar:loading-linear" className="w-4 h-4 animate-spin" />
            Mengirim...
          </>
        ) : (
          <>
            <Icon icon="solar:plain-linear" className="w-4 h-4" />
            Kirim Pesan
          </>
        )}
      </AnimatedButton>
    </form>
  );
}
