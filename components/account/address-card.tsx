import { useTranslations } from 'next-intl';
import { cn } from '@/lib/utils/cn';

interface Address {
  id: string;
  name: string;
  firstName: string;
  lastName: string;
  phone: string | null;
  address1: string;
  address2: string | null;
  rajaongkirCityId: string;
  rajaongkirCityName: string | null;
  rajaongkirProvince: string | null;
  rajaongkirCity: string | null;
  rajaongkirDistrict: string | null;
  rajaongkirSubdistrict: string | null;
  rajaongkirPostalCode: string | null;
  isDefault: boolean;
}

interface AddressCardProps {
  address: Address;
  onSetDefault: (id: string) => void;
  onEdit: () => void;
  onDelete: (id: string) => void;
}

export function AddressCard({ address, onSetDefault, onEdit, onDelete }: AddressCardProps) {
  const t = useTranslations('account');
  // Build location string from RajaOngkir fields
  const locationParts = [
    address.rajaongkirSubdistrict,
    address.rajaongkirDistrict,
    address.rajaongkirCity,
  ].filter(Boolean);
  
  const location = locationParts.length > 0 
    ? locationParts.join(', ')
    : address.rajaongkirCityName || '';

  return (
    <div className={cn(
      'bg-neutral-50 p-6 rounded-xl',
      address.isDefault && 'ring-2 ring-neutral-900'
    )}>
      <div className="flex items-center gap-3 mb-3">
        <span className="text-xs font-medium uppercase tracking-wider text-neutral-500">
          {address.name}
        </span>
        {address.isDefault && (
          <span className="inline-flex items-center gap-1.5 text-xs font-medium text-neutral-600">
            <span className="w-1.5 h-1.5 bg-neutral-900 rounded-full" />
            {t('addresses.card.default')}
          </span>
        )}
      </div>

      <p className="font-medium mb-1">
        {address.firstName} {address.lastName}
      </p>
      <p className="text-sm text-neutral-500 mb-2">{address.phone}</p>
      <p className="text-sm text-neutral-600 leading-relaxed">
        {address.address1}
        {address.address2 && <>, {address.address2}</>}
        <br />
        {location}
        {address.rajaongkirPostalCode && <> {address.rajaongkirPostalCode}</>}
        {address.rajaongkirProvince && <>, {address.rajaongkirProvince}</>}
      </p>

      <div className="flex flex-wrap gap-2 mt-4">
        {!address.isDefault && (
          <button
            onClick={() => onSetDefault(address.id)}
            className="px-3 py-1.5 text-sm text-neutral-600 hover:text-neutral-900 transition-colors"
          >
            {t('addresses.card.setDefault')}
          </button>
        )}
        <button
          onClick={onEdit}
          className="px-3 py-1.5 text-sm text-neutral-600 hover:text-neutral-900 transition-colors"
        >
          {t('addresses.card.edit')}
        </button>
        <button
          onClick={() => onDelete(address.id)}
          className="px-3 py-1.5 text-sm text-red-500 hover:text-red-600 transition-colors"
        >
          {t('addresses.card.delete')}
        </button>
      </div>
    </div>
  );
}
