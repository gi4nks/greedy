'use client'

import { useEffect, useRef, useState, useCallback, use } from 'react'
import * as d3 from 'd3'
import { getTimelineEvents } from '@/lib/actions/timeline'
import type { TimelineEvent } from '@/lib/db/schema'

interface TimelinePageProps {
  params: Promise<{ id: string }>
}

export default function TimelinePage({ params }: TimelinePageProps) {
  const resolvedParams = use(params)
  const svgRef = useRef<SVGSVGElement>(null)
  const [events, setEvents] = useState<TimelineEvent[]>([])
  const [loading, setLoading] = useState(true)
  const [filters, setFilters] = useState({
    eventTypes: [] as string[],
    minImportance: 1,
    startDate: '',
    endDate: ''
  })

  const loadTimelineEvents = useCallback(async () => {
    try {
      const campaignId = parseInt(resolvedParams.id)
      const timelineEvents = await getTimelineEvents(campaignId, filters)
      setEvents(timelineEvents)
    } catch (error) {
      console.error('Failed to load timeline events:', error)
    } finally {
      setLoading(false)
    }
  }, [resolvedParams.id, filters])

  useEffect(() => {
    loadTimelineEvents()
  }, [loadTimelineEvents])

  const renderTimeline = useCallback(() => {
    if (!svgRef.current || events.length === 0) return

    const svg = d3.select(svgRef.current)
    svg.selectAll('*').remove()

    const margin = { top: 20, right: 30, bottom: 40, left: 90 }
    const width = 800 - margin.left - margin.right
    const height = Math.max(400, events.length * 60) - margin.top - margin.bottom

    const g = svg
      .attr('width', width + margin.left + margin.right)
      .attr('height', height + margin.top + margin.bottom)
      .append('g')
      .attr('transform', `translate(${margin.left},${margin.top})`)

    // Parse dates
    const parseDate = d3.timeParse('%Y-%m-%d')
    const eventsWithDates = events.map(event => ({
      ...event,
      parsedDate: parseDate(event.realDate) || new Date(event.realDate)
    }))

    // Create scales
    const xScale = d3.scaleTime()
      .domain(d3.extent(eventsWithDates, d => d.parsedDate) as [Date, Date])
      .range([0, width])

    const yScale = d3.scaleBand()
      .domain(eventsWithDates.map(d => d.id.toString()))
      .range([0, height])
      .padding(0.1)

    // Color scale for importance
    const colorScale = d3.scaleOrdinal()
      .domain(['1', '2', '3', '4', '5'])
      .range(['#e3f2fd', '#bbdefb', '#90caf9', '#64b5f6', '#42a5f5'])

    // Add axes
    g.append('g')
      .attr('transform', `translate(0,${height})`)
      .call(d3.axisBottom(xScale))

    g.append('g')
      .call(d3.axisLeft(yScale).tickFormat(() => ''))

    // Add timeline line
    g.append('line')
      .attr('x1', 0)
      .attr('x2', width)
      .attr('y1', height / 2)
      .attr('y2', height / 2)
      .attr('stroke', '#ccc')
      .attr('stroke-width', 2)

    // Add event circles
    const eventGroups = g.selectAll('.event')
      .data(eventsWithDates)
      .enter()
      .append('g')
      .attr('class', 'event')
      .attr('transform', d => `translate(${xScale(d.parsedDate)},${yScale(d.id.toString())! + yScale.bandwidth() / 2})`)

    eventGroups.append('circle')
      .attr('r', d => Math.max(8, (d.importanceLevel || 3) * 2))
      .attr('fill', d => colorScale((d.importanceLevel || 3).toString()) as string)
      .attr('stroke', '#333')
      .attr('stroke-width', 2)

    // Add event labels
    eventGroups.append('text')
      .attr('x', d => (d.importanceLevel || 3) > 3 ? 15 : -15)
      .attr('y', 0)
      .attr('dy', '0.35em')
      .attr('text-anchor', d => (d.importanceLevel || 3) > 3 ? 'start' : 'end')
      .text(d => d.title)
      .attr('font-size', '12px')
      .attr('font-weight', 'bold')

    // Add tooltips
    eventGroups.append('title')
      .text(d => `${d.title}\n${d.description}\nDate: ${d.realDate}\nImportance: ${(d.importanceLevel || 3)}/5`)
  }, [events])

  useEffect(() => {
    if (events.length > 0 && svgRef.current) {
      renderTimeline()
    }
  }, [events, renderTimeline])

  const handleFilterChange = (key: keyof typeof filters, value: string | number | string[]) => {
    setFilters(prev => ({ ...prev, [key]: value }))
  }

  if (loading) {
    return (
      <div className="container mx-auto p-8">
        <div className="flex justify-center items-center h-64">
          <div className="loading loading-spinner loading-lg"></div>
        </div>
      </div>
    )
  }

  return (
    <div className="container mx-auto p-8">
      <div className="mb-8">
        <h1 className="text-3xl font-bold mb-4">Campaign Timeline</h1>

        {/* Filters */}
        <div className="bg-base-100 p-4 rounded-lg shadow mb-6">
          <h2 className="text-lg font-semibold mb-3">Filters</h2>
          <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
            <div>
              <label className="label">
                <span className="label-text">Min Importance</span>
              </label>
              <select
                className="select select-bordered w-full"
                value={filters.minImportance}
                onChange={(e) => handleFilterChange('minImportance', parseInt(e.target.value))}
              >
                <option value={1}>1+</option>
                <option value={2}>2+</option>
                <option value={3}>3+</option>
                <option value={4}>4+</option>
                <option value={5}>5</option>
              </select>
            </div>

            <div>
              <label className="label">
                <span className="label-text">Start Date</span>
              </label>
              <input
                type="date"
                className="input input-bordered w-full"
                value={filters.startDate}
                onChange={(e) => handleFilterChange('startDate', e.target.value)}
              />
            </div>

            <div>
              <label className="label">
                <span className="label-text">End Date</span>
              </label>
              <input
                type="date"
                className="input input-bordered w-full"
                value={filters.endDate}
                onChange={(e) => handleFilterChange('endDate', e.target.value)}
              />
            </div>

            <div>
              <label className="label">
                <span className="label-text">Event Types</span>
              </label>
              <select
                multiple
                className="select select-bordered w-full h-20"
                value={filters.eventTypes}
                onChange={(e) => {
                  const values = Array.from(e.target.selectedOptions, option => option.value)
                  handleFilterChange('eventTypes', values)
                }}
              >
                <option value="session">Session</option>
                <option value="combat">Combat</option>
                <option value="quest_start">Quest Start</option>
                <option value="quest_complete">Quest Complete</option>
                <option value="character_death">Character Death</option>
                <option value="major_event">Major Event</option>
              </select>
            </div>
          </div>
        </div>

        {/* Timeline Visualization */}
        <div className="bg-base-100 p-4 rounded-lg shadow">
          <h2 className="text-lg font-semibold mb-4">Timeline Visualization</h2>
          {events.length === 0 ? (
            <div className="text-center py-12">
              <p className="text-base-content/60">No timeline events found for this campaign.</p>
            </div>
          ) : (
            <div className="overflow-x-auto">
              <svg ref={svgRef}></svg>
            </div>
          )}
        </div>

        {/* Event List */}
        <div className="bg-base-100 p-4 rounded-lg shadow mt-6">
          <h2 className="text-lg font-semibold mb-4">Event List ({events.length} events)</h2>
          <div className="space-y-2">
            {events.map((event) => (
              <div key={event.id} className="flex items-center gap-4 p-3 bg-base-200 rounded">
                <div className={`w-4 h-4 rounded-full`} style={{
                  backgroundColor: ['#e3f2fd', '#bbdefb', '#90caf9', '#64b5f6', '#42a5f5'][(event.importanceLevel || 3) - 1]
                }}></div>
                <div className="flex-1">
                  <h3 className="font-semibold">{event.title}</h3>
                  <p className="text-sm text-base-content/70">{event.description}</p>
                  <p className="text-xs text-base-content/60">
                    {event.realDate} • {event.eventType} • Importance: {(event.importanceLevel || 3)}/5
                  </p>
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>
    </div>
  )
}