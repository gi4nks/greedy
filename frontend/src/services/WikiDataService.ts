import axios from 'axios';

export interface WikiSearchResponse {
  items: WikiArticle[];
  basepath: string;
  offset?: string;
}

export interface WikiArticleResponse {
  id: number;
  title: string;
  url: string;
  extract?: string;
  content?: string;
  thumbnail?: string;
  isFullContent?: boolean;
}

export interface MonsterData {
  armorClass?: number;
  hitDice?: string;
  movement?: string;
}

export interface SpellData {
  level?: string;
  range?: string;
  duration?: string;
}

export interface MagicItemData {
  rarity?: string;
  type?: string;
  attunement?: string;
}

export interface WikiArticle {
  id: number;
  title: string;
  url: string;
  ns?: number;
}

export interface WikiArticleDetails {
  id: number;
  title: string;
  url: string;
  extract?: string;
  content?: string;
  thumbnail?: string;
  isFullContent?: boolean;
}

export class WikiDataService {
  private static readonly BASE_URL = 'https://adnd2e.fandom.com/api/v1';
  private static readonly WIKI_BASE = 'https://adnd2e.fandom.com';

  /**
   * Search for articles on the AD&D wiki
   */
  static async searchArticles(query: string, limit: number = 20): Promise<WikiArticle[]> {
    try {
      const response = await axios.get<WikiSearchResponse>('/api/wiki/search', {
        params: {
          query,
          limit
        }
      });

      return response.data.items || [];
    } catch {
      throw new Error('Failed to search wiki articles');
    }
  }

  /**
   * Search for articles by category
   */
  static async searchByCategory(category: string, limit: number = 20): Promise<WikiArticle[]> {
    try {
      const response = await axios.get<WikiSearchResponse>('/api/wiki/search', {
        params: {
          category,
          limit
        }
      });

      return response.data.items || [];
    } catch {
      throw new Error('Failed to search wiki by category');
    }
  }

  /**
   * Get detailed information about specific articles
   */
  static async getArticleDetails(ids: number[]): Promise<Record<string, WikiArticleDetails>> {
    try {
      const details: Record<string, WikiArticleDetails> = {};

      // Get details for each article
      for (const id of ids) {
        try {
          const response = await axios.get<WikiArticleResponse>(`/api/wiki/article/${id}`);
          details[id] = response.data;
        } catch {
          // Continue with other articles if one fails
        }
      }

      return details;
    } catch {
      throw new Error('Failed to get article details');
    }
  }

  /**
   * Get full content of a specific article
   */
  static async getArticleFullContent(id: number): Promise<WikiArticleDetails> {
    try {
      const response = await axios.get<WikiArticleResponse>(`/api/wiki/article/${id}`, {
        params: { full: 'true' }
      });
      return response.data;
    } catch {
      throw new Error('Failed to get full article content');
    }
  }

  /**
   * Get the full wiki URL for an article
   */
  static getFullUrl(articleUrl: string): string {
    return `${this.WIKI_BASE}${articleUrl}`;
  }

  /**
   * Convert Fandom wikitext to HTML with proper MediaWiki parsing
   */
  static wikitextToHtml(wikitext: string): string {
    try {
      if (!wikitext) return '';

      let html = wikitext;

      // Filter out wiki categories first
      html = this.filterCategories(html);

      // Handle complex templates first (before simple ones)
      html = this.parseTemplates(html);

      // Handle headers with Fandom styling
      html = html.replace(/^=====\s*(.+?)\s*=====$/gm, '<h5 class="fandom-heading">$1</h5>');
      html = html.replace(/^====\s*(.+?)\s*====$/gm, '<h4 class="fandom-heading">$1</h4>');
      html = html.replace(/^===\s*(.+?)\s*===$/gm, '<h3 class="fandom-heading">$1</h3>');
      html = html.replace(/^==\s*(.+?)\s*==$/gm, '<h2 class="fandom-heading">$1</h2>');
      html = html.replace(/^=\s*(.+?)\s*=$/gm, '<h1 class="fandom-heading">$1</h1>');

      // Handle bold and italic text (order matters: 5 quotes first)
      html = html.replace(/'''''([^']+)'''''/g, '<strong><em>$1</em></strong>');
      html = html.replace(/'''([^']+)'''/g, '<strong>$1</strong>');
      html = html.replace(/''([^']+)''/g, '<em>$1</em>');

      // Handle internal links [[Link|Text]]
      html = html.replace(/\[\[([^\]|]+)(?:\|([^\]]+))?\]\]/g, (match, link, text) => {
        const displayText = text || link;
        const linkUrl = link.replace(/\s+/g, '_');
        return `<a href="#" class="fandom-link" data-wiki-link="${linkUrl}">${displayText}</a>`;
      });

      // Handle external links [url text]
      html = html.replace(/\[([^\s]+)\s+([^\]]+)\]/g, '<a href="$1" class="external-link" target="_blank" rel="noopener noreferrer">$2 <span class="external-icon">↗</span></a>');
      html = html.replace(/\[([^\s]+)\]/g, '<a href="$1" class="external-link" target="_blank" rel="noopener noreferrer">$1 <span class="external-icon">↗</span></a>');

      // Handle lists with proper nesting
      html = this.parseLists(html);

      // Handle definition lists
      html = html.replace(/^;(.+)$/gm, '<dt>$1</dt>');
      html = html.replace(/^:(.+)$/gm, '<dd>$1</dd>');

      // Handle horizontal rules
      html = html.replace(/^----+$/gm, '<hr class="fandom-hr">');

      // Handle preformatted text
      html = html.replace(/^ (.+)$/gm, '<pre class="fandom-pre">$1</pre>');

      // Handle tables with proper structure
      html = this.parseTables(html);

      // Clean up any remaining wiki markup artifacts
      html = this.cleanWikiMarkup(html);

      // Handle line breaks and paragraphs
      html = html.replace(/\n\n+/g, '</p><p>');
      html = html.replace(/\n/g, '<br>');

      // Clean up multiple consecutive <br> tags
      html = html.replace(/(<br>\s*){3,}/g, '<br><br>');

      // Final cleanup - remove any remaining categories that might have been missed
      html = html.replace(/\[\[Category:[^\]]+\]\]/gi, '');
      html = html.replace(/Category:[^\s\n]+/gi, '');

      // Wrap in paragraph tags if not already wrapped
      if (!html.startsWith('<') && html.trim()) {
        html = `<p>${html}</p>`;
      }

      return html;
    } catch (_error) {
      return `<div class="error-message">Error rendering content: ${_error}</div>`;
    }
  }

  /**
   * Filter out wiki categories from content
   */
  private static filterCategories(wikitext: string): string {
    // Remove category links at the end of articles - more comprehensive pattern
    let filtered = wikitext.replace(/\[\[Category:[^\]]+\]\]/gi, '');

    // Also remove any remaining category references
    filtered = filtered.replace(/Category:[^\s\n]+/gi, '');

    // Clean up any empty lines left by category removal
    filtered = filtered.replace(/\n\s*\n\s*\n/g, '\n\n');

    return filtered.trim();
  }

  /**
   * Clean up remaining wiki markup artifacts
   */
  private static cleanWikiMarkup(html: string): string {
    let cleaned = html;

    // Remove any remaining template artifacts
    cleaned = cleaned.replace(/\{\{[^}]+\}\}/g, '');

    // Clean up table content - remove extra spaces and special characters
    cleaned = cleaned.replace(/\s*—\s*/g, ' — '); // Normalize em dashes
    cleaned = cleaned.replace(/\s*\*\s*/g, ' * '); // Clean up asterisks
    cleaned = cleaned.replace(/\s*%\s*/g, '%'); // Clean up percentages

    // Clean up empty paragraphs
    cleaned = cleaned.replace(/<p>\s*<br>\s*<\/p>/gi, '');
    cleaned = cleaned.replace(/<p>\s*<\/p>/gi, '');

    // Clean up multiple spaces
    cleaned = cleaned.replace(/\s+/g, ' ');

    // Clean up table cells with better formatting
    cleaned = cleaned.replace(/(<td[^>]*>)\s*(.*?)\s*(<\/td>)/gi, '$1$2$3');

    return cleaned;
  }

  /**
   * Parse MediaWiki templates with proper handling
   */
  private static parseTemplates(wikitext: string): string {
    let html = wikitext;

    // Handle {{br}} template (line break)
    html = html.replace(/\{\{br\}\}/gi, '<br>');

    // Handle infobox templates
    html = html.replace(/\{\{Infobox Spells([^}]+)\}\}/gi, (match, content) => {
      const params = this.parseTemplateParams(content);
      return this.renderInfoboxSpell(params);
    });

    // Handle other infobox templates
    html = html.replace(/\{\{Infobox ([^}]+)\}\}/gi, (match, content) => {
      const params = this.parseTemplateParams(content);
      return this.renderGenericInfobox(params);
    });

    // Handle quote templates
    html = html.replace(/\{\{Quote([^}]*)\}\}/gi, (match, content) => {
      const params = this.parseTemplateParams(content);
      const text = params.text || content.replace(/^[^{|]+\|/, '');
      return `<blockquote class="quote">${text}</blockquote>`;
    });

    // Handle main page templates
    html = html.replace(/\{\{Main([^}]*)\}\}/gi, (match, content) => {
      const params = this.parseTemplateParams(content);
      const text = params.text || content.replace(/^[^{|]+\|/, '');
      return `<div class="main-page-link">Main article: ${text}</div>`;
    });

    // Handle other templates as styled boxes
    html = html.replace(/\{\{([^{}]+)\}\}/g, (match, content) => {
      const templateName = content.split('|')[0].trim().toLowerCase();

      // Skip templates we've already handled
      if (['br', 'quote', 'main', 'infobox'].some(t => templateName.includes(t))) {
        return match;
      }

      return `<div class="template-box">${content}</div>`;
    });

    return html;
  }

  /**
   * Parse template parameters from |key=value format
   */
  private static parseTemplateParams(content: string): Record<string, string> {
    const params: Record<string, string> = {};
    const lines = content.split('|').slice(1); // Skip template name

    for (const line of lines) {
      const trimmed = line.trim();
      if (!trimmed) continue;

      const equalIndex = trimmed.indexOf('=');
      if (equalIndex > 0) {
        const key = trimmed.substring(0, equalIndex).trim().toLowerCase();
        const value = trimmed.substring(equalIndex + 1).trim();
        params[key] = value;
      } else {
        // Parameter without explicit key
        params[trimmed] = trimmed;
      }
    }

    return params;
  }

  /**
   * Render spell infobox
   */
  private static renderInfoboxSpell(params: Record<string, string>): string {
    let name = params.name || 'Unknown Spell';

    // Clean up the spell name - remove {{br}} and handle reversible
    name = name.replace(/\{\{br\}\}/gi, ' ').replace(/\s+/g, ' ').trim();

    // Extract reversible information
    const isReversible = name.toLowerCase().includes('reversible');
    if (isReversible) {
      name = name.replace(/\s*\([^)]*reversible[^)]*\)/gi, '').trim();
    }

    const source = params.source || '';
    const level = params.level || '';
    const school = params.school || '';
    const sphere = params.sphere || '';
    const range = params.range || '';
    const duration = params.duration || '';
    const aoe = params.aoe || '';
    const save = params.save || '';
    const castingTime = params.castingtime || params.casting_time || '';
    const verbal = params.verbal || '';
    const somatic = params.somatic || '';
    const material = params.material || '';

    // Build components array for better organization
    const components = [];
    if (verbal === '1') components.push('V');
    if (somatic === '1') components.push('S');
    if (material === '1') components.push('M');
    const componentsStr = components.length > 0 ? components.join(', ') : '';

    return `
      <div class="spell-infobox">
        <h2 class="spell-name">${name}${isReversible ? ' <span class="spell-reversible">(Reversible)</span>' : ''}</h2>
        <div class="spell-details">
          ${source ? `<div class="spell-source"><strong>Source:</strong> ${source}</div>` : ''}
          ${level ? `<div class="spell-level"><strong>Level:</strong> ${level}</div>` : ''}
          ${school ? `<div class="spell-school"><strong>School:</strong> ${school}</div>` : ''}
          ${sphere ? `<div class="spell-sphere"><strong>Sphere:</strong> ${sphere}</div>` : ''}
          ${range ? `<div class="spell-range"><strong>Range:</strong> ${range}</div>` : ''}
          ${componentsStr ? `<div class="spell-components"><strong>Components:</strong> ${componentsStr}</div>` : ''}
          ${castingTime ? `<div class="spell-casting-time"><strong>Casting Time:</strong> ${castingTime}</div>` : ''}
          ${duration ? `<div class="spell-duration"><strong>Duration:</strong> ${duration}</div>` : ''}
          ${aoe ? `<div class="spell-aoe"><strong>Area of Effect:</strong> ${aoe}</div>` : ''}
          ${save ? `<div class="spell-save"><strong>Saving Throw:</strong> ${save}</div>` : ''}
        </div>
      </div>
    `;
  }

  /**
   * Render generic infobox
   */
  private static renderGenericInfobox(params: Record<string, string>): string {
    const entries = Object.entries(params)
      .filter(([key]) => key !== 'name')
      .map(([key, value]) => `<div class="infobox-row"><strong>${key}:</strong> ${value}</div>`)
      .join('');

    return `
      <div class="generic-infobox">
        <h3 class="infobox-title">${params.name || 'Information'}</h3>
        ${entries}
      </div>
    `;
  }

  /**
   * Parse MediaWiki lists with proper nesting
   */
  private static parseLists(wikitext: string): string {
    let html = wikitext;

    // Handle unordered lists
    const ulRegex = /^(\*+)(.+)$/gm;
    html = html.replace(ulRegex, (match, stars, content) => {
      const level = stars.length;
      const indent = '  '.repeat(level - 1);
      return `${indent}<li class="fandom-list-item">${content.trim()}</li>`;
    });

    // Handle ordered lists
    const olRegex = /^(\#+)(.+)$/gm;
    html = html.replace(olRegex, (match, hashes, content) => {
      const level = hashes.length;
      const indent = '  '.repeat(level - 1);
      return `${indent}<li class="fandom-ordered-item">${content.trim()}</li>`;
    });

    // Convert to proper HTML structure
    html = this.convertListStructure(html);

    return html;
  }

  /**
   * Convert list markers to proper HTML
   */
  private static convertListStructure(text: string): string {
    // Split by lines and process each line
    const lines = text.split('\n');
    const result: string[] = [];
    let currentUl: string[] = [];
    let currentOl: string[] = [];
    let ulLevel = 0;
    let olLevel = 0;

    for (const line of lines) {
      const trimmed = line.trim();
      if (!trimmed) {
        // Empty line - close current lists
        if (currentUl.length > 0) {
          result.push('</ul>');
          currentUl = [];
          ulLevel = 0;
        }
        if (currentOl.length > 0) {
          result.push('</ol>');
          currentOl = [];
          olLevel = 0;
        }
        continue;
      }

      // Check for list items
      const ulMatch = line.match(/^(\s*)<li class="fandom-list-item">(.+)<\/li>$/);
      const olMatch = line.match(/^(\s*)<li class="fandom-ordered-item">(.+)<\/li>$/);

      if (ulMatch) {
        const indent = ulMatch[1].length;
        const content = ulMatch[2];
        const level = Math.floor(indent / 2) + 1;

        // Adjust nesting level
        while (ulLevel > level) {
          result.push('</ul>');
          ulLevel--;
        }
        while (ulLevel < level) {
          result.push('<ul class="fandom-list">');
          ulLevel++;
        }

        result.push(`<li class="fandom-list-item">${content}</li>`);
      } else if (olMatch) {
        const indent = olMatch[1].length;
        const content = olMatch[2];
        const level = Math.floor(indent / 2) + 1;

        // Adjust nesting level
        while (olLevel > level) {
          result.push('</ol>');
          olLevel--;
        }
        while (olLevel < level) {
          result.push('<ol class="fandom-list">');
          olLevel++;
        }

        result.push(`<li class="fandom-list-item">${content}</li>`);
      } else {
        // Close any open lists
        while (ulLevel > 0) {
          result.push('</ul>');
          ulLevel--;
        }
        while (olLevel > 0) {
          result.push('</ol>');
          olLevel--;
        }
        result.push(line);
      }
    }

    // Close any remaining lists
    while (ulLevel > 0) {
      result.push('</ul>');
      ulLevel--;
    }
    while (olLevel > 0) {
      result.push('</ol>');
      olLevel--;
    }

    return result.join('\n');
  }

  /**
   * Parse MediaWiki tables with proper structure
   */
  private static parseTables(wikitext: string): string {
    let html = wikitext;

    // Handle table start with optional class
    html = html.replace(/^\{\|([^}]*)\}/gm, (match, className) => {
      const tableClass = className.trim() ? `fandom-table ${className.trim()}` : 'fandom-table';
      return `<table class="${tableClass}">`;
    });

    // Handle table end
    html = html.replace(/^\|\}/gm, '</table>');

    // Handle table rows
    html = html.replace(/^\|-/gm, '<tr>');

    // Handle table captions with better styling
    html = html.replace(/^\|\+\s*(.+)$/gm, '<caption class="fandom-table-caption">$1</caption>');

    // Handle table headers with better multi-column support
    html = html.replace(/^!\s*(.+)$/gm, (match, content) => {
      // Split on either !! or || separators
      const cells = content.split(/!!|\|\|/).map((cell: string) => {
        // Handle colspan syntax like ! colspan="2" | Header
        const colspanMatch = cell.match(/^([^|]*)\|\s*(.+)$/);
        if (colspanMatch) {
          const attrs = colspanMatch[1].trim();
          const text = colspanMatch[2].trim();
          return `<th class="fandom-table-header"${attrs ? ` ${attrs}` : ''}>${text}</th>`;
        }
        return `<th class="fandom-table-header">${cell.trim()}</th>`;
      });
      return cells.join('');
    });

    // Handle table cells with better multi-column support
    html = html.replace(/^\|\s*(.+)$/gm, (match, content) => {
      const cells = content.split('||').map((cell: string) => {
        // Handle colspan syntax like | colspan="2" | Content
        const colspanMatch = cell.match(/^([^|]*)\|\s*(.+)$/);
        if (colspanMatch) {
          const attrs = colspanMatch[1].trim();
          const text = colspanMatch[2].trim();
          // Clean up the cell content
          const cleanText = this.cleanTableCell(text);
          return `<td class="fandom-table-cell"${attrs ? ` ${attrs}` : ''}>${cleanText}</td>`;
        }
        // Clean up the cell content and skip empty cells
        const cleanText = this.cleanTableCell(cell.trim());
        // Skip empty cells that result from trailing || or malformed content
        if (cleanText === '' || cleanText === '>') {
          return '';
        }
        return `<td class="fandom-table-cell">${cleanText}</td>`;
      }).filter((cell: string) => cell !== ''); // Remove empty cells
      return cells.join('');
    });

    return html;
  }

  /**
   * Clean up table cell content
   */
  private static cleanTableCell(content: string): string {
    let cleaned = content;

    // Remove extra whitespace
    cleaned = cleaned.replace(/\s+/g, ' ').trim();

    // Clean up special characters and formatting
    cleaned = cleaned.replace(/\s*—\s*/g, ' — '); // Normalize em dashes
    cleaned = cleaned.replace(/\s*\*\s*/g, '*'); // Clean up asterisks
    cleaned = cleaned.replace(/\s*%\s*/g, '%'); // Clean up percentages

    // Handle empty cells
    if (cleaned === '—' || cleaned === '-' || cleaned === '') {
      cleaned = '—';
    }

    return cleaned;
  }

  /**
   * Search for specific types of content
   */
  static async searchMonsters(limit: number = 50): Promise<WikiArticle[]> {
    return this.searchByCategory('Monsters', limit);
  }

  static async searchSpells(limit: number = 50): Promise<WikiArticle[]> {
    return this.searchByCategory('Spells', limit);
  }

  static async searchMagicItems(limit: number = 50): Promise<WikiArticle[]> {
    return this.searchByCategory('Magic_Items', limit);
  }

  static async searchRaces(limit: number = 50): Promise<WikiArticle[]> {
    return this.searchByCategory('Races', limit);
  }

  static async searchClasses(limit: number = 50): Promise<WikiArticle[]> {
    return this.searchByCategory('Classes', limit);
  }

  static parseMonsterData(content: string): MonsterData {
    // Basic parsing logic - could be enhanced
    const monster: MonsterData = {};

    // Extract basic stats from wiki format
    const armorClassMatch = content.match(/Armor Class:\s*(\d+)/i);
    if (armorClassMatch) monster.armorClass = parseInt(armorClassMatch[1]);

    const hitDiceMatch = content.match(/Hit Dice:\s*([^<\n]+)/i);
    if (hitDiceMatch) monster.hitDice = hitDiceMatch[1].trim();

    const movementMatch = content.match(/Movement:\s*([^<\n]+)/i);
    if (movementMatch) monster.movement = movementMatch[1].trim();

    return monster;
  }

  static parseSpellData(content: string): SpellData {
    const spell: SpellData = {};

    const levelMatch = content.match(/Level:\s*([^<\n]+)/i);
    if (levelMatch) spell.level = levelMatch[1].trim();

    const rangeMatch = content.match(/Range:\s*([^<\n]+)/i);
    if (rangeMatch) spell.range = rangeMatch[1].trim();

    const durationMatch = content.match(/Duration:\s*([^<\n]+)/i);
    if (durationMatch) spell.duration = durationMatch[1].trim();

    return spell;
  }

  static parseMagicItemData(content: string): MagicItemData {
    const item: MagicItemData = {};

    const typeMatch = content.match(/Type:\s*([^<\n]+)/i);
    if (typeMatch) item.type = typeMatch[1].trim();

    const rarityMatch = content.match(/Rarity:\s*([^<\n]+)/i);
    if (rarityMatch) item.rarity = rarityMatch[1].trim();

    const attunementMatch = content.match(/Attunement:\s*([^<\n]+)/i);
    if (attunementMatch) item.attunement = attunementMatch[1].trim();

    return item;
  }
}