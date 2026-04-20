export function buildQueryParams(params = {}) {
  const searchParams = new URLSearchParams();
  Object.entries(params).forEach(([key, value]) => {
    if (value === undefined || value === null || value === "") return;
    searchParams.append(key, String(value));
  });
  const qs = searchParams.toString();
  return qs ? `?${qs}` : "";
}

export function normalizePaginatedResponse(data) {
  if (Array.isArray(data)) {
    return { results: data, pagination: null, filters: null, stats: null };
  }

  if (data && Array.isArray(data.results)) {
    return {
      results: data.results,
      pagination: data.pagination ?? null,
      filters: data.filters ?? null,
      stats: data.stats ?? null,
    };
  }

  return { results: [], pagination: null, filters: null, stats: null };
}
