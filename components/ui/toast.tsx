import { Toaster } from 'sonner';

export function Toast() {
  return (
    <Toaster 
      position="bottom-center" 
      toastOptions={{
        unstyled: true,
        classNames: {
          toast: 'flex items-center gap-3 bg-white rounded-2xl border border-neutral-200 p-4 shadow-lg',
          title: 'text-sm font-medium tracking-tight text-neutral-900',
          description: 'text-sm tracking-tight text-neutral-500',
          success: '',
          error: '',
          actionButton: 'bg-neutral-900 text-white text-sm font-medium tracking-tight px-3 py-1.5 rounded-lg hover:bg-neutral-800 transition-colors',
          cancelButton: 'bg-neutral-100 text-neutral-600 text-sm font-medium tracking-tight px-3 py-1.5 rounded-lg hover:bg-neutral-200 transition-colors',
        },
      }}
      icons={{
        success: (
          <div className="w-8 h-8 rounded-xl bg-green-50 flex items-center justify-center flex-shrink-0">
            <svg className="w-4 h-4 text-green-600" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2.5}>
              <path strokeLinecap="round" strokeLinejoin="round" d="M5 13l4 4L19 7" />
            </svg>
          </div>
        ),
        error: (
          <div className="w-8 h-8 rounded-xl bg-red-50 flex items-center justify-center flex-shrink-0">
            <svg className="w-4 h-4 text-red-600" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2.5}>
              <path strokeLinecap="round" strokeLinejoin="round" d="M6 18L18 6M6 6l12 12" />
            </svg>
          </div>
        ),
        warning: (
          <div className="w-8 h-8 rounded-xl bg-amber-50 flex items-center justify-center flex-shrink-0">
            <svg className="w-4 h-4 text-amber-600" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2.5}>
              <path strokeLinecap="round" strokeLinejoin="round" d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z" />
            </svg>
          </div>
        ),
        info: (
          <div className="w-8 h-8 rounded-xl bg-blue-50 flex items-center justify-center flex-shrink-0">
            <svg className="w-4 h-4 text-blue-600" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2.5}>
              <path strokeLinecap="round" strokeLinejoin="round" d="M13 16h-1v-4h-1m1-4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
            </svg>
          </div>
        ),
      }}
    />
  );
}
