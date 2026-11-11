import React, { useEffect, useMemo, useState } from 'react';
import { useLanguage } from '../../context/LanguageContext';
import api from '../../services/api';

const Routes = () => {
  const { t } = useLanguage();

  const [routes, setRoutes] = useState([]);
  const [search, setSearch] = useState('');
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [expandedRoute, setExpandedRoute] = useState(null);

  const normalizeRoute = (route = {}, index = 0) => {
    const startPoint =
      route.startPoint ||
      route.origin ||
      route.source?.name ||
      route.from ||
      'Not specified';

    const endPoint =
      route.endPoint ||
      route.destination ||
      route.destination?.name ||
      route.to ||
      'Not specified';

    const orderedStops = Array.isArray(route.orderedStops)
      ? route.orderedStops.map((stop) => stop?.name || stop)
      : Array.isArray(route.stops)
        ? route.stops.map((stop) =>
            typeof stop === 'string' ? stop : stop?.name || stop?.stopName || 'Unknown stop'
          )
        : [];

    return {
      ...route,
      routeName: route.routeName || `${startPoint} - ${endPoint}`.trim(),
      routeNumber: route.routeNumber || route.routeName || `#${index + 1}`,
      startPoint,
      endPoint,
      status: route.status || (route.active === false ? 'Inactive' : 'Active'),
      active: route.active ?? true,
      stops: orderedStops,
    };
  };

  const fetchRoutes = async () => {
    try {
      setLoading(true);
      setError('');

      const { data } = await api.get('/routes');
      const routeList = Array.isArray(data)
        ? data
        : Array.isArray(data.routes)
          ? data.routes
          : [];

      setRoutes(routeList.map(normalizeRoute));
    } catch (err) {
      setError(err.response?.data?.message || err.message || 'Unable to load routes.');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchRoutes();
  }, []);

  const filteredRoutes = useMemo(() => {
    const query = search.trim().toLowerCase();

    if (!query) return routes;

    return routes.filter((route) => {
      const stops = Array.isArray(route.stops)
        ? route.stops
            .map((stop) =>
              typeof stop === 'string'
                ? stop
                : stop.name || stop.stopName || ''
            )
            .join(' ')
        : '';

      const searchableText = [
        route.routeName,
        route.name,
        route.routeNumber,
        route.startPoint,
        route.endPoint,
        route.origin,
        route.destination,
        route.status,
        stops,
      ]
        .filter(Boolean)
        .join(' ')
        .toLowerCase();

      return searchableText.includes(query);
    });
  }, [routes, search]);

  const getRouteName = (route) =>
    route.routeName ||
    route.name ||
    route.routeNumber ||
    'Unnamed Route';

  const getStart = (route) =>
    route.startPoint || route.origin || route.from || 'Not specified';

  const getDestination = (route) =>
    route.endPoint ||
    route.destination ||
    route.to ||
    'Not specified';

  const getStops = (route) => {
    if (!Array.isArray(route.stops)) return [];

    return route.stops.map((stop) =>
      typeof stop === 'string'
        ? stop
        : stop.name || stop.stopName || 'Unknown stop'
    );
  };

  const getStatus = (route) =>
    String(route.status || 'Active').toLowerCase();

  return (
    <div className="min-h-screen bg-slate-950 p-4 text-white sm:p-8">
      <div className="mx-auto max-w-7xl">
        {/* Page heading */}
        <div className="mb-8 flex flex-col justify-between gap-4 sm:flex-row sm:items-center">
          <div>
            <h1 className="text-3xl font-bold">
              {t('Bus Routes')}
            </h1>
            <p className="mt-2 text-slate-400">
              {t('Explore routes, stops and journey information.')}
            </p>
          </div>

          <button
            type="button"
            onClick={fetchRoutes}
            disabled={loading}
            className="rounded-lg border border-slate-700 bg-slate-800
              px-4 py-2 text-sm font-medium transition
              hover:bg-slate-700 disabled:cursor-not-allowed
              disabled:opacity-50"
          >
            {loading ? t('Loading...') : t('Refresh Routes')}
          </button>
        </div>

        {/* Summary cards */}
        <div className="mb-6 grid grid-cols-1 gap-4 sm:grid-cols-2">
          <div className="rounded-xl border border-slate-800
            bg-slate-900 p-5">
            <p className="text-sm text-slate-400">
              {t('Total Routes')}
            </p>
            <p className="mt-2 text-3xl font-bold">
              {routes.length}
            </p>
          </div>

          <div className="rounded-xl border border-slate-800
            bg-slate-900 p-5">
            <p className="text-sm text-slate-400">
              {t('Matching Routes')}
            </p>
            <p className="mt-2 text-3xl font-bold">
              {filteredRoutes.length}
            </p>
          </div>
        </div>

        {/* Search */}
        <div className="mb-6">
          <label htmlFor="route-search"
            className="mb-2 block text-sm font-medium text-slate-300">
            {t('Search Routes')}
          </label>

          <input
            id="route-search"
            type="search"
            value={search}
            onChange={(event) => setSearch(event.target.value)}
            placeholder={t(
              'Search by route, starting point, destination or stop...'
            )}
            className="w-full rounded-xl border border-slate-700
              bg-slate-900 px-4 py-3 text-white outline-none
              placeholder:text-slate-500
              focus:border-blue-500 focus:ring-2
              focus:ring-blue-500/20"
          />
        </div>

        {/* Loading */}
        {loading && (
          <div className="rounded-xl border border-slate-800
            bg-slate-900 p-10 text-center text-slate-300">
            {t('Loading bus routes...')}
          </div>
        )}

        {/* Error */}
        {!loading && error && (
          <div className="rounded-xl border border-red-500/30
            bg-red-500/10 p-6">
            <p className="font-semibold text-red-400">
              {t('Unable to load routes')}
            </p>
            <p className="mt-2 text-sm text-slate-300">
              {error}
            </p>
            <button
              type="button"
              onClick={fetchRoutes}
              className="mt-4 rounded-lg bg-red-600 px-4 py-2
                text-sm font-semibold hover:bg-red-500"
            >
              {t('Try Again')}
            </button>
          </div>
        )}

        {/* Empty state */}
        {!loading && !error && filteredRoutes.length === 0 && (
          <div className="rounded-xl border border-slate-800
            bg-slate-900 p-10 text-center">
            <div className="mb-3 text-4xl" aria-hidden="true">
              🚌
            </div>
            <h2 className="text-lg font-semibold">
              {search
                ? t('No matching routes found')
                : t('No bus routes available')}
            </h2>
            <p className="mt-2 text-sm text-slate-400">
              {search
                ? t('Try searching with a different route or stop.')
                : t('Add routes to your database to display them here.')}
            </p>
          </div>
        )}

        {/* Routes list */}
        {!loading && !error && filteredRoutes.length > 0 && (
          <div className="grid grid-cols-1 gap-5 lg:grid-cols-2">
            {filteredRoutes.map((route, index) => {
              const id = route._id || route.id || index;
              const stops = getStops(route);
              const status = getStatus(route);
              const expanded = expandedRoute === id;

              return (
                <article
                  key={id}
                  className="overflow-hidden rounded-xl
                    border border-slate-800 bg-slate-900
                    shadow-lg shadow-black/10"
                >
                  <div className="border-b border-slate-800 p-5">
                    <div className="flex items-start justify-between gap-3">
                      <div>
                        <p className="text-xs font-medium uppercase
                          tracking-wider text-blue-400">
                          {t('Route')} {route.routeNumber
                            ? `#${route.routeNumber}`
                            : `#${index + 1}`}
                        </p>

                        <h2 className="mt-1 text-xl font-bold">
                          {getRouteName(route)}
                        </h2>
                      </div>

                      <span
                        className={`rounded-full px-3 py-1 text-xs
                          font-semibold ${
                            status === 'active'
                              ? 'bg-emerald-500/10 text-emerald-400'
                              : 'bg-slate-700 text-slate-300'
                          }`}
                      >
                        {t(status === 'active' ? 'Active' : status)}
                      </span>
                    </div>
                  </div>

                  <div className="p-5">
                    {/* Start and destination */}
                    <div className="grid grid-cols-[1fr_auto_1fr]
                      items-center gap-3">
                      <div className="min-w-0">
                        <p className="text-xs text-slate-400">
                          {t('Starting Point')}
                        </p>
                        <p className="mt-1 break-words font-semibold">
                          {getStart(route)}
                        </p>
                      </div>

                      <span className="text-xl text-blue-400"
                        aria-hidden="true">
                        →
                      </span>

                      <div className="min-w-0 text-right">
                        <p className="text-xs text-slate-400">
                          {t('Destination')}
                        </p>
                        <p className="mt-1 break-words font-semibold">
                          {getDestination(route)}
                        </p>
                      </div>
                    </div>

                    {/* Journey details */}
                    <div className="mt-5 grid grid-cols-2 gap-3">
                      <div className="rounded-lg bg-slate-800/70 p-3">
                        <p className="text-xs text-slate-400">
                          {t('Distance')}
                        </p>
                        <p className="mt-1 font-semibold">
                          {route.distance != null
                            ? `${route.distance} km`
                            : '—'}
                        </p>
                      </div>

                      <div className="rounded-lg bg-slate-800/70 p-3">
                        <p className="text-xs text-slate-400">
                          {t('Estimated Duration')}
                        </p>
                        <p className="mt-1 font-semibold">
                          {route.estimatedDuration ??
                            route.duration ??
                            '—'}
                          {(route.estimatedDuration ??
                            route.duration) != null
                            ? typeof (route.estimatedDuration ??
                                route.duration) === 'number'
                              ? ' min'
                              : ''
                            : ''}
                        </p>
                      </div>

                      <div className="rounded-lg bg-slate-800/70 p-3">
                        <p className="text-xs text-slate-400">
                          {t('Bus Number')}
                        </p>
                        <p className="mt-1 break-words font-semibold">
                          {typeof route.bus === 'object'
                            ? route.bus?.busNumber ||
                              route.bus?.registrationNumber ||
                              '—'
                            : route.bus || route.busNumber || '—'}
                        </p>
                      </div>

                      <div className="rounded-lg bg-slate-800/70 p-3">
                        <p className="text-xs text-slate-400">
                          {t('Total Stops')}
                        </p>
                        <p className="mt-1 font-semibold">
                          {stops.length}
                        </p>
                      </div>
                    </div>

                    {/* Expand stop list */}
                    <button
                      type="button"
                      onClick={() =>
                        setExpandedRoute(expanded ? null : id)
                      }
                      aria-expanded={expanded}
                      className="mt-5 flex w-full items-center
                        justify-between rounded-lg border
                        border-slate-700 px-4 py-3 text-sm
                        font-medium text-slate-200 transition
                        hover:bg-slate-800"
                    >
                      <span>
                        {expanded
                          ? t('Hide Stops')
                          : t('View Route Stops')}
                      </span>
                      <span aria-hidden="true">
                        {expanded ? '−' : '+'}
                      </span>
                    </button>

                    {expanded && (
                      <div className="mt-4 rounded-lg bg-slate-800/50 p-4">
                        {stops.length > 0 ? (
                          <ol className="space-y-3">
                            {stops.map((stop, stopIndex) => (
                              <li
                                key={`${id}-${stopIndex}`}
                                className="flex items-start gap-3 text-sm"
                              >
                                <span className="flex h-6 w-6
                                  shrink-0 items-center justify-center
                                  rounded-full bg-blue-500/15
                                  text-xs font-bold text-blue-400">
                                  {stopIndex + 1}
                                </span>
                                <span className="pt-1 text-slate-200">
                                  {stop}
                                </span>
                              </li>
                            ))}
                          </ol>
                        ) : (
                          <p className="text-sm text-slate-400">
                            {t('No intermediate stops added.')}
                          </p>
                        )}
                      </div>
                    )}
                  </div>
                </article>
              );
            })}
          </div>
        )}
      </div>
    </div>
  );
};

export default Routes;

