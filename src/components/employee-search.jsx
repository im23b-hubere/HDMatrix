import React, { useState } from 'react';

function EmployeeSearch() {
  const [searchQuery, setSearchQuery] = useState('');
  const [employees, setEmployees] = useState([]);
  const [loading, setLoading] = useState(false);

  const handleSearch = async (e) => {
    e.preventDefault();
    if (!searchQuery.trim()) return;

    setLoading(true);
    try {
      const response = await fetch(`/api/search?query=${encodeURIComponent(searchQuery)}`);
      const data = await response.json();
      setEmployees(data);
    } catch (error) {
      console.error('Error searching employees:', error);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="rounded-lg border bg-card text-card-foreground shadow-sm">
      <div className="p-6">
        <h2 className="text-2xl font-semibold mb-4">Employee Search</h2>
        
        <form onSubmit={handleSearch} className="space-y-4">
          <div className="flex gap-2">
            <input
              type="text"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              placeholder="Search employees..."
              className="flex h-10 w-full rounded-md border border-input bg-background px-3 py-2 text-sm"
            />
            <button
              type="submit"
              disabled={loading}
              className="inline-flex items-center justify-center whitespace-nowrap rounded-md text-sm font-medium h-10 px-4 py-2 bg-primary text-primary-foreground hover:bg-primary/90"
            >
              {loading ? 'Searching...' : 'Search'}
            </button>
          </div>
        </form>

        <div className="mt-6 space-y-4">
          {employees.map((employee) => (
            <div
              key={employee.id}
              className="flex items-start space-x-4 p-4 rounded-lg border bg-background"
            >
              <div className="flex-1">
                <h3 className="font-semibold">{employee.name}</h3>
                <p className="text-sm text-muted-foreground">{employee.department}</p>
                {employee.skills && (
                  <div className="mt-2 flex flex-wrap gap-1">
                    {employee.skills.map((skill) => (
                      <span
                        key={skill}
                        className="inline-flex items-center rounded-full border px-2.5 py-0.5 text-xs font-semibold"
                      >
                        {skill}
                      </span>
                    ))}
                  </div>
                )}
              </div>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}

export default EmployeeSearch;
