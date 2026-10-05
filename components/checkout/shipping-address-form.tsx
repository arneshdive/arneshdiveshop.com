'use client';

import { useTranslations } from 'next-intl';
import { Input, Textarea } from '@/components/admin/input';
import { useCheckoutStore } from '@/lib/store/checkout';
import { checkoutFormSchema, getFieldI18nKey } from '@/lib/validations/checkout';
import { DestinationSearch } from './destination-search';
import { COUNTRIES } from '@/lib/shipping/countries';

export function ShippingAddressForm() {
  const t = useTranslations('checkout');
  const { data, setField, touched, setTouched } = useCheckoutStore();
  const validation = checkoutFormSchema.safeParse(data);
  const destinationErrorKey = getFieldI18nKey(validation, 'rajaongkirCityId');
  const intlCityErrorKey = getFieldI18nKey(validation, 'intlCity');
  const intlPostalCodeErrorKey = getFieldI18nKey(validation, 'intlPostalCode');
  const address1ErrorKey = getFieldI18nKey(validation, 'address1');
  const isDomestic = data.countryCode === 'ID';

  return (
    <div className="pb-8 mb-8 border-b border-neutral-200">
      <div className="mb-6">
        <h2 className="text-lg font-semibold tracking-tight">
          {t('shipping.title')}
        </h2>
      </div>

      <div className="space-y-6">
        {/* Destination Country */}
        <div>
          <label className="block text-sm font-medium text-neutral-700 mb-2">
            {t('shipping.countryLabel')} <span className="text-red-500">*</span>
          </label>
          <select
            value={data.countryCode}
            onChange={(e) => {
              const countryCode = e.target.value;
              const country = COUNTRIES.find((c) => c.code === countryCode)?.name || countryCode;
              setField('countryCode', countryCode);
              setField('country', country);
              // Previous courier/rate selection no longer applies once the destination changes
              setField('shippingMethod', '');
              setField('shippingCostCents', null);
            }}
            className="w-full px-4 py-3 rounded-xl border border-neutral-200 text-sm focus:outline-none focus:ring-2 focus:ring-neutral-900"
          >
            {COUNTRIES.map((country) => (
              <option key={country.code} value={country.code}>{country.name}</option>
            ))}
          </select>
        </div>

        {isDomestic ? (
          <>
            {/* Destination Search (Kelurahan/Kecamatan) */}
            <div>
              <label className="block text-sm font-medium text-neutral-700 mb-2">
                {t('shipping.destinationLabel')} <span className="text-red-500">*</span>
              </label>
              <div
                onFocus={() => setTouched('rajaongkirCityId')}
                onClick={() => setTouched('rajaongkirCityId')}
              >
                <DestinationSearch
                  value={data.rajaongkirCityName || ''}
                  onSelect={(destination) => {
                    setField('rajaongkirCityId', destination.id);
                    setField('rajaongkirCityName', destination.fullName);
                    setField('rajaongkirProvince', destination.province);
                    setField('rajaongkirCity', destination.city || null);
                    setField('rajaongkirDistrict', destination.district || null);
                    setField('rajaongkirSubdistrict', destination.name);
                    setField('rajaongkirPostalCode', destination.postalCode || null);
                  }}
                  placeholder={t('shipping.destinationPlaceholder')}
                  className={touched.rajaongkirCityId && destinationErrorKey ? 'border-red-400' : ''}
                />
              </div>
              {touched.rajaongkirCityId && destinationErrorKey && (
                <p className="text-xs text-red-500 mt-1.5 flex items-center gap-1.5">
                  <svg className="w-3.5 h-3.5 flex-shrink-0" fill="currentColor" viewBox="0 0 20 20">
                    <path fillRule="evenodd" d="M18 10a8 8 0 11-16 0 8 8 0 0116 0zm-7 4a1 1 0 11-2 0 1 1 0 012 0zm-1-9a1 1 0 00-1 1v4a1 1 0 102 0V6a1 1 0 00-1-1z" clipRule="evenodd" />
                  </svg>
                  {t(destinationErrorKey)}
                </p>
              )}
              <p className="text-xs text-neutral-400 mt-2">
                {t('shipping.destinationHint')}
              </p>
            </div>

            {/* Selected Destination Display */}
            {data.rajaongkirCityId && (
              <div className="p-4 bg-neutral-50 rounded-xl">
                <div className="flex items-start gap-3">
                  <div className="flex-shrink-0 w-10 h-10 bg-neutral-200 rounded-lg flex items-center justify-center">
                    <svg className="w-5 h-5 text-neutral-600" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17.657 16.657L13.414 20.9a1.998 1.998 0 01-2.827 0l-4.244-4.243a8 8 0 1111.314 0z" />
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 11a3 3 0 11-6 0 3 3 0 016 0z" />
                    </svg>
                  </div>
                  <div className="flex-1 min-w-0">
                    <p className="text-xs text-neutral-500 mb-1">{t('shipping.destinationSelectedLabel')}</p>
                    <p className="text-sm font-medium leading-relaxed">
                      {data.rajaongkirCityName}
                    </p>
                    {data.rajaongkirCity && (
                      <p className="text-xs text-neutral-500 mt-1">
                        {data.rajaongkirCity}, {data.rajaongkirProvince}
                      </p>
                    )}
                  </div>
                </div>
              </div>
            )}
          </>
        ) : (
          <div className="grid sm:grid-cols-2 gap-6">
            <div>
              <label className="block text-sm font-medium text-neutral-700 mb-2">
                {t('shipping.intlCityLabel')} <span className="text-red-500">*</span>
              </label>
              <Input
                type="text"
                value={data.intlCity}
                onChange={(e) => setField('intlCity', e.target.value)}
                onBlur={() => setTouched('intlCity')}
                placeholder={t('shipping.intlCityPlaceholder')}
                className={`py-3 rounded-xl ${
                  touched.intlCity && intlCityErrorKey ? 'border-red-400 focus:border-red-500 focus:ring-red-500' : ''
                }`}
              />
              {touched.intlCity && intlCityErrorKey && (
                <p className="text-xs text-red-500 mt-1.5">{t(intlCityErrorKey)}</p>
              )}
            </div>
            <div>
              <label className="block text-sm font-medium text-neutral-700 mb-2">
                {t('shipping.intlStateLabel')} <span className="text-neutral-400 font-normal">({t('shipping.optionalTag')})</span>
              </label>
              <Input
                type="text"
                value={data.intlState}
                onChange={(e) => setField('intlState', e.target.value)}
                placeholder={t('shipping.intlStatePlaceholder')}
                className="py-3 rounded-xl"
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-neutral-700 mb-2">
                {t('shipping.intlPostalCodeLabel')} <span className="text-red-500">*</span>
              </label>
              <Input
                type="text"
                value={data.intlPostalCode}
                onChange={(e) => setField('intlPostalCode', e.target.value)}
                onBlur={() => setTouched('intlPostalCode')}
                placeholder={t('shipping.intlPostalCodePlaceholder')}
                className={`py-3 rounded-xl ${
                  touched.intlPostalCode && intlPostalCodeErrorKey ? 'border-red-400 focus:border-red-500 focus:ring-red-500' : ''
                }`}
              />
              {touched.intlPostalCode && intlPostalCodeErrorKey && (
                <p className="text-xs text-red-500 mt-1.5">{t(intlPostalCodeErrorKey)}</p>
              )}
            </div>
          </div>
        )}

        {/* Street Address */}
        <div>
          <label className="block text-sm font-medium text-neutral-700 mb-2">
            {t('shipping.address1Label')} <span className="text-red-500">*</span>
          </label>
          <Textarea
            value={data.address1}
            onChange={(e) => setField('address1', e.target.value)}
            onBlur={() => setTouched('address1')}
            placeholder={t('shipping.address1Placeholder')}
            rows={2}
            className={`py-3 rounded-xl ${
              touched.address1 && address1ErrorKey
                ? 'border-red-400 focus:border-red-500 focus:ring-red-500'
                : ''
            }`}
          />
          {touched.address1 && address1ErrorKey && (
            <p className="text-xs text-red-500 mt-1.5 flex items-center gap-1.5">
              <svg className="w-3.5 h-3.5 flex-shrink-0" fill="currentColor" viewBox="0 0 20 20">
                <path fillRule="evenodd" d="M18 10a8 8 0 11-16 0 8 8 0 0116 0zm-7 4a1 1 0 11-2 0 1 1 0 012 0zm-1-9a1 1 0 00-1 1v4a1 1 0 102 0V6a1 1 0 00-1-1z" clipRule="evenodd" />
              </svg>
              {t(address1ErrorKey)}
            </p>
          )}
        </div>

        {/* Additional Details */}
        <div>
          <label className="block text-sm font-medium text-neutral-700 mb-2">
            {t('shipping.address2Label')} <span className="text-neutral-400 font-normal">({t('shipping.optionalTag')})</span>
          </label>
          <Input
            type="text"
            value={data.notes}
            onChange={(e) => setField('notes', e.target.value)}
            placeholder={t('shipping.address2Placeholder')}
            className="py-3 rounded-xl"
          />
        </div>
      </div>
    </div>
  );
}
