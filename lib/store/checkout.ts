import { create } from 'zustand';
import { persist } from 'zustand/middleware';

export interface CheckoutData {
  email: string;
  phone: string;
  fullName: string;
  // Shipping address
  address1: string;          // Street address (manual input)
  address2: string;          // Additional details (RT/RW, patokan, etc)
  notes: string;
  shippingMethod: 'jne-regular' | 'jne-yes' | 'sicepat-reg';
  shippingCostCents: number | null; // Real quoted cost for the selected shippingMethod
  // RajaOngkir destination (subdistrict level)
  rajaongkirCityId: string | null;
  rajaongkirCityName: string | null;  // Full label for display
  rajaongkirProvince: string | null;
  rajaongkirCity: string | null;      // City name
  rajaongkirDistrict: string | null;  // Kecamatan
  rajaongkirSubdistrict: string | null; // Kelurahan
  rajaongkirPostalCode: string | null;
  // API session tracking
  checkoutSessionId: string | null;
}

interface TouchedFields {
  email: boolean;
  phone: boolean;
  fullName: boolean;
  address1: boolean;
  rajaongkirCityId: boolean;
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
  fullName: '',
  address1: '',
  address2: '',
  notes: '',
  shippingMethod: 'jne-regular',
  shippingCostCents: null,
  rajaongkirCityId: null,
  rajaongkirCityName: null,
  rajaongkirProvince: null,
  rajaongkirCity: null,
  rajaongkirDistrict: null,
  rajaongkirSubdistrict: null,
  rajaongkirPostalCode: null,
  checkoutSessionId: null,
};

const initialTouched: TouchedFields = {
  email: false,
  phone: false,
  fullName: false,
  address1: false,
  rajaongkirCityId: false,
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
    }
  )
);
