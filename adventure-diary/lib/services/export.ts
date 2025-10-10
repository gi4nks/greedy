import { db } from '@/lib/db';
import { campaigns, adventures, sessions, sessionLogs, characters, locations, quests, magicItems } from '@/lib/db/schema';
import { eq } from 'drizzle-orm';
import puppeteer from 'puppeteer';
import { marked } from 'marked';

export interface ExportOptions {
  campaignId: number;
  format: 'markdown' | 'pdf' | 'html' | 'json';
  sections: {
    timeline?: boolean;
    sessions?: boolean;
    characters?: boolean;
    locations?: boolean;
    quests?: boolean;
    magicItems?: boolean;
  };
  dateRange?: {
    start: string;
    end: string;
  };
}

interface CampaignExportData {
  campaign: typeof campaigns.$inferSelect;
  adventures: (typeof adventures.$inferSelect)[];
  sessions?: Array<typeof sessions.$inferSelect & { logs: typeof sessionLogs.$inferSelect[]; adventure: string }>;
  characters?: Array<typeof characters.$inferSelect & { adventure: string }>;
  locations?: Array<typeof locations.$inferSelect & { adventure: string }>;
  quests?: Array<typeof quests.$inferSelect & { adventure: string }>;
  magicItems?: (typeof magicItems.$inferSelect)[];
}

export class ExportService {
  static async exportCampaign(options: ExportOptions): Promise<Buffer | string> {
    const campaign = await this.getCampaignData(options);

    switch (options.format) {
      case 'markdown':
        return this.exportToMarkdown(campaign, options);
      case 'pdf':
        return this.exportToPDF(campaign, options);
      case 'html':
        return this.exportToHTML(campaign, options);
      case 'json':
        return JSON.stringify(campaign, null, 2);
      default:
        throw new Error(`Unsupported export format: ${options.format}`);
    }
  }

  private static async getCampaignData(options: ExportOptions): Promise<CampaignExportData> {
    // Get campaign
    const [campaign] = await db
      .select()
      .from(campaigns)
      .where(eq(campaigns.id, options.campaignId))
      .limit(1);

    if (!campaign) {
      throw new Error('Campaign not found');
    }

    const data: CampaignExportData = { campaign, adventures: [] };

    // Get adventures for this campaign
    const campaignAdventures = await db
      .select()
      .from(adventures)
      .where(eq(adventures.campaignId, options.campaignId));

    data.adventures = campaignAdventures;

    // Get data based on selected sections
    if (options.sections.sessions) {
      const sessionData = [];
      for (const adventure of campaignAdventures) {
        const adventureSessions = await db
          .select()
          .from(sessions)
          .where(eq(sessions.adventureId, adventure.id));

        for (const session of adventureSessions) {
          const logs = await db
            .select()
            .from(sessionLogs)
            .where(eq(sessionLogs.sessionId, session.id))
            .orderBy(sessionLogs.createdAt);

          sessionData.push({
            ...session,
            logs,
            adventure: adventure.title,
          });
        }
      }
      data.sessions = sessionData;
    }

    if (options.sections.characters) {
      const characterData = [];
      for (const adventure of campaignAdventures) {
        const adventureCharacters = await db
          .select()
          .from(characters)
          .where(eq(characters.adventureId, adventure.id));

        characterData.push(...adventureCharacters.map(char => ({
          ...char,
          adventure: adventure.title,
        })));
      }
      data.characters = characterData;
    }

    if (options.sections.locations) {
      const locationData = [];
      for (const adventure of campaignAdventures) {
        const adventureLocations = await db
          .select()
          .from(locations)
          .where(eq(locations.adventureId, adventure.id));

        locationData.push(...adventureLocations.map(loc => ({
          ...loc,
          adventure: adventure.title,
        })));
      }
      data.locations = locationData;
    }

    if (options.sections.quests) {
      const questData = [];
      for (const adventure of campaignAdventures) {
        const adventureQuests = await db
          .select()
          .from(quests)
          .where(eq(quests.adventureId, adventure.id));

        questData.push(...adventureQuests.map(quest => ({
          ...quest,
          adventure: adventure.title,
        })));
      }
      data.quests = questData;
    }

    if (options.sections.magicItems) {
      data.magicItems = await db.select().from(magicItems);
    }

    return data;
  }

