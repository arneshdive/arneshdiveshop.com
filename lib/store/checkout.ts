import { create } from 'zustand';
import { persist } from 'zustand/middleware';

export interface CheckoutData {
  email: string;
  phone: string;
  firstName: string;
  lastName: string;
  // Shipping address
  address1: string;          // Street address (manual input)
  address2: string;          // Additional details (RT/RW, patokan, etc)
  notes: string;
  shippingMethod: string; // '<courier>-<service>', e.g. 'jne-regular' or 'dhlexpress-priority'
  shippingCostCents: number | null; // Real quoted cost for the selected shippingMethod
  // Destination country - 'ID' (Indonesia) uses the RajaOngkir fields below;
  // anything else uses the international fields and FedEx for rates.
  countryCode: string;
  country: string; // Display name, e.g. "Indonesia" or "Singapore"
  // RajaOngkir destination (subdistrict level) - only used when countryCode === 'ID'
  rajaongkirCityId: string | null;
  rajaongkirCityName: string | null;  // Full label for display
  rajaongkirProvince: string | null;
  rajaongkirCity: string | null;      // City name
  rajaongkirDistrict: string | null;  // Kecamatan
  rajaongkirSubdistrict: string | null; // Kelurahan
  rajaongkirPostalCode: string | null;
  // International destination - only used when countryCode !== 'ID'
  intlCity: string;
  intlState: string;
  intlPostalCode: string;
  // API session tracking
  checkoutSessionId: string | null;
}

interface TouchedFields {
  email: boolean;
  phone: boolean;
  firstName: boolean;
  lastName: boolean;
  address1: boolean;
  rajaongkirCityId: boolean;
  intlCity: boolean;
  intlPostalCode: boolean;
}

interface CheckoutState {
  data: CheckoutData;
  touched: TouchedFields;
}

interface CheckoutActions {
  setField: <K extends keyof CheckoutData>(field: K, value: CheckoutData[K]) => void;
  setTouched: (field: keyof TouchedFields) => void;
  setData: (data: Partial<CheckoutData>) => void;
  reset: () => void;
}

const initialData: CheckoutData = {
  email: '',
  phone: '',
  firstName: '',
  lastName: '',
  address1: '',
  address2: '',
  notes: '',
  shippingMethod: 'jne-regular',
  shippingCostCents: null,
  countryCode: 'ID',
  country: 'Indonesia',
  rajaongkirCityId: null,
  rajaongkirCityName: null,
  rajaongkirProvince: null,
  rajaongkirCity: null,
  rajaongkirDistrict: null,
  rajaongkirSubdistrict: null,
  rajaongkirPostalCode: null,
  intlCity: '',
  intlState: '',
  intlPostalCode: '',
  checkoutSessionId: null,
};

const initialTouched: TouchedFields = {
  email: false,
  phone: false,
  firstName: false,
  lastName: false,
  address1: false,
  rajaongkirCityId: false,
  intlCity: false,
  intlPostalCode: false,
};

export const useCheckoutStore = create<CheckoutState & CheckoutActions>()(
  persist(
    (set) => ({
      data: initialData,
      touched: initialTouched,

      setField: (field, value) => {
        set((state) => ({
          data: { ...state.data, [field]: value },
        }));
      },

      setTouched: (field) => {
        set((state) => ({
          touched: { ...state.touched, [field]: true },
        }));
      },

      setData: (data) => {
        set((state) => ({
          data: { ...state.data, ...data },
        }));
      },

      reset: () => {
        set({ data: initialData, touched: initialTouched });
      },
    }),
    {
      name: 'arnes-checkout',
      // Persist merges only the top level by default. Old `data` must not
      // replace new defaults (country and international fields in particular).
      merge: (persistedState, currentState) => {
        const persisted = persistedState as {
          data?: Partial<CheckoutData> & { fullName?: string };
          touched?: Partial<TouchedFields>;
        } | undefined;
        const savedData = persisted?.data;
        const [legacyFirstName = '', ...legacyLastName] = (savedData?.fullName || '').trim().split(/\s+/);
        return {
          ...currentState,
          data: {
            ...initialData,
            ...savedData,
            firstName: savedData?.firstName ?? legacyFirstName,
            lastName: savedData?.lastName ?? legacyLastName.join(' '),
          },
          touched: { ...initialTouched, ...persisted?.touched },
        };
      },
    }
  )
);
