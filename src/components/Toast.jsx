import { useStore } from '../context/StoreContext.jsx';

export default function Toast() {
  const { toast } = useStore();
  if (!toast) return null;
  return (
    <div key={toast.id} role="status" className="fixed bottom-24 left-1/2 z-[60] w-[calc(100%-2rem)] max-w-sm animate-toast-in rounded-2xl bg-stone-900 px-4 py-3 text-center text-sm font-medium text-white shadow-xl lg:bottom-8">
      {toast.message}
    </div>
  );
}