  private static async exportToMarkdown(data: CampaignExportData, options: ExportOptions): Promise<string> {
    let markdown = `# ${data.campaign.title}\n\n`;

    if (data.campaign.description) {
      markdown += `${data.campaign.description}\n\n`;
    }

    markdown += `**Status:** ${data.campaign.status || 'Active'}\n`;
    if (data.campaign.startDate) {
      markdown += `**Started:** ${new Date(data.campaign.startDate).toLocaleDateString()}\n`;
    }
    if (data.campaign.endDate) {
      markdown += `**Ended:** ${new Date(data.campaign.endDate).toLocaleDateString()}\n`;
    }
    markdown += '\n---\n\n';

    // Adventures
    if (data.adventures && data.adventures.length > 0) {
      markdown += `## Adventures\n\n`;
      for (const adventure of data.adventures) {
        markdown += `### ${adventure.title}\n\n`;
        if (adventure.description) {
          markdown += `${adventure.description}\n\n`;
        }
        if (adventure.startDate) {
          markdown += `**Started:** ${new Date(adventure.startDate).toLocaleDateString()}\n`;
        }
        if (adventure.endDate) {
          markdown += `**Ended:** ${new Date(adventure.endDate).toLocaleDateString()}\n`;
        }
        markdown += '\n';
      }
      markdown += '---\n\n';
    }

    // Sessions
    if (options.sections.sessions && data.sessions && data.sessions.length > 0) {
      markdown += `## Sessions\n\n`;
      for (const session of data.sessions) {
        markdown += `### ${session.title}\n`;
        markdown += `**Adventure:** ${session.adventure}\n`;
        markdown += `**Date:** ${new Date(session.date).toLocaleDateString()}\n\n`;

        if (session.text) {
          markdown += `${session.text}\n\n`;
        }

        if (session.logs && session.logs.length > 0) {
          markdown += `#### Session Logs\n\n`;
          for (const log of session.logs) {
            markdown += `- **${log.entryType}**`;
            if (log.timestamp) markdown += ` (${log.timestamp})`;
            markdown += `: ${log.content}\n`;
          }
          markdown += '\n';
        }
      }
      markdown += '---\n\n';
    }

    // Characters
    if (options.sections.characters && data.characters && data.characters.length > 0) {
      markdown += `## Characters\n\n`;
      for (const character of data.characters) {
        markdown += `### ${character.name}\n`;
        markdown += `**Adventure:** ${character.adventure}\n`;
        markdown += `**Type:** ${character.characterType === 'pc' ? 'Player Character' : 'NPC'}\n`;

        if (character.race) markdown += `**Race:** ${character.race}\n`;

        if (character.description) {
          markdown += `\n${character.description}\n`;
        }

        markdown += '\n';
      }
      markdown += '---\n\n';
    }

    // Locations
    if (options.sections.locations && data.locations && data.locations.length > 0) {
      markdown += `## Locations\n\n`;
      for (const location of data.locations) {
        markdown += `### ${location.name}\n`;
        markdown += `**Adventure:** ${location.adventure}\n\n`;

        if (location.description) {
          markdown += `${location.description}\n\n`;
        }

        if (location.notes) {
          markdown += `**Notes:** ${location.notes}\n\n`;
        }
      }
      markdown += '---\n\n';
    }

    // Quests
    if (options.sections.quests && data.quests && data.quests.length > 0) {
      markdown += `## Quests\n\n`;
      for (const quest of data.quests) {
        markdown += `### ${quest.title}\n`;
        markdown += `**Adventure:** ${quest.adventure}\n`;
        markdown += `**Status:** ${quest.status}\n`;
        markdown += `**Priority:** ${quest.priority}\n`;
        markdown += `**Type:** ${quest.type}\n\n`;

        if (quest.description) {
          markdown += `${quest.description}\n\n`;
        }

        if (quest.assignedTo) {
          markdown += `**Assigned to:** ${quest.assignedTo}\n`;
        }

        if (quest.dueDate) {
          markdown += `**Due:** ${new Date(quest.dueDate).toLocaleDateString()}\n`;
        }

        markdown += '\n';
      }
      markdown += '---\n\n';
    }

    // Magic Items
    if (options.sections.magicItems && data.magicItems && data.magicItems.length > 0) {
      markdown += `## Magic Items\n\n`;
      for (const item of data.magicItems) {
        markdown += `### ${item.name}\n`;
        if (item.rarity) markdown += `**Rarity:** ${item.rarity}\n`;
        if (item.type) markdown += `**Type:** ${item.type}\n\n`;

        if (item.description) {
          markdown += `${item.description}\n\n`;
        }

        if (item.properties) {
          markdown += `**Properties:** ${Array.isArray(item.properties) ? item.properties.join(', ') : item.properties}\n\n`;
        }
      }
    }

    markdown += `\n---\n\n*Exported on ${new Date().toLocaleDateString()} from Adventure Diary*`;

    return markdown;
  }

