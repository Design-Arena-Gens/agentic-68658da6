"use client";

import dynamic from "next/dynamic";
import { useMemo, useState, useTransition } from "react";
import {
  adjustStopDuration,
  changeTransportMode,
  explainEditingImpact,
  formatCarbon,
  formatCurrency,
  formatDuration,
  formatStopTiming,
  planTrip,
  swapStopWithAlternative,
  type TransportMode,
  type TravelPlan,
  updateItineraryAfterRemoval,
} from "@/lib/planner";

const ItineraryMap = dynamic(() => import("@/components/ItineraryMap"), {
  ssr: false,
});

const INITIAL_GOAL = "Plan a 2-day trip to Tokyo from New Delhi";

export default function Home() {
  const [goal, setGoal] = useState(INITIAL_GOAL);
  const [plan, setPlan] = useState<TravelPlan | null>(null);
  const [statusMessage, setStatusMessage] = useState<string | null>(null);
  const [isPending, startTransition] = useTransition();

  const handlePlan = (event: React.FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    startTransition(() => {
      const result = planTrip(goal);
      setPlan(result);
      setStatusMessage(
        `Optimized for value via ${result.bestByCost.mode.toLowerCase()} and built a ${result.goal.days}-day circuit around ${result.goal.destination.name}.`,
      );
    });
  };

  const handleTransportChange = (mode: TransportMode) => {
    setPlan((current) => (current ? changeTransportMode(current, mode) : current));
    setStatusMessage(`Locked in ${mode.toLowerCase()} and recalculated routing.`);
  };

  const handleSwap = (dayIndex: number, stopId: string) => {
    setPlan((current) =>
      current ? swapStopWithAlternative(current, dayIndex, stopId) : current,
    );
    setStatusMessage(explainEditingImpact("swap"));
  };

  const handleRemove = (dayIndex: number, stopId: string) => {
    setPlan((current) =>
      current ? updateItineraryAfterRemoval(current, dayIndex, stopId) : current,
    );
    setStatusMessage(explainEditingImpact("remove"));
  };

  const handleDurationChange = (
    dayIndex: number,
    stopId: string,
    durationHours: number,
  ) => {
    setPlan((current) =>
      current ? adjustStopDuration(current, dayIndex, stopId, durationHours) : current,
    );
    setStatusMessage(explainEditingImpact("duration"));
  };

  const transportModes = useMemo(
    () => (plan ? plan.transportOptions.map((option) => option.mode) : []),
    [plan],
  );

  return (
    <div className="min-h-screen bg-slate-950">
      <main className="mx-auto flex max-w-6xl flex-col gap-10 px-6 py-12 text-slate-200">
        <div className="rounded-3xl border border-slate-800 bg-slate-900/60 p-8 shadow-2xl shadow-slate-900/60">
          <h1 className="text-3xl font-semibold tracking-tight text-white">
            Goal-driven Travel Architect
          </h1>
          <p className="mt-2 max-w-2xl text-sm text-slate-300">
            Enter a travel goal and let the agent assemble transport, sequencing, and balanced
            days. Adjust the plan and watch it re-optimise in real time.
          </p>

          <form onSubmit={handlePlan} className="mt-6 flex flex-col gap-4 md:flex-row">
            <label className="flex-grow">
              <span className="mb-2 block text-xs uppercase tracking-wider text-slate-400">
                Travel goal
              </span>
              <input
                value={goal}
                onChange={(event) => setGoal(event.target.value)}
                className="w-full rounded-2xl border border-slate-700 bg-slate-950/70 px-4 py-3 text-base text-white outline-none transition focus:border-emerald-400 focus:ring-2 focus:ring-emerald-400/30"
                placeholder="Plan a 2-day trip to Tokyo from New Delhi"
              />
            </label>
            <button
              type="submit"
              className="mt-6 h-[52px] rounded-2xl bg-emerald-500 px-6 font-semibold text-slate-900 transition hover:bg-emerald-400 md:mt-auto"
              disabled={isPending}
            >
              {isPending ? "Thinking…" : "Generate Plan"}
            </button>
          </form>
          {statusMessage && (
            <p className="mt-4 text-sm text-emerald-300/90">{statusMessage}</p>
          )}
        </div>

        {plan && (
          <>
            <section className="grid gap-6 rounded-3xl border border-slate-800 bg-slate-900/40 p-6 md:grid-cols-[2fr,1fr]">
              <div>
                <h2 className="text-lg font-semibold text-white">Transport strategy</h2>
                <p className="mt-1 text-sm text-slate-300">
                  Comparing price vs. time for {plan.goal.origin.name} →{" "}
                  {plan.goal.destination.name}. Modes filtered by realistic range.
                </p>
                <div className="mt-4 grid gap-4 sm:grid-cols-2">
                  <article className="rounded-2xl border border-emerald-500/50 bg-emerald-500/10 p-4">
                    <h3 className="text-sm font-semibold text-emerald-300">
                      Best value ({plan.bestByCost.mode})
                    </h3>
                    <p className="mt-2 text-lg font-semibold">
                      {formatCurrency(plan.bestByCost.priceUSD)}
                    </p>
                    <p className="text-sm text-slate-300">
                      {formatDuration(plan.bestByCost.durationHours)} • Departs{" "}
                      {plan.bestByCost.departure} • Arrives {plan.bestByCost.arrival}
                    </p>
                    <p className="mt-2 text-xs text-slate-400">{plan.bestByCost.summary}</p>
                  </article>
                  <article className="rounded-2xl border border-sky-500/50 bg-sky-500/10 p-4">
                    <h3 className="text-sm font-semibold text-sky-300">
                      Fastest arrival ({plan.bestByTime.mode})
                    </h3>
                    <p className="mt-2 text-lg font-semibold">
                      {formatDuration(plan.bestByTime.durationHours)}
                    </p>
                    <p className="text-sm text-slate-300">
                      {formatCurrency(plan.bestByTime.priceUSD)} • Departs{" "}
                      {plan.bestByTime.departure}
                    </p>
                    <p className="mt-2 text-xs text-slate-400">{plan.bestByTime.summary}</p>
                  </article>
                </div>
              </div>

              <div className="flex flex-col justify-between rounded-2xl border border-slate-800 bg-slate-900 p-4">
                <div>
                  <span className="text-xs uppercase tracking-wide text-slate-500">
                    Selected mode
                  </span>
                  <select
                    className="mt-2 w-full rounded-xl border border-slate-700 bg-slate-950 px-3 py-2 text-sm text-white outline-none focus:border-emerald-400 focus:ring-2 focus:ring-emerald-400/30"
                    value={plan.selectedTransport.mode}
                    onChange={(event) =>
                      handleTransportChange(event.target.value as TransportMode)
                    }
                  >
                    {transportModes.map((mode) => (
                      <option key={mode}>{mode}</option>
                    ))}
                  </select>
                </div>
                <div className="mt-4 space-y-1 text-sm text-slate-300">
                  <p>
                    {formatDuration(plan.selectedTransport.durationHours)} •{" "}
                    {formatCurrency(plan.selectedTransport.priceUSD)}
                  </p>
                  <p>{formatCarbon(plan.selectedTransport.carbonKg)}</p>
                  <p className="text-xs text-slate-400">{plan.selectedTransport.summary}</p>
                </div>
              </div>
            </section>

            <section className="grid gap-6 lg:grid-cols-[minmax(0,2fr),minmax(0,1fr)]">
              <div className="space-y-6 rounded-3xl border border-slate-800 bg-slate-900/40 p-6">
                <header className="flex items-center justify-between gap-4">
                  <div>
                    <h2 className="text-lg font-semibold text-white">Itinerary blueprint</h2>
                    <p className="text-sm text-slate-300">
                      Sequenced by proximity and vibe. Edit a stop to see the agent rebalance the
                      day.
                    </p>
                  </div>
                  <span className="rounded-full border border-emerald-400/50 bg-emerald-400/10 px-3 py-1 text-xs uppercase tracking-wide text-emerald-200">
                    {plan.goal.days} day plan
                  </span>
                </header>

                <div className="space-y-5">
                  {plan.itinerary.map((day, dayIndex) => (
                    <article
                      key={day.day}
                      className="rounded-2xl border border-slate-800 bg-slate-950/40 p-5"
                    >
                      <div className="flex flex-wrap items-center justify-between gap-2">
                        <h3 className="text-base font-semibold text-white">{day.title}</h3>
                        <span
                          className="rounded-full px-3 py-1 text-xs font-medium text-white"
                          style={{
                            backgroundColor: `${day.color}33`,
                            border: `1px solid ${day.color}`,
                          }}
                        >
                          {day.summary}
                        </span>
                      </div>
                      <ul className="mt-4 space-y-4">
                        {day.stops.map((stop) => (
                          <li
                            key={stop.id}
                            className="rounded-xl border border-slate-800 bg-slate-900/60 p-4"
                          >
                            <div className="flex flex-wrap items-start justify-between gap-3">
                              <div>
                                <p className="text-sm text-slate-400">
                                  Stop {stop.order} • {stop.category}
                                </p>
                                <h4 className="text-lg font-semibold text-white">
                                  {stop.name}
                                </h4>
                                <p className="mt-1 text-sm text-slate-300">
                                  {stop.description}
                                </p>
                                <p className="mt-2 text-sm font-medium text-emerald-300">
                                  {formatStopTiming(stop)}
                                </p>
                                <p className="text-xs text-slate-400">
                                  Budget: {formatCurrency(stop.costUSD)}
                                </p>
                              </div>
                              <div className="flex flex-col items-start gap-3">
                                <div className="flex gap-2">
                                  <button
                                    onClick={() => handleSwap(dayIndex, stop.id)}
                                    className="rounded-lg border border-emerald-400/50 bg-emerald-400/10 px-3 py-1 text-xs font-semibold text-emerald-200 transition hover:bg-emerald-400/20"
                                  >
                                    Swap suggestion
                                  </button>
                                  <button
                                    onClick={() => handleRemove(dayIndex, stop.id)}
                                    className="rounded-lg border border-rose-400/50 bg-rose-400/10 px-3 py-1 text-xs font-semibold text-rose-200 transition hover:bg-rose-400/20"
                                  >
                                    Remove stop
                                  </button>
                                </div>
                                <label className="w-full text-xs text-slate-400">
                                  Duration
                                  <input
                                    type="range"
                                    min="1"
                                    max="4"
                                    step="0.5"
                                    value={stop.durationHours}
                                    onChange={(event) =>
                                      handleDurationChange(
                                        dayIndex,
                                        stop.id,
                                        parseFloat(event.target.value),
                                      )
                                    }
                                    className="mt-2 w-40 accent-emerald-400"
                                  />
                                </label>
                              </div>
                            </div>
                          </li>
                        ))}
                      </ul>
                    </article>
                  ))}
                </div>
              </div>

              <div className="space-y-6">
                <div className="rounded-3xl border border-slate-800 bg-slate-900/40 p-4">
                  <h2 className="text-lg font-semibold text-white">Spatial overview</h2>
                  <p className="mt-1 text-sm text-slate-300">
                    Dark line shows the inbound leg. Day colours match the cards for quick
                    orientation.
                  </p>
                  <div className="mt-4 h-[360px] overflow-hidden rounded-2xl border border-slate-800">
                    <ItineraryMap map={plan.map} />
                  </div>
                </div>
                <div className="rounded-3xl border border-slate-800 bg-slate-900/40 p-4">
                  <h2 className="text-lg font-semibold text-white">Agent reasoning</h2>
                  <ul className="mt-3 space-y-3 text-sm text-slate-300">
                    <li>
                      • Clustered morning culture blocks near Asakusa before moving south toward
                      waterfront art and evening neon to limit zig-zag travel.
                    </li>
                    <li>
                      • Balanced cost vs. time by defaulting to the best-value mode, while keeping
                      faster options available in the selector.
                    </li>
                    <li>
                      • Editing controls trigger micro-replans, recalculating times and map legs to
                      preserve pacing.
                    </li>
                  </ul>
                </div>
              </div>
            </section>
          </>
        )}
      </main>
    </div>
  );
}
