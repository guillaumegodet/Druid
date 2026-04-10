import React, { useState, useEffect } from 'react';
import { Search, RefreshCw } from 'lucide-react';

interface AddressSearchFieldProps {
  initialValue: string;
  onAddressSelect: (address: { label: string; postcode: string; city: string }) => void;
}

/**
 * Composant de recherche d'adresse via l'API BAN.
 */
export const AddressSearchField: React.FC<AddressSearchFieldProps> = ({ 
  initialValue, 
  onAddressSelect 
}) => {
  const [addressSearch, setAddressSearch] = useState(initialValue);
  const [addressResults, setAddressResults] = useState<any[]>([]);
  const [isSearchingAddress, setIsSearchingAddress] = useState(false);
  const [showAddressDropdown, setShowAddressDropdown] = useState(false);

  useEffect(() => {
    const timer = setTimeout(async () => {
      if (addressSearch.length > 5 && isSearchingAddress) {
        try {
          const resp = await fetch(`https://api-adresse.data.gouv.fr/search/?q=${encodeURIComponent(addressSearch)}&limit=5`);
          if (resp.ok) {
            const data = await resp.json();
            setAddressResults(data.features || []);
            setShowAddressDropdown(true);
          }
        } catch (err) {
          console.error('BAN API Error:', err);
        } finally {
          setIsSearchingAddress(false);
        }
      }
    }, 500);

    return () => clearTimeout(timer);
  }, [addressSearch, isSearchingAddress]);

  const selectAddress = (feature: any) => {
    const { label, postcode, city } = feature.properties;
    setAddressSearch(label);
    onAddressSelect({ label, postcode, city });
    setShowAddressDropdown(false);
  };

  return (
    <div className="relative">
      <label className="block text-[8px] font-bold text-gray-400 uppercase font-mono">ADRESSE (AUTOCCOMPLÉTION BAN)</label>
      <div className="flex gap-2">
        <div className="relative flex-1">
          <input 
            type="text" 
            value={addressSearch} 
            onChange={(e) => {
              setAddressSearch(e.target.value);
              setIsSearchingAddress(true);
            }} 
            className="w-full border-2 border-black dark:border-white p-2 bg-white dark:bg-slate-800 dark:text-white text-[11px] font-bold uppercase shadow-pixel-sm focus:shadow-pixel transition-all" 
            placeholder="EX: 2 RUE DE LA HOUSSINIÈRE..."
          />
          {showAddressDropdown && addressResults.length > 0 && (
            <div className="absolute top-full left-0 right-0 z-50 bg-white dark:bg-slate-800 border-2 border-black dark:border-white shadow-pixel mt-1 max-h-48 overflow-auto">
              {addressResults.map((result, idx) => (
                <button
                  key={idx}
                  onClick={() => selectAddress(result)}
                  className="w-full text-left p-2 text-[10px] font-bold hover:bg-black hover:text-white dark:hover:bg-white dark:hover:text-black border-b border-black/10 dark:border-white/10 last:border-0"
                >
                  {result.properties.label}
                </button>
              ))}
            </div>
          )}
        </div>
        <div className="flex items-center justify-center border-2 border-black dark:border-white px-3 bg-slate-50 dark:bg-slate-900">
          {isSearchingAddress ? <RefreshCw className="w-4 h-4 animate-spin text-gray-400" /> : <Search className="w-4 h-4 text-gray-400" />}
        </div>
      </div>
    </div>
  );
};
