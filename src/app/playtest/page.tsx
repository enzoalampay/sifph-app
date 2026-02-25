"use client";

import Link from "next/link";
import { GiTestTubes, GiScrollUnfurled, GiSpellBook } from "react-icons/gi";
import { PageHeader } from "@/components/layout/PageHeader";
import { Card } from "@/components/ui/Card";
import { Badge } from "@/components/ui/Badge";

export default function PlaytestPage() {
  return (
    <div className="mx-auto max-w-4xl px-4 py-6 space-y-6">
      <PageHeader
        title="Playtest Files"
        description="January 2026 Pre-Season Testing"
      />

      {/* Warning Banner */}
      <div className="rounded-lg border border-teal-700/50 bg-teal-900/20 p-4">
        <div className="flex items-start gap-3">
          <GiTestTubes className="w-6 h-6 text-teal-400 shrink-0 mt-0.5" />
          <div className="space-y-2">
            <p className="text-sm font-semibold text-teal-300">
              Pre-Season 2026 Testing &mdash; Starks &amp; Lannisters Only
            </p>
            <ul className="text-xs text-stone-400 space-y-1 list-disc list-inside">
              <li>These assets are for testing purposes only and should ONLY be fielded against other Pre-Season 2026 assets.</li>
              <li>Not meant to replace any current Season 6 assets, cards, or be incorporated into existing events.</li>
              <li>Subject to rapid, iterative changes and not representative of final changes.</li>
            </ul>
          </div>
        </div>
      </div>

      {/* Nav Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
        <Link href="/playtest/builder">
          <Card hover padding="lg" className="group">
            <div className="flex flex-col items-center text-center gap-3 py-4">
              <GiScrollUnfurled className="w-10 h-10 text-teal-400 group-hover:text-teal-300 transition-colors" />
              <div>
                <h3 className="text-lg font-semibold text-stone-100 font-[family-name:var(--font-cinzel)]">
                  Playtest Builder
                </h3>
                <p className="text-xs text-stone-400 mt-1">
                  Build armies using January 2026 playtest cards
                </p>
              </div>
              <Badge variant="info" size="sm">PLAYTEST</Badge>
            </div>
          </Card>
        </Link>

        <Link href="/playtest/wiki">
          <Card hover padding="lg" className="group">
            <div className="flex flex-col items-center text-center gap-3 py-4">
              <GiSpellBook className="w-10 h-10 text-teal-400 group-hover:text-teal-300 transition-colors" />
              <div>
                <h3 className="text-lg font-semibold text-stone-100 font-[family-name:var(--font-cinzel)]">
                  Playtest Wiki
                </h3>
                <p className="text-xs text-stone-400 mt-1">
                  Browse all playtest card data and abilities
                </p>
              </div>
              <Badge variant="info" size="sm">PLAYTEST</Badge>
            </div>
          </Card>
        </Link>
      </div>

      {/* Key Rules Changes */}
      <Card padding="lg">
        <h3 className="text-sm font-semibold text-stone-200 mb-3 font-[family-name:var(--font-cinzel)]">
          Key Rules Changes
        </h3>
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 text-xs text-stone-400">
          <div>
            <p className="font-medium text-stone-300 mb-1">Morale Overhaul</p>
            <p>Each unit now lists a morale stat (e.g. 3+, 4+). Morale and panic tests roll (x) dice — successes and failures determine outcomes. A 6 always succeeds, a 1 always fails.</p>
          </div>
          <div>
            <p className="font-medium text-stone-300 mb-1">Attack Traits</p>
            <p>Critical Blow, Sundering, and Vicious are now Innate traits. Precision has been removed.</p>
          </div>
          <div>
            <p className="font-medium text-stone-300 mb-1">Council Board (Escalation)</p>
            <p>Council zones now have base effects plus Escalation 2 and 3 effects. Escalation is checked based on total council units on the board.</p>
          </div>
          <div>
            <p className="font-medium text-stone-300 mb-1">Terrain Changes</p>
            <p>6 terrain pieces during setup (up from 4). Minimum distance reduced to 3&quot;. Palisades removed from general terrain pool.</p>
          </div>
        </div>
      </Card>
    </div>
  );
}
