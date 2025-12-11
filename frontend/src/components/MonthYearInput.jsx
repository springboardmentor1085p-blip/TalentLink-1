// frontend/src/components/MonthYearInput.jsx
import { useEffect, useRef, useState } from 'react';
import { Calendar as CalendarIcon, ChevronLeft, ChevronRight } from 'lucide-react';

function pad(n){ return String(n).padStart(2,'0'); }
function parseYM(s){
  if(!s) return null;
  const m = String(s).match(/^(\d{4})-(\d{1,2})$/);
  if(!m) return null;
  const y = Number(m[1]), mo = Number(m[2]);
  if (mo < 1 || mo > 12) return null;
  return { y, m: mo };
}

export default function MonthYearInput({
  value,              // "YYYY-MM"
  onChange,           // (val) => void
  placeholder="YYYY-MM",
  className = ""
}) {
  const [open, setOpen] = useState(false);
  const inputRef = useRef(null);
  const popRef = useRef(null);

  const parsed = parseYM(value) || { y: new Date().getFullYear(), m: (new Date().getMonth()+1) };
  const [viewYear, setViewYear] = useState(parsed.y);

  useEffect(()=> {
    const p = parseYM(value);
    if (p) setViewYear(p.y);
  }, [value]);

  useEffect(() => {
    function onDocClick(e){
      if (!open) return;
      if (popRef.current?.contains(e.target)) return;
      if (inputRef.current?.contains(e.target)) return;
      setOpen(false);
    }
    document.addEventListener('mousedown', onDocClick);
    return () => document.removeEventListener('mousedown', onDocClick);
  }, [open]);

  function pickMonth(mo){
    onChange?.(`${viewYear}-${pad(mo)}`);
    setOpen(false);
  }

  function onIconClick(){
    setOpen(o=>!o);
    const p = parseYM(inputRef.current?.value);
    if (p) setViewYear(p.y);
  }

  return (
    <div className={`relative ${className}`}>
      <div className="relative">
        <input
          ref={inputRef}
          type="text"
          placeholder={placeholder}
          value={value || ""}
          onChange={(e)=> onChange?.(e.target.value)}
          className="w-full px-9 py-2 border rounded-lg text-sm focus:ring-2 focus:ring-purple-500"
        />
        <button
          type="button"
          onClick={onIconClick}
          className="absolute left-2 top-1/2 -translate-y-1/2 p-1 rounded hover:bg-gray-100"
          aria-label="Open month picker"
        >
          <CalendarIcon size={16} className="text-gray-600" />
        </button>
      </div>

      {open && (
        <div ref={popRef} className="absolute z-50 mt-2 w-72 bg-white border rounded-xl shadow-lg p-3">
          {/* Year nav + free input */}
          <div className="flex items-center justify-between mb-2">
            <button
              type="button"
              onClick={()=> setViewYear(y=> y-1)}
              className="p-1 rounded hover:bg-gray-100"
              aria-label="Previous year"
            >
              <ChevronLeft size={18} />
            </button>
            <input
              type="number"
              className="w-24 border rounded px-2 py-1 text-sm text-center"
              value={viewYear}
              onChange={(e)=> setViewYear(Number(e.target.value || 0))}
            />
            <button
              type="button"
              onClick={()=> setViewYear(y=> y+1)}
              className="p-1 rounded hover:bg-gray-100"
              aria-label="Next year"
            >
              <ChevronRight size={18} />
            </button>
          </div>

          {/* Months grid */}
          <div className="grid grid-cols-3 gap-2">
            {['Jan','Feb','Mar','Apr','May','Jun','Jul','Aug','Sep','Oct','Nov','Dec'].map((m, i)=>(
              <button
                key={m}
                type="button"
                onClick={()=> pickMonth(i+1)}
                className={`py-2 rounded border text-sm hover:border-purple-400 hover:bg-purple-50
                  ${parseYM(value)?.y===viewYear && parseYM(value)?.m===i+1 ? 'bg-purple-600 text-white border-purple-600' : 'border-gray-200'}
                `}
              >
                {m}
              </button>
            ))}
          </div>
        </div>
      )}
    </div>
  );
}
