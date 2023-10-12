import { create } from 'zustand';
import { persist } from 'zustand/middleware';

export interface CheckoutData {
  email: string;
  phone: string;
  fullName: string;
  address1: string;
  address2: string;
  city: string;
  postalCode: string;
  province: string;
  notes: string;
  shippingMethod: 'jne-regular' | 'jne-yes' | 'sicepat-reg';
}

interface CheckoutState {
  data: CheckoutData;
}

interface CheckoutActions {
  setField: <K extends keyof CheckoutData>(field: K, value: CheckoutData[K]) => void;
  setData: (data: Partial<CheckoutData>) => void;
  reset: () => void;
}

const initialData: CheckoutData = {
  email: '',
  phone: '',
  fullName: '',
  address1: '',
  address2: '',
  city: '',
  postalCode: '',
  province: '',
  notes: '',
  shippingMethod: 'jne-regular',
};

export const useCheckoutStore = create<CheckoutState & CheckoutActions>()(
  persist(
    (set) => ({
      data: initialData,

      setField: (field, value) => {
        set((state) => ({
          data: { ...state.data, [field]: value },
        }));
      },

      setData: (data) => {
        set((state) => ({
          data: { ...state.data, ...data },
        }));
      },

      reset: () => {
        set({ data: initialData });
      },
    }),
    {
      name: 'arnes-checkout',
    }
  )
);
