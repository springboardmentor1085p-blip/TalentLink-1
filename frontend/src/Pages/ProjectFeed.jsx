import { useState, useEffect } from "react";
import { Search, X, Filter } from "lucide-react";
import ProjectCard from "../components/ProjectCard";
import { projectsAPI } from "../api/projects";

const DURATION = [
  { value: "less_1_month", label: "Less than 1 month" },
  { value: "1_3_months", label: "1 - 3 months" },
  { value: "3_6_months", label: "3 - 6 months" },
  { value: "6_plus_months", label: "6+ months" }
];

const HOURS_PER_WEEK = [
  { value: "less_30", label: "Less than 30 hrs/week" },
  { value: "more_30", label: "More than 30 hrs/week" }
];

const PROPOSALS = [
  { value: "0", label: "0 proposals" },
  { value: "1_5", label: "1 - 5" },
  { value: "6_15", label: "6 - 15" },
  { value: "15_30", label: "15 - 30" },
  { value: "30_plus", label: "30+" }
];

const JOB_TYPES = [
  { value: "hourly", label: "Hourly" },
  { value: "fixed", label: "Fixed Price" }
];

const FIXED_PAYMENT = [
  { value: "less_1000", label: "Less than ₹1,000" },
  { value: "1000_5000", label: "₹1,000 - ₹5,000" },
  { value: "5000_10000", label: "₹5,000 - ₹10,000" },
  { value: "10000_25000", label: "₹10,000 - ₹25,000" },
  { value: "25000_plus", label: "₹25,000+" }
];

const EXPERIENCE_LEVEL = [
  { value: "entry", label: "Entry Level" },
  { value: "intermediate", label: "Intermediate" },
  { value: "expert", label: "Expert" }
];

const CLIENT_HISTORY = [
  { value: "no_hires", label: "No hires yet" },
  { value: "1_9_hires", label: "1-9 hires" },
  { value: "10_plus_hires", label: "10+ hires" }
];

const POSTED_TIME = [
  { value: "24h", label: "Last 24 hours" },
  { value: "week", label: "Last week" },
  { value: "month", label: "Last month" }
];

const LOCATION_TYPE = [
  { value: "remote", label: "Remote" },
  { value: "hybrid", label: "Hybrid" },
  { value: "onsite", label: "Onsite" }
];

const CATEGORIES = [
  {
    group: "Accounting & Consulting",
    items: [
      "All - Accounting & Consulting",
      "Personal & Professional Coaching",
      "Accounting & Bookkeeping",
      "Financial Planning",
      "Recruiting & Human Resources",
      "Management Consulting & Analysis",
      "Other - Accounting & Consulting"
    ]
  },
  {
    group: "Admin Support",
    items: [
      "All - Admin Support",
      "Data Entry & Transcription Services",
      "Virtual Assistance",
      "Project Management",
      "Market Research & Product Reviews"
    ]
  },
  {
    group: "Customer Service",
    items: [
      "All - Customer Service",
      "Community Management & Tagging",
      "Customer Service & Tech Support"
    ]
  },
  {
    group: "Data Science & Analytics",
    items: [
      "All - Data Science & Analytics",
      "Data Analysis & Testing",
      "Data Extraction/ETL",
      "Data Mining & Management",
      "AI & Machine Learning"
    ]
  },
  {
    group: "Design & Creative",
    items: [
      "All - Design & Creative",
      "Art & Illustration",
      "Audio & Music Production",
      "Branding & Logo Design",
      "NFT, AR/VR & Game Art",
      "Graphic, Editorial & Presentation Design",
      "Performing Arts",
      "Photography",
      "Product Design",
      "Video & Animation"
    ]
  },
  {
    group: "Engineering & Architecture",
    items: [
      "All - Engineering & Architecture",
      "Building & Landscape Architecture",
      "Chemical Engineering",
      "Civil & Structural Engineering",
      "Contract Manufacturing",
      "Electrical & Electronic Engineering",
      "Interior & Trade Show Design",
      "Energy & Mechanical Engineering",
      "Physical Sciences",
      "3D Modeling & CAD"
    ]
  },
  {
    group: "IT & Networking",
    items: [
      "All - IT & Networking",
      "Database Management & Administration",
      "ERP/CRM Software",
      "Information Security & Compliance",
      "Network & System Administration",
      "DevOps & Solution Architecture"
    ]
  },
  {
    group: "Legal",
    items: [
      "All - Legal",
      "Corporate & Contract Law",
      "International & Immigration Law",
      "Finance & Tax Law",
      "Public Law"
    ]
  },
  {
    group: "Sales & Marketing",
    items: [
      "All - Sales & Marketing",
      "Digital Marketing",
      "Lead Generation & Telemarketing",
      "Marketing, PR & Brand Strategy"
    ]
  },
  {
    group: "Translation",
    items: [
      "All - Translation",
      "Language Tutoring & Interpretation",
      "Translation & Localization Services"
    ]
  },
  {
    group: "Web, Mobile & Software Dev",
    items: [
      "All - Web, Mobile & Software Dev",
      "Blockchain, NFT & Cryptocurrency",
      "AI Apps & Integration",
      "Desktop Application Development",
      "Ecommerce Development",
      "Game Design & Development",
      "Mobile Development",
      "Other - Software Development",
      "Product Management & Scrum",
      "QA Testing",
      "Scripts & Utilities",
      "Web & Mobile Design",
      "Web Development"
    ]
  },
  {
    group: "Writing",
    items: [
      "All - Writing",
      "Sales & Marketing Copywriting",
      "Content Writing",
      "Editing & Proofreading Services",
      "Professional & Business Writing"
    ]
  }
];

