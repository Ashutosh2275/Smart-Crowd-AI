import { useState, useRef, useEffect } from 'react';
import PropTypes from 'prop-types';
import { Search, X, Clock, MapPin } from 'lucide-react';
import { useCrowdData } from '../context/CrowdContext';
import { cn } from '../utils/cn';

export function SearchBar({ value = '', onSelect, placeholder = 'Search for a zone...' }) {
  const { zones } = useCrowdData();
  const [query, setQuery] = useState('');
  const [isOpen, setIsOpen] = useState(false);
  const [selectedIndex, setSelectedIndex] = useState(0);
  const [recentSearches, setRecentSearches] = useState([]);
  const wrapperRef = useRef(null);

  const selectedZone = value ? zones.find(z => z.id === value) : null;
  const displayValue = selectedZone?.name ?? query;

  // Click outside listener masking generic dialog limits
  useEffect(() => {
    const handleClickOutside = (event) => {
      if (wrapperRef.current && !wrapperRef.current.contains(event.target)) {
        setIsOpen(false);
      }
    };
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  // Compute concatenated dropdown limits
  const filteredZones = query === '' 
    ? zones 
    : zones.filter(zone => zone.name.toLowerCase().includes(query.toLowerCase()));

  // Dynamically pack Recent Histories atop generic selections if string is completely empty
  const displayItems = query === '' 
    ? [
        ...recentSearches.map(z => ({ ...z, isRecent: true })), 
        ...zones.filter(z => !recentSearches.some(r => r.id === z.id))
      ]
    : filteredZones;

  const handleSelect = (zone) => {
    onSelect(zone.id);
    setQuery(zone.name);
    setIsOpen(false);
    
    // Validate uniqueness placing history specifically at 0 index bounds
    setRecentSearches(prev => {
      const filtered = prev.filter(p => p.id !== zone.id);
      return [zone, ...filtered].slice(0, 3);
    });
  };

  const handleKeyDown = (e) => {
    if (!isOpen) return;
    
    const maxIndex = displayItems.length > 0 ? displayItems.length - 1 : 0;

    if (e.key === 'ArrowDown') {
      e.preventDefault();
      setSelectedIndex(prev => (prev < maxIndex ? prev + 1 : 0));
    } else if (e.key === 'ArrowUp') {
      e.preventDefault();
      setSelectedIndex(prev => (prev > 0 ? prev - 1 : maxIndex));
    } else if (e.key === 'Enter') {
      e.preventDefault(); // Stop forms from cascading entirely
      if (displayItems[selectedIndex]) {
        handleSelect(displayItems[selectedIndex]);
      }
    } else if (e.key === 'Escape') {
      setIsOpen(false);
    }
  };

  return (
    <div ref={wrapperRef} className="relative w-full">
      <div className={cn(
        "relative flex items-center bg-black/20 border rounded-xl overflow-hidden transition-all",
        isOpen ? "border-primary ring-1 ring-primary/50 shadow-[0_0_15px_rgba(99,102,241,0.15)]" : "border-border/50 hover:border-primary/50"
      )}>
        <div className="pl-4 pr-2 text-primary">
          <Search className="w-4 h-4" />
        </div>
        <input
          type="text"
          value={displayValue}
          onChange={(e) => {
            setQuery(e.target.value);
            setIsOpen(true);
            setSelectedIndex(0);
            if (e.target.value === '') onSelect('');
          }}
          onFocus={() => setIsOpen(true)}
          onKeyDown={handleKeyDown}
          placeholder={placeholder}
          className="w-full bg-transparent border-none py-3.5 outline-none text-white text-sm font-medium placeholder-textMuted"
        />
        {query && (
          <button 
            type="button"
            onClick={() => { setQuery(''); onSelect(''); setIsOpen(true); }}
            className="px-4 text-textMuted hover:text-white transition-colors h-full"
          >
            <X className="w-4 h-4" />
          </button>
        )}
      </div>

      {/* Embedded Autocomplete Terminal Panel */}
      {isOpen && (
        <div className="absolute top-full left-0 right-0 mt-2 bg-background border border-border rounded-xl shadow-2xl overflow-hidden z-50 p-1 flex flex-col max-h-[300px]">
           <div className="overflow-y-auto styled-scrollbar">
              {displayItems.length === 0 ? (
                <div className="px-4 py-8 text-center text-textMuted text-sm">
                  No zones match "<span className="text-white font-bold">{query}</span>"
                </div>
              ) : (
                displayItems.map((zone, index) => {
                   const isRecentNode = zone.isRecent;
                   const isSelected = selectedIndex === index;
                   
                   return (
                     <button
                       key={`node-${zone.id}`}
                       type="button"
                       onClick={() => handleSelect(zone)}
                       onMouseEnter={() => setSelectedIndex(index)}
                       className={cn(
                         "w-full flex justify-between items-center px-4 py-3 rounded-lg text-sm transition-all focus:outline-none border border-transparent",
                         isSelected 
                           ? "bg-primary/20 text-white border-primary/30" 
                           : "text-textMuted hover:bg-surface hover:text-white"
                       )}
                     >
                       <div className="flex items-center gap-2.5">
                         {isRecentNode ? <Clock className={cn("w-4 h-4", isSelected ? "text-primary" : "opacity-50")} /> : <MapPin className={cn("w-4 h-4", isSelected ? "text-primary" : "opacity-50")} />}
                         <span className={cn(isSelected ? "font-bold" : "font-medium")}>{zone.name}</span>
                       </div>
                       {!isRecentNode && query === '' && (
                         <span className="text-[10px] uppercase font-black tracking-widest border border-border/50 bg-black/20 px-2 py-0.5 rounded text-textMuted">
                           ID: {zone.id}
                         </span>
                       )}
                     </button>
                   );
                })
              )}
           </div>
        </div>
      )}
    </div>
  );
}

SearchBar.propTypes = {
  value: PropTypes.string,
  onSelect: PropTypes.func.isRequired,
  placeholder: PropTypes.string,
};