  private static async exportToPDF(data: CampaignExportData, options: ExportOptions): Promise<Buffer> {
    const html = await this.exportToHTML(data, options);

    const browser = await puppeteer.launch({
      headless: true,
      args: ['--no-sandbox', '--disable-setuid-sandbox']
    });

    try {
      const page = await browser.newPage();
      await page.setContent(html, { waitUntil: 'networkidle0' });

      const pdf = await page.pdf({
        format: 'A4',
        printBackground: true,
        margin: { top: '20mm', bottom: '20mm', left: '20mm', right: '20mm' },
        displayHeaderFooter: true,
        headerTemplate: `
          <div style="font-size: 10px; text-align: center; width: 100%;">
            ${data.campaign.title} - Adventure Diary Export
          </div>
        `,
        footerTemplate: `
          <div style="font-size: 10px; text-align: center; width: 100%;">
            Page <span class="pageNumber"></span> of <span class="totalPages"></span>
          </div>
        `,
      });

      return Buffer.from(pdf);
    } finally {
      await browser.close();
    }
  }

  private static async exportToHTML(data: CampaignExportData, options: ExportOptions): Promise<string> {
    const markdown = await this.exportToMarkdown(data, options);

    const html = `
      <!DOCTYPE html>
      <html lang="en">
      <head>
        <meta charset="UTF-8">
        <meta name="viewport" content="width=device-width, initial-scale=1.0">
        <title>${data.campaign.title} - Adventure Diary Export</title>
        <style>
          body {
            font-family: 'Georgia', serif;
            max-width: 800px;
            margin: 0 auto;
            padding: 2rem;
            line-height: 1.6;
            color: #333;
          }
          h1, h2, h3, h4 {
            color: #2d3748;
            margin-top: 2rem;
            margin-bottom: 1rem;
          }
          h1 { font-size: 2rem; border-bottom: 2px solid #4299e1; padding-bottom: 0.5rem; }
          h2 { font-size: 1.5rem; border-bottom: 1px solid #e2e8f0; padding-bottom: 0.25rem; }
          h3 { font-size: 1.25rem; }
          h4 { font-size: 1.1rem; }
          p { margin-bottom: 1rem; }
          .metadata { background: #f7fafc; padding: 1rem; border-radius: 4px; margin: 1rem 0; }
          .session-log { background: #f7fafc; padding: 1rem; margin: 0.5rem 0; border-left: 4px solid #4299e1; }
          .character-card { border: 1px solid #e2e8f0; padding: 1rem; margin: 1rem 0; border-radius: 4px; }
          .status-active { color: #38a169; }
          .status-completed { color: #3182ce; }
          .status-on-hold { color: #d69e2e; }
          .status-cancelled { color: #e53e3e; }
          @media print {
            body { margin: 0; }
            .no-print { display: none; }
          }
        </style>
      </head>
      <body>
        ${marked(markdown)}
      </body>
      </html>
    `;

    return html;
  }
}