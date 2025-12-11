// frontend/src/components/CalendarInput.jsx
import { useEffect, useMemo, useRef, useState } from 'react';
import { Calendar as CalendarIcon, ChevronLeft, ChevronRight } from 'lucide-react';

function pad(n){ return String(n).padStart(2,'0'); }
function parseYMD(s){
  // Accepts YYYY-MM-DD or other; returns Date or null
  if(!s) return null;
  const m = String(s).match(/^(\d{4})-(\d{1,2})-(\d{1,2})$/);
  if(!m) return null;
  const y = Number(m[1]), mo = Number(m[2]) - 1, d = Number(m[3]);
  const dt = new Date(y, mo, d);
  return (dt.getFullYear()===y && dt.getMonth()===mo && dt.getDate()===d) ? dt : null;
}

export default function CalendarInput({
  value,               // "YYYY-MM-DD"
  onChange,            // (val) => void
  placeholder = "YYYY-MM-DD",
  className = "",
  disabled = false     // NEW: support disabled state
}) {
  const [open, setOpen] = useState(false);
  const inputRef = useRef(null);
  const popRef = useRef(null);

  // View state
  const initial = parseYMD(value) || new Date();
  const [viewYear, setViewYear] = useState(initial.getFullYear());
  const [viewMonth, setViewMonth] = useState(initial.getMonth()); // 0..11

  useEffect(() => {
    // When value changes externally, sync view
    const dt = parseYMD(value);
    if (dt) { setViewYear(dt.getFullYear()); setViewMonth(dt.getMonth()); }
  }, [value]);

  // Close on outside click
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

  // Build month grid
  const days = useMemo(() => {
    const first = new Date(viewYear, viewMonth, 1);
    const startDay = first.getDay(); // 0=Sun..6=Sat
    const daysInMonth = new Date(viewYear, viewMonth + 1, 0).getDate();

    const grid = [];
    // prev month fillers
    for(let i=0;i<startDay;i++) grid.push(null);
    // actual days
    for(let d=1; d<=daysInMonth; d++) grid.push(d);
    // pad to full weeks
    while(grid.length % 7 !== 0) grid.push(null);
    return grid;
  }, [viewYear, viewMonth]);

  function pickDay(d){
    if(!d) return;
    const val = `${viewYear}-${pad(viewMonth+1)}-${pad(d)}`;
    onChange?.(val);
    setOpen(false);
  }

  function onIconClick(){
    if (disabled) return; // Don't open if disabled
    setOpen(o => !o);
    
    const dt = parseYMD(inputRef.current?.value);
    if (dt) { setViewYear(dt.getFullYear()); setViewMonth(dt.getMonth()); }
  }

  return (
    <div className={`relative ${className}`}>
      <div className="relative">
        <input
          ref={inputRef}
          type="text"
          placeholder={placeholder}
          value={value || ""}
          onChange={(e)=>onChange?.(e.target.value)}
          disabled={disabled}
          className={`w-full px-9 py-2 border rounded-lg text-sm focus:ring-2 focus:ring-purple-500 ${
            disabled ? 'bg-gray-100 cursor-not-allowed' : ''
          }`}
        />
        <button
          type="button"
          onClick={onIconClick}
          disabled={disabled}
          className={`absolute left-2 top-1/2 -translate-y-1/2 p-1 rounded ${
            disabled ? 'cursor-not-allowed opacity-50' : 'hover:bg-gray-100'
          }`}
          aria-label="Open calendar"
        >
          <CalendarIcon size={16} className="text-gray-600" />
        </button>
      </div>

      {open && !disabled && (
        <div
          ref={popRef}
          className="absolute z-50 mt-2 w-72 bg-white border rounded-xl shadow-lg p-3"
        >
         
          <div className="flex items-center justify-between mb-2">
            <button
              type="button"
              onClick={()=> setViewMonth(m => (m===0 ? (setViewYear(y=>y-1), 11) : m-1))}
              className="p-1 rounded hover:bg-gray-100"
              aria-label="Previous month"
            >
              <ChevronLeft size={18} />
            </button>
            <div className="flex items-center gap-2">
              <select
                className="border rounded px-2 py-1 text-sm"
                value={viewMonth}
                onChange={(e)=> setViewMonth(Number(e.target.value))}
              >
                {['Jan','Feb','Mar','Apr','May','Jun','Jul','Aug','Sep','Oct','Nov','Dec'].map((m,i)=>(
                  <option key={m} value={i}>{m}</option>
                ))}
              </select>
              <input
                type="number"
                className="w-20 border rounded px-2 py-1 text-sm"
                value={viewYear}
                onChange={(e)=> setViewYear(Number(e.target.value || 0))}
              />
            </div>
            <button
              type="button"
              onClick={()=> setViewMonth(m => (m===11 ? (setViewYear(y=>y+1), 0) : m+1))}
              className="p-1 rounded hover:bg-gray-100"
              aria-label="Next month"
            >
              <ChevronRight size={18} />
            </button>
          </div>

          {/* Week header */}
          <div className="grid grid-cols-7 text-[11px] text-gray-500 mb-1">
            {['Su','Mo','Tu','We','Th','Fr','Sa'].map(d => (
              <div key={d} className="text-center py-1">{d}</div>
            ))}
          </div>

          {/* Days grid */}
          <div className="grid grid-cols-7 gap-1">
            {days.map((d, idx)=>(
              <button
                key={idx}
                type="button"
                disabled={!d}
                onClick={()=> pickDay(d)}
                className={`text-sm rounded p-2 h-9
                  ${d ? 'hover:bg-purple-50 hover:text-purple-700' : 'opacity-0 cursor-default'}
                  ${value && parseYMD(value)?.getFullYear()===viewYear &&
                    parseYMD(value)?.getMonth()===viewMonth &&
                    parseYMD(value)?.getDate()===d
                    ? 'bg-purple-600 text-white hover:bg-purple-600'
                    : ''
                  }`}
              >
                {d || ''}
              </button>
            ))}
          </div>
        </div>
      )}
    </div>
  );
}