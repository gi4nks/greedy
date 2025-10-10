import { db } from '@/lib/db';
import { campaigns, adventures, sessions, characters, timelineEvents } from '@/lib/db/schema';
import { eq, sql, desc, count } from 'drizzle-orm';
import { startOfMonth, endOfMonth, subMonths, format } from 'date-fns';

export interface CampaignAnalytics {
  overview: {
    totalCampaigns: number;
    totalAdventures: number;
    totalSessions: number;
    totalCharacters: number;
    totalSessionHours: number;
    averageSessionLength: number;
  };
  sessionTrends: {
    monthly: Array<{
      month: string;
      sessions: number;
      hours: number;
    }>;
    recent: Array<{
      date: string;
      title: string;
      duration: number;
    }>;
  };
  characterStats: {
    byRace: Array<{
      race: string | null;
      count: number;
    }>;
    byType: Array<{
      type: string | null;
      count: number;
    }>;
  };
  timelineActivity: {
    eventsByType: Array<{
      type: string;
      count: number;
    }>;
    recentEvents: Array<{
      title: string;
      type: string;
      date: string;
      importance: number;
    }>;
  };
}

export class AnalyticsService {
  static async getCampaignAnalytics(campaignId?: number): Promise<CampaignAnalytics> {
    // Get basic counts
    const [campaignCount] = await db.select({ count: count() }).from(campaigns);
    const [adventureCount] = await db.select({ count: count() }).from(adventures);
    const [sessionCount] = await db.select({ count: count() }).from(sessions);
    const [characterCount] = await db.select({ count: count() }).from(characters);

    // Session trends - simplified
    const monthlyTrends = [];
    for (let i = 11; i >= 0; i--) {
      const date = subMonths(new Date(), i);
      const monthStart = startOfMonth(date);
      const monthEnd = endOfMonth(date);

      const [monthData] = await db
        .select({ sessions: count() })
        .from(sessions)
        .where(sql`${sessions.date} >= ${monthStart.toISOString()} AND ${sessions.date} <= ${monthEnd.toISOString()}`);

      monthlyTrends.push({
        month: format(date, 'MMM yyyy'),
        sessions: monthData.sessions || 0,
        hours: 0,
      });
    }

    // Recent sessions
    const recentSessions = await db
      .select({
        title: sessions.title,
        date: sessions.date,
      })
      .from(sessions)
      .orderBy(desc(sessions.date))
      .limit(10);

    // Character statistics - simplified
    const charactersByRace = await db
      .select({
        race: characters.race,
        count: count(),
      })
      .from(characters)
      .where(sql`${characters.race} IS NOT NULL`)
      .groupBy(characters.race)
      .orderBy(desc(count()));

    const charactersByType = await db
      .select({
        type: characters.characterType,
        count: count(),
      })
      .from(characters)
      .groupBy(characters.characterType)
      .orderBy(desc(count()));

    // Timeline activity - handle missing table gracefully
    let eventsByType: Array<{ type: string; count: number }> = [];
    let recentEvents: Array<{ title: string; type: string; date: string; importance: number }> = [];

    try {
      const eventsByTypeResult = await db
        .select({
          type: timelineEvents.eventType,
          count: count(),
        })
        .from(timelineEvents)
        .groupBy(timelineEvents.eventType)
        .orderBy(desc(count()));

      eventsByType = eventsByTypeResult;

      const recentEventsResult = await db
        .select({
          title: timelineEvents.title,
          eventType: timelineEvents.eventType,
          realDate: timelineEvents.realDate,
          importanceLevel: timelineEvents.importanceLevel,
        })
        .from(timelineEvents)
        .orderBy(desc(timelineEvents.realDate))
        .limit(10);

      recentEvents = recentEventsResult.map(timelineEvent => ({
        title: timelineEvent.title,
        type: timelineEvent.eventType,
        date: timelineEvent.realDate,
        importance: timelineEvent.importanceLevel || 3,
      }));
    } catch (error) {
      // Timeline events table might not exist yet
      console.warn('Timeline events table not available:', error);
    }

    return {
      overview: {
        totalCampaigns: campaignCount.count || 0,
        totalAdventures: adventureCount.count || 0,
        totalSessions: sessionCount.count || 0,
        totalCharacters: characterCount.count || 0,
        totalSessionHours: 0,
        averageSessionLength: 0,
      },
      sessionTrends: {
        monthly: monthlyTrends,
        recent: recentSessions.map(session => ({
          date: session.date,
          title: session.title,
          duration: 0,
        })),
      },
      characterStats: {
        byRace: charactersByRace.filter((item) => item.race !== null),
        byType: charactersByType.filter((item) => item.type !== null),
      },
      timelineActivity: {
        eventsByType,
        recentEvents,
      },
    };
  }

  static async getGlobalAnalytics(): Promise<CampaignAnalytics> {
    return this.getCampaignAnalytics();
  }
}