import { siteConfig } from '@/config/site';

interface PublicBusinessSettings {
  storeName: string;
  phone: string;
  businessHours: string;
  addressStreet: string | null;
  addressCity: string | null;
  addressProvince: string | null;
  addressPostalCode: string | null;
  addressCountry: string | null;
}

const days: Record<string, string> = {
  senin: 'Monday', selasa: 'Tuesday', rabu: 'Wednesday',
  kamis: 'Thursday', jumat: 'Friday', sabtu: 'Saturday', minggu: 'Sunday',
};

// Only describe schedules explicitly present in settings. Do not guess hours,
// closed days, a timezone, or a schedule when an admin enters unrecognised text.
function openingHours(businessHours: string) {
  return businessHours.split('\n').flatMap((line) => {
    const match = line.trim().toLowerCase().match(
      /^(senin|selasa|rabu|kamis|jumat|sabtu|minggu)(?:\s*[–-]\s*(senin|selasa|rabu|kamis|jumat|sabtu|minggu))?\s*:\s*([01]\d|2[0-3]):([0-5]\d)\s*[–-]\s*([01]\d|2[0-3]):([0-5]\d)$/,
    );
    if (!match) return [];
    const start = match[1]!;
    const [, , end, openHour, openMinute, closeHour, closeMinute] = match;
    const dayNames = Object.keys(days);
    const startIndex = dayNames.indexOf(start);
    const endIndex = dayNames.indexOf(end || start);
    if (endIndex < startIndex) return [];
    return [{
      '@type': 'OpeningHoursSpecification',
      dayOfWeek: dayNames.slice(startIndex, endIndex + 1).map((day) => `https://schema.org/${days[day]}`),
      opens: `${openHour}:${openMinute}`,
      closes: `${closeHour}:${closeMinute}`,
    }];
  });
}

export function getBusinessJsonLd(settings: PublicBusinessSettings) {
  const digits = settings.phone.replace(/\D/g, '');
  const telephone = digits.startsWith('0') ? `+62${digits.slice(1)}` : `+${digits}`;
  const hours = openingHours(settings.businessHours);

  return {
    '@context': 'https://schema.org',
    '@type': 'SportingGoodsStore',
    '@id': `${siteConfig.url}/#store`,
    name: settings.storeName,
    // The storefront alias makes no claim about the owner's legal entity.
    alternateName: siteConfig.sellerName,
    url: siteConfig.url,
    logo: `${siteConfig.url}/icon.png`,
    ...(digits ? { telephone } : {}),
    ...(settings.addressStreet ? {
      address: {
        '@type': 'PostalAddress',
        streetAddress: settings.addressStreet,
        ...(settings.addressCity ? { addressLocality: settings.addressCity } : {}),
        ...(settings.addressProvince ? { addressRegion: settings.addressProvince } : {}),
        ...(settings.addressPostalCode ? { postalCode: settings.addressPostalCode } : {}),
        ...(settings.addressCountry ? { addressCountry: settings.addressCountry } : {}),
      },
    } : {}),
    ...(hours.length ? { openingHoursSpecification: hours } : {}),
    brand: {
      '@type': 'Brand',
      name: siteConfig.name,
      url: siteConfig.url,
      sameAs: siteConfig.links.instagram,
    },
    sameAs: [
      siteConfig.links.instagram,
      siteConfig.links.haesteInstagram,
      siteConfig.links.shopee,
      siteConfig.links.tokopedia,
    ],
  };
}