function HourlyInputs({ min, max, setMin, setMax }) {
  return (
    <div className="mt-2 ml-4">
      <label className="block text-xs font-semibold mb-1 text-gray-600">
        Hourly Rate (₹/hr)
      </label>
      <div className="flex gap-2">
        <input
          type="number"
          placeholder="Min"
          value={min}
          min={0}
          onChange={e => setMin(e.target.value)}
          className="border p-2 rounded w-1/2 text-sm focus:outline-none focus:ring-2 focus:ring-purple-500"
        />
        <input
          type="number"
          placeholder="Max"
          value={max}
          min={0}
          onChange={e => setMax(e.target.value)}
          className="border p-2 rounded w-1/2 text-sm focus:outline-none focus:ring-2 focus:ring-purple-500"
        />
      </div>
    </div>
  );
}

// Category Dropdown Component
function CategoryDropdown({ selected, onSelect }) {
  const [open, setOpen] = useState(false);
  const [categorySearch, setCategorySearch] = useState("");

  const filteredCategories = CATEGORIES.map(cat => ({
    ...cat,
    items: cat.items.filter(item =>
      item.toLowerCase().includes(categorySearch.toLowerCase())
    )
  })).filter(cat => cat.items.length > 0);

  const selectedLabel = selected || "Select Categories";

  return (
    <div className="relative">
      <div className="flex items-center gap-2">
        <button
          type="button"
          onClick={() => setOpen(!open)}
          className="w-full px-4 py-2.5 text-sm border border-gray-300 rounded-lg text-left bg-white hover:border-purple-400 focus:ring-2 focus:ring-purple-400 focus:outline-none flex justify-between items-center"
        >
          <span className={selected ? "text-gray-900" : "text-gray-500"}>
            {selectedLabel}
          </span>
          <svg
            className={`w-4 h-4 transition-transform ${open ? "rotate-180" : ""}`}
            fill="none"
            stroke="currentColor"
            viewBox="0 0 24 24"
          >
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
          </svg>
        </button>

        {selected && (
          <button
            type="button"
            onClick={() => onSelect("")}
            className="text-xs text-purple-600 hover:text-purple-800 bg-purple-50 border border-purple-200 px-2.5 py-1 rounded-md transition"
            title="Clear selected category"
          >
            Clear
          </button>
        )}
      </div>

      {open && (
        <>
          <div
            className="fixed inset-0 z-10"
            onClick={() => setOpen(false)}
          />
          <div className="absolute z-20 w-full mt-2 bg-white border border-gray-300 rounded-lg shadow-lg max-h-96 overflow-auto">
            <div className="sticky top-0 bg-white p-3 border-b">
              <div className="relative">
                <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400" size={16} />
                <input
                  type="text"
                  placeholder="Search categories..."
                  value={categorySearch}
                  onChange={e => setCategorySearch(e.target.value)}
                  className="w-full pl-10 pr-3 py-2 text-sm border border-gray-300 rounded-lg focus:ring-2 focus:ring-purple-400 focus:outline-none"
                  onClick={e => e.stopPropagation()}
                />
              </div>
            </div>

            <div className="p-2">
              {filteredCategories.map(category => (
                <div key={category.group} className="mb-3">
                  <div className="px-3 py-2 text-xs font-bold text-gray-500 uppercase tracking-wide">
                    {category.group}
                  </div>
                  {category.items.map(item => (
                    <button
                      key={item}
                      type="button"
                      onClick={() => {
                        onSelect(item);
                        setOpen(false);
                        setCategorySearch("");
                      }}
                      className={`w-full text-left px-3 py-2 text-sm rounded hover:bg-purple-50 ${
                        selected === item ? "bg-purple-100 text-purple-700 font-medium" : "text-gray-700"
                      }`}
                    >
                      {item}
                    </button>
                  ))}
                </div>
              ))}
              {filteredCategories.length === 0 && (
                <div className="px-3 py-4 text-center text-gray-500 text-sm">
                  No categories found
                </div>
              )}
            </div>
          </div>
        </>
      )}
    </div>
  );
}


