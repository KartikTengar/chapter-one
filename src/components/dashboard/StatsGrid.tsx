"use client";

import { Users, CalendarCheck, Gamepad2, TrendingUp } from "lucide-react";
import { StatCard } from "./StatCard";

interface StatsGridProps {
  upcomingEvents: number;
  registered: number;
}

export function StatsGrid({ upcomingEvents, registered }: StatsGridProps) {
  return (
    <div className="grid grid-cols-2 lg:grid-cols-4 gap-3 sm:gap-4 mb-8">
      <StatCard label="Upcoming Events" value={upcomingEvents} icon={CalendarCheck} />
      <StatCard label="Registered" value={registered} icon={Users} />
      <StatCard label="Games Played" value={0} icon={Gamepad2} />
      <StatCard label="Points" value={0} icon={TrendingUp} />
    </div>
  );
}