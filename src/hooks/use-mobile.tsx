import * as React from "react";
import { BREAKPOINTS } from "@/lib/constants";

export function useIsMobile() {
  const [isMobile, setIsMobile] = React.useState<boolean>(() => 
    typeof window !== 'undefined' ? window.innerWidth < BREAKPOINTS.MOBILE : false
  );

  React.useEffect(() => {
    if (typeof window === 'undefined') return;

    const mql = window.matchMedia(`(max-width: ${BREAKPOINTS.MOBILE - 1}px)`);
    
    const onChange = (e: MediaQueryListEvent | MediaQueryList) => {
      setIsMobile(e.matches);
    };

    // Initial check
    onChange(mql);

    // Modern event listener
    if (mql.addEventListener) {
      mql.addEventListener('change', onChange);
      return () => mql.removeEventListener('change', onChange);
    } 
    // Fallback for older browsers
    else {
      mql.addListener(onChange);
      return () => mql.removeListener(onChange);
    }
  }, []);

  return isMobile;
}

// In components that fetch data
const [isLoading, setIsLoading] = useState(false);

useEffect(() => {
  setIsLoading(true);
  // Fetch data
  setIsLoading(false);
}, []);

const handleFileImport = (event: React.ChangeEvent<HTMLInputElement>) => {
  const file = event.target.files?.[0];
  if (!file) return;

  // Add file size check
  const MAX_FILE_SIZE = 5 * 1024 * 1024; // 5MB
  if (file.size > MAX_FILE_SIZE) {
    setImportStatus({
      type: 'error',
      message: 'El archivo es demasiado grande. El tamaño máximo es 5MB'
    });
    return;
  }

  // Rest of the code...
};