export default function ProjectFeed() {
  const [projects, setProjects] = useState([]);
  const [searchTerm, setSearchTerm] = useState("");
  const [selectedCategory, setSelectedCategory] = useState("");
  const [duration, setDuration] = useState([]);
  const [hoursPerWeek, setHoursPerWeek] = useState([]);
  const [proposals, setProposals] = useState([]);
  const [jobTypes, setJobTypes] = useState([]);
  const [fixedPayment, setFixedPayment] = useState([]);
  const [hourlyMin, setHourlyMin] = useState("");
  const [hourlyMax, setHourlyMax] = useState("");
  const [experienceLevel, setExperienceLevel] = useState([]);
  const [clientHistory, setClientHistory] = useState([]);
  const [postedTime, setPostedTime] = useState("");
  const [locationType, setLocationType] = useState([]);
  const [clientLocation, setClientLocation] = useState("");
  const [paymentVerified, setPaymentVerified] = useState(false);
  const [loading, setLoading] = useState(true);

  const handleCheckbox = (arr, setArr, v) => {
    setArr(arr.includes(v) ? arr.filter(x => x !== v) : [...arr, v]);
  };

  const clearAllFilters = () => {
    setDuration([]);
    setHoursPerWeek([]);
    setProposals([]);
    setJobTypes([]);
    setFixedPayment([]);
    setHourlyMin("");
    setHourlyMax("");
    setSelectedCategory("");
    setExperienceLevel([]);
    setClientHistory([]);
    setPostedTime("");
    setLocationType([]);
    setClientLocation("");
    setPaymentVerified(false);
  };

  const clearSearch = () => {
    setSearchTerm('');
  };

  useEffect(() => {
    setLoading(true);

    const filterParams = {
      status: "open",
      search: searchTerm,
      duration: duration.join(","),
      hours_per_week: hoursPerWeek.join(","),
      proposal_range: proposals.join(","),
      job_type: jobTypes.join(","),
      category: selectedCategory,
      experience_level: experienceLevel.join(","),
      client_history: clientHistory.join(","),
      posted_time: postedTime,
      location_type: locationType.join(","),
      client_location: clientLocation,
      payment_verified: paymentVerified
    };

    if (jobTypes.includes("fixed")) {
      filterParams.fixed_payment = fixedPayment.join(",");
    }

    if (jobTypes.includes("hourly")) {
      if (hourlyMin) filterParams.hourly_min = hourlyMin;
      if (hourlyMax) filterParams.hourly_max = hourlyMax;
    }

    projectsAPI
      .list(filterParams)
      .then(res => {
        const projectData = res.data.results || res.data;
        setProjects(projectData);
      })
      .catch(err => {
        console.error("Error fetching projects:", err);
        setProjects([]);
      })
      .finally(() => setLoading(false));
  }, [
    duration,
    hoursPerWeek,
    proposals,
    jobTypes,
    fixedPayment,
    hourlyMin,
    hourlyMax,
    searchTerm,
    selectedCategory,
    experienceLevel,
    clientHistory,
    postedTime,
    locationType,
    clientLocation,
    paymentVerified
  ]);

  return (
    <div className="min-h-screen bg-gray-50 py-6">
      <div className="container mx-auto px-4">
        {/* Header */}
        <div className="mb-6">
          <h1 className="text-3xl font-bold text-gray-900 mb-2">Browse Projects</h1>
          <p className="text-gray-600">Find your next opportunity</p>
        </div>

        {/* Search & Category Section */}
        <div className="bg-white rounded-lg shadow-md p-5 mb-6">
          <div className="grid md:grid-cols-2 gap-4">
            {/* Search Input */}
            <div>
              <label className="block text-sm font-semibold text-gray-700 mb-2">
                Search by keyword or skill
              </label>
              <div className="relative">
                <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400" size={18} />
                <input
                  type="text"
                  placeholder="🔍 Enter keyword, skill, or project title..."
                  value={searchTerm}
                  onChange={e => setSearchTerm(e.target.value)}
                  className="w-full pl-10 pr-10 py-2.5 text-sm border border-gray-300 rounded-lg focus:ring-2 focus:ring-purple-400 focus:outline-none"
                />
                {searchTerm && (
                  <button
                    onClick={clearSearch}
                    className="absolute right-3 top-1/2 transform -translate-y-1/2 text-gray-400 hover:text-gray-600"
                  >
                    <X size={18} />
                  </button>
                )}
              </div>
            </div>

            {/* Category Dropdown */}
            <div>
              <label className="block text-sm font-semibold text-gray-700 mb-2">
                Category
              </label>
              <CategoryDropdown
                selected={selectedCategory}
                onSelect={setSelectedCategory}
              />
            </div>
          </div>
        </div>

        {/* Filters & Results */}
        <div className="flex gap-6">
          {/* FILTER SIDEBAR */}
          <aside className="w-72 bg-white rounded-lg shadow-md p-5 shrink-0 h-fit sticky top-20">
            <div className="flex justify-between items-center mb-5 pb-4 border-b border-gray-200">
              <h3 className="font-semibold text-base text-gray-900 flex items-center gap-2">
                <Filter size={18} />
                Filters
              </h3>
              <button
                type="button"
                className="text-xs bg-purple-100 hover:bg-purple-200 text-purple-700 font-semibold px-3 py-1.5 rounded-md transition"
                onClick={clearAllFilters}
              >
                Clear All
              </button>
            </div>

            {/* Experience Level */}
            <div className="mb-5">
              <div className="text-sm font-semibold text-gray-800 mb-3">
                Experience Level
              </div>
              {EXPERIENCE_LEVEL.map(o => (
                <label
                  key={o.value}
                  className="flex items-center ml-2 py-2 cursor-pointer hover:bg-purple-50 rounded px-2 transition"
                >
                  <input
                    type="checkbox"
                    checked={experienceLevel.includes(o.value)}
                    onChange={() => handleCheckbox(experienceLevel, setExperienceLevel, o.value)}
                    className="mr-3 w-4 h-4 accent-purple-600 cursor-pointer"
                  />
                  <span className="text-sm text-gray-700">{o.label}</span>
                </label>
              ))}
            </div>

            <div className="border-t border-gray-200 my-4" />

            {/* Project Length */}
            <div className="mb-5">
              <div className="text-sm font-semibold text-gray-800 mb-3">
                Project Length
              </div>
              {DURATION.map(o => (
                <label
                  key={o.value}
                  className="flex items-center ml-2 py-2 cursor-pointer hover:bg-purple-50 rounded px-2 transition"
                >
                  <input
                    type="checkbox"
                    checked={duration.includes(o.value)}
                    onChange={() => handleCheckbox(duration, setDuration, o.value)}
                    className="mr-3 w-4 h-4 accent-purple-600 cursor-pointer"
                  />
                  <span className="text-sm text-gray-700">{o.label}</span>
                </label>
              ))}
            </div>

            <div className="border-t border-gray-200 my-4" />

            {/* Client History */}
            <div className="mb-5">
              <div className="text-sm font-semibold text-gray-800 mb-3">
                Client History
              </div>
              {CLIENT_HISTORY.map(o => (
                <label
                  key={o.value}
                  className="flex items-center ml-2 py-2 cursor-pointer hover:bg-purple-50 rounded px-2 transition"
                >
                  <input
                    type="checkbox"
                    checked={clientHistory.includes(o.value)}
                    onChange={() => handleCheckbox(clientHistory, setClientHistory, o.value)}
                    className="mr-3 w-4 h-4 accent-purple-600 cursor-pointer"
                  />
                  <span className="text-sm text-gray-700">{o.label}</span>
                </label>
              ))}
            </div>

            <div className="border-t border-gray-200 my-4" />

            {/* Payment Verified */}
            <div className="mb-5">
              <label className="flex items-center ml-2 py-2 cursor-pointer hover:bg-purple-50 rounded px-2 transition">
                <input
                  type="checkbox"
                  checked={paymentVerified}
                  onChange={(e) => setPaymentVerified(e.target.checked)}
                  className="mr-3 w-4 h-4 accent-purple-600 cursor-pointer"
                />
                <span className="text-sm font-semibold text-gray-800">Payment Verified Clients</span>
              </label>
            </div>

            <div className="border-t border-gray-200 my-4" />

            {/* Posted Time */}
            <div className="mb-5">
              <div className="text-sm font-semibold text-gray-800 mb-3">
                Posted Time
              </div>
              <select
                value={postedTime}
                onChange={(e) => setPostedTime(e.target.value)}
                className="w-full px-3 py-2 text-sm border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-purple-500"
              >
                <option value="">Any time</option>
                {POSTED_TIME.map(o => (
                  <option key={o.value} value={o.value}>{o.label}</option>
                ))}
              </select>
            </div>

            <div className="border-t border-gray-200 my-4" />

            {/* Location Type */}
            <div className="mb-5">
              <div className="text-sm font-semibold text-gray-800 mb-3">
                Location Type
              </div>
              {LOCATION_TYPE.map(o => (
                <label
                  key={o.value}
                  className="flex items-center ml-2 py-2 cursor-pointer hover:bg-purple-50 rounded px-2 transition"
                >
                  <input
                    type="checkbox"
                    checked={locationType.includes(o.value)}
                    onChange={() => handleCheckbox(locationType, setLocationType, o.value)}
                    className="mr-3 w-4 h-4 accent-purple-600 cursor-pointer"
                  />
                  <span className="text-sm text-gray-700">{o.label}</span>
                </label>
              ))}
            </div>

            <div className="border-t border-gray-200 my-4" />

            {/* Client Location */}
            <div className="mb-5">
              <div className="text-sm font-semibold text-gray-800 mb-3">
                Client Location
              </div>
              <input
                type="text"
                placeholder="Enter location..."
                value={clientLocation}
                onChange={(e) => setClientLocation(e.target.value)}
                className="w-full px-3 py-2 text-sm border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-purple-500"
              />
            </div>

            <div className="border-t border-gray-200 my-4" />

            {/* Hours per Week */}
            <div className="mb-5">
              <div className="text-sm font-semibold text-gray-800 mb-3">
                Hours / Week
              </div>
              {HOURS_PER_WEEK.map(o => (
                <label
                  key={o.value}
                  className="flex items-center ml-2 py-2 cursor-pointer hover:bg-purple-50 rounded px-2 transition"
                >
                  <input
                    type="checkbox"
                    checked={hoursPerWeek.includes(o.value)}
                    onChange={() =>
                      handleCheckbox(hoursPerWeek, setHoursPerWeek, o.value)
                    }
                    className="mr-3 w-4 h-4 accent-purple-600 cursor-pointer"
                  />
                  <span className="text-sm text-gray-700">{o.label}</span>
                </label>
              ))}
            </div>

            <div className="border-t border-gray-200 my-4" />

            {/* Proposal Count */}
            <div className="mb-5">
              <div className="text-sm font-semibold text-gray-800 mb-3">
                Number of Proposals
              </div>
              {PROPOSALS.map(o => (
                <label
                  key={o.value}
                  className="flex items-center ml-2 py-2 cursor-pointer hover:bg-purple-50 rounded px-2 transition"
                >
                  <input
                    type="checkbox"
                    checked={proposals.includes(o.value)}
                    onChange={() => handleCheckbox(proposals, setProposals, o.value)}
                    className="mr-3 w-4 h-4 accent-purple-600 cursor-pointer"
                  />
                  <span className="text-sm text-gray-700">{o.label}</span>
                </label>
              ))}
            </div>

            <div className="border-t border-gray-200 my-4" />

            {/* Job Type & Payment */}
            <div className="mb-5">
              <div className="text-sm font-semibold text-gray-800 mb-3">
                Job Type & Payment
              </div>
              {JOB_TYPES.map(o => (
                <label
                  key={o.value}
                  className="flex items-center ml-2 py-2 cursor-pointer hover:bg-purple-50 rounded px-2 transition"
                >
                  <input
                    type="checkbox"
                    checked={jobTypes.includes(o.value)}
                    onChange={() => handleCheckbox(jobTypes, setJobTypes, o.value)}
                    className="mr-3 w-4 h-4 accent-purple-600 cursor-pointer"
                  />
                  <span className="text-sm font-semibold text-gray-700">{o.label}</span>
                </label>
              ))}

              {jobTypes.includes("hourly") && (
                <HourlyInputs
                  min={hourlyMin}
                  max={hourlyMax}
                  setMin={setHourlyMin}
                  setMax={setHourlyMax}
                />
              )}

              {jobTypes.includes("fixed") && (
                <div className="mt-3 ml-4">
                  <div className="text-xs font-semibold mb-2 text-gray-600">
                    Fixed Price Ranges
                  </div>
                  {FIXED_PAYMENT.map(o => (
                    <label
                      key={o.value}
                      className="flex items-center py-1.5 cursor-pointer hover:bg-purple-50 rounded px-2 transition"
                    >
                      <input
                        type="checkbox"
                        checked={fixedPayment.includes(o.value)}
                        onChange={() =>
                          handleCheckbox(fixedPayment, setFixedPayment, o.value)
                        }
                        className="mr-2 w-4 h-4 accent-purple-600 cursor-pointer"
                      />
                      <span className="text-sm text-gray-700">{o.label}</span>
                    </label>
                  ))}
                </div>
              )}
            </div>
          </aside>

          {/* PROJECT RESULTS */}
          <main className="flex-1">
            {loading ? (
              <div className="text-center py-16">
                <div className="inline-block animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-purple-600"></div>
                <p className="mt-4 text-gray-600">Loading projects...</p>
              </div>
            ) : projects.length === 0 ? (
              <div className="text-center py-16 bg-white rounded-lg shadow-md">
                <Search size={48} className="mx-auto text-gray-300 mb-4" />
                <h3 className="text-lg font-semibold text-gray-900 mb-2">No projects found</h3>
                <p className="text-gray-600 mb-4">Try adjusting your filters or search terms</p>
                <button
                  onClick={clearAllFilters}
                  className="px-5 py-2 bg-purple-600 text-white text-sm font-medium rounded-lg hover:bg-purple-700 transition"
                >
                  Clear Filters
                </button>
              </div>
            ) : (
              <>
                <div className="mb-4 text-sm text-gray-600">
                  <span className="font-semibold text-gray-900">{projects.length}</span>{" "}
                  project{projects.length !== 1 ? "s" : ""} found
                </div>
                <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-5">
                  {projects.map(project => (
                    <div key={project.id} className="transition hover:scale-[1.02]">
                      <ProjectCard project={project} />
                    </div>
                  ))}
                </div>
              </>
            )}
          </main>
        </div>
      </div>
    </div>
  );
}