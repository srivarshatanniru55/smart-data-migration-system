const cheerio = require('cheerio');
const puppeteer = require('puppeteer');
const { addActivityLog } = require('../models');

// Helper to sanitize URL
function sanitizeUrl(url) {
  if (!url.startsWith('http://') && !url.startsWith('https://')) {
    return 'https://' + url;
  }
  return url;
}

// Check if content is client-side rendered or mostly empty
function isSparseHtml(html) {
  if (!html) return true;
  const $ = cheerio.load(html);
  const bodyText = $('body').text().replace(/\s+/g, ' ').trim();
  // If body has very little text but has large bundle scripts
  return bodyText.length < 200 && html.includes('<script');
}

// Generate smart realistic mock data based on URL context
function generateSmartMockData(urlStr) {
  const url = urlStr.toLowerCase();
  const timestamp = new Date().toLocaleDateString();

  if (url.includes('car') || url.includes('auto') || url.includes('vehicle') || url.includes('tesla') || url.includes('copart')) {
    return {
      title: '2026 Tesla Model S Plaid (Tri-Motor AWD)',
      description: 'Experience the pinnacle of electric performance. The Tesla Model S Plaid delivers 1,020 horsepower, rocket-like acceleration from 0-60 mph in under 2 seconds, and a sleek carbon-fiber spoiler. Impeccable white premium interior, full self-driving capability, and active noise canceling cockpit.',
      specifications: [
        'Model: Model S Plaid',
        'Year: 2026',
        'Engine Type: Tri-Motor Electric',
        'Horsepower: 1,020 hp',
        'Transmission: Single-Speed Automatic',
        'Color: Solid Black Exterior / Ultra White Interior',
        'Range: 396 miles (EPA est.)',
        'Top Speed: 200 mph',
        'VIN: 5YJSA1E41RFXXXXXX'
      ],
      dates: [timestamp, '06/15/2026'],
      metadata: {
        domain: 'apexium-automotive',
        author: 'Tesla Certified Pre-Owned Division',
        keywords: 'electric, tesla, plaid, tri-motor, hypercar, EV, luxury sedan',
        category: 'Automotive / Electric Vehicles'
      },
      images: [
        'https://images.unsplash.com/photo-1619767886558-efdc259cde1a?auto=format&fit=crop&w=800&q=80',
        'https://images.unsplash.com/photo-1563720223185-11003d516935?auto=format&fit=crop&w=800&q=80',
        'https://images.unsplash.com/photo-1617788138017-80ad40651399?auto=format&fit=crop&w=800&q=80'
      ]
    };
  }

  if (url.includes('product') || url.includes('amazon') || url.includes('shop') || url.includes('store') || url.includes('ebay') || url.includes('cart')) {
    return {
      title: 'Apexium SoundForce Elite Wireless Headphones',
      description: 'Immerse yourself in pure studio acoustics with the Apexium SoundForce Elite. Equipped with active hybrid noise cancellation (ANC), custom 40mm dynamic drivers, and a plush memory-foam headband. Seamless multipoint Bluetooth 5.3 connection and up to 45 hours of continuous battery life.',
      specifications: [
        'Brand: Apexium Sound',
        'Model: SoundForce Elite ANC',
        'Color: Midnight Navy & Matte Black',
        'Driver Size: 40 mm',
        'Battery Life: 45 Hours (ANC Off) / 32 Hours (ANC On)',
        'Charging Type: USB-C Fast Charge (10m = 5h)',
        'Weight: 260g',
        'Connectivity: Bluetooth 5.3 / 3.5mm Jack',
        'Warranty: 2 Year Manufacturer'
      ],
      dates: [timestamp, '04/10/2026'],
      metadata: {
        domain: 'apexium-electronics',
        author: 'Apexium Product Team',
        keywords: 'anc, headphones, wireless, bluetooth 5.3, audiophile, noise cancelling',
        category: 'Electronics / Audio Accessories'
      },
      images: [
        'https://images.unsplash.com/photo-1505740420928-5e560c06d30e?auto=format&fit=crop&w=800&q=80',
        'https://images.unsplash.com/photo-1583394838336-acd977736f90?auto=format&fit=crop&w=800&q=80',
        'https://images.unsplash.com/photo-1484704849700-f032a568e944?auto=format&fit=crop&w=800&q=80'
      ]
    };
  }

  if (url.includes('house') || url.includes('estate') || url.includes('property') || url.includes('zillow') || url.includes('rent') || url.includes('apartment')) {
    return {
      title: 'Architectural Mid-Century Modern Luxury Villa',
      description: 'Perched majestically above the sunset strip, this Architectural Mid-Century masterpiece offers panoramic city-to-ocean views. Featuring double-height ceilings, automated floor-to-ceiling glass doors, a state-of-the-art chef\'s kitchen, infinity edge saltwater pool, and expansive redwood wrapping decks.',
      specifications: [
        'Property Type: Single Family Residence',
        'Bedrooms: 5 Bedrooms',
        'Bathrooms: 6 Bathrooms (5 Full / 1 Half)',
        'Square Footage: 6,450 sq ft',
        'Lot Size: 0.42 Acres',
        'Garage: 3 Cars (Ev-Ready)',
        'Year Built: 2024 (Fully Rebuilt)',
        'Heating/Cooling: Multi-Zone Smart Climate Control',
        'Amenities: Infinity Pool, Spa, Private Theater, Wine Cellar'
      ],
      dates: [timestamp, '05/01/2026'],
      metadata: {
        domain: 'apexium-realestate',
        author: 'Elite Westside Properties',
        keywords: 'modern villa, infinity pool, luxury estate, Beverly Hills, city view',
        category: 'Real Estate / Luxury Residential'
      },
      images: [
        'https://images.unsplash.com/photo-1613490493576-7fde63acd811?auto=format&fit=crop&w=800&q=80',
        'https://images.unsplash.com/photo-1512917774080-9991f1c4c750?auto=format&fit=crop&w=800&q=80',
        'https://images.unsplash.com/photo-1600585154340-be6161a56a0c?auto=format&fit=crop&w=800&q=80'
      ]
    };
  }

  // Default General Article Scrape Mock
  return {
    title: 'How Automation and AI Are Transforming Modern Enterprise Systems',
    description: 'An in-depth analysis of cognitive process automation, robotic desktop operations, and advanced data migration workflows. Discover how modern machine learning models and serverless automation suites are shrinking human error, saving hours of manual data entry, and streamlining high-volume product imports.',
    specifications: [
      'Topic: Corporate Digital Transformation',
      'Author: Dr. Marcus Vance',
      'Read Time: 8 Minutes',
      'Word Count: 1,420 Words',
      'Language: English (US)',
      'Primary Focus: RPA & AI Integration',
      'Publishing Body: Apexium Tech Insights Journal'
    ],
    dates: [timestamp, '05/29/2026'],
    metadata: {
      domain: 'apexium-blog',
      author: 'Marcus Vance',
      keywords: 'automation, rpa, data migration, AI integration, tech trend, SaaS',
      category: 'Technology / Industry Insights'
    },
    images: [
      'https://images.unsplash.com/photo-1485827404703-89b55fcc595e?auto=format&fit=crop&w=800&q=80',
      'https://images.unsplash.com/photo-1518770660439-4636190af475?auto=format&fit=crop&w=800&q=80',
      'https://images.unsplash.com/photo-1531297484001-80022131f5a1?auto=format&fit=crop&w=800&q=80'
    ]
  };
}

async function extractFromUrl(urlInput) {
  let url;
  try {
    url = sanitizeUrl(urlInput);
    new URL(url);
  } catch (e) {
    await addActivityLog('extraction', 'error', `Invalid URL format provided: ${urlInput}`);
    throw new Error('Extraction failed: Invalid URL format.');
  }

  await addActivityLog('extraction', 'info', `Initiating content extraction from: ${url}`);
  
  let html = null;
  let isStaticScrapeSuccessful = false;

  // 1. First attempt: Standard HTTP request (Static Scraping via Fetch & Cheerio)
  try {
    const controller = new AbortController();
    const timeoutId = setTimeout(() => controller.abort(), 6000); // 6s timeout

    const response = await fetch(url, {
      signal: timeoutId.signal,
      headers: {
        'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36',
        'Accept': 'text/html,application/xhtml+xml,application/xml;q=0.9,image/webp,*/*;q=0.8'
      }
    });

    clearTimeout(timeoutId);
    
    if (response.ok) {
      html = await response.text();
      isStaticScrapeSuccessful = !isSparseHtml(html);
      if (isStaticScrapeSuccessful) {
        await addActivityLog('extraction', 'success', `Static HTML fetched successfully (${html.length} bytes).`);
      }
    }
  } catch (err) {
    await addActivityLog('extraction', 'warning', `Static fetch failed or timed out: ${err.message}. Trying Headless Scraper...`);
  }

  // 2. Second attempt: Headless browser rendering (via Puppeteer) if static scrape failed/sparse
  if (!isStaticScrapeSuccessful) {
    let browser = null;
    try {
      await addActivityLog('extraction', 'info', `Launching headless browser for full JavaScript rendering...`);
      browser = await puppeteer.launch({
        headless: 'new',
        args: ['--no-sandbox', '--disable-setuid-sandbox']
      });
      const page = await browser.newPage();
      await page.setUserAgent('Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36');
      await page.setViewport({ width: 1280, height: 800 });
      
      // Navigate to URL with 12s timeout
      await page.goto(url, { waitUntil: 'domcontentloaded', timeout: 12000 });
      // Add small wait for dynamic content
      await new Promise(r => setTimeout(r, 2000));
      
      html = await page.content();
      isStaticScrapeSuccessful = true;
      await addActivityLog('extraction', 'success', `Dynamic webpage rendered and scraped successfully using Puppeteer.`);
    } catch (err) {
      await addActivityLog('extraction', 'warning', `Headless browser scraping failed: ${err.message}`);
    } finally {
      if (browser) {
        await browser.close();
      }
    }
  }

  // 3. Fail if both scraping methodologies fail (No Mock Fallbacks)
  if (!isStaticScrapeSuccessful || !html) {
    await addActivityLog('extraction', 'error', `Unable to scrape target website: URL unreachable or blocking requests.`);
    throw new Error('Extraction failed: Target website is unreachable or blocking scraper connections.');
  }

  // 4. Parse extracted HTML using Cheerio
  try {
    const $ = cheerio.load(html);
    
    // Extract Title
    let title = $('title').text().trim() || 
                $('meta[property="og:title"]').attr('content') || 
                $('meta[name="twitter:title"]').attr('content') || 
                $('h1').first().text().trim();
    
    // Extract Description
    let description = $('meta[name="description"]').attr('content') || 
                      $('meta[property="og:description"]').attr('content') || 
                      $('meta[name="twitter:description"]').attr('content');
    
    if (!description) {
      // Aggregate first few long paragraphs
      const paragraphs = [];
      $('p').each((i, el) => {
        const text = $(el).text().trim();
        if (text.length > 50 && paragraphs.length < 3) {
          paragraphs.push(text);
        }
      });
      description = paragraphs.join(' ');
    }

    // Extract specifications (key-value structures in tables or lists)
    const specifications = [];
    
    // Check tables
    $('table tr').each((i, el) => {
      const cells = $(el).find('td, th');
      if (cells.length === 2) {
        const key = $(cells[0]).text().replace(/\s+/g, ' ').trim();
        const val = $(cells[1]).text().replace(/\s+/g, ' ').trim();
        if (key && val && key.length < 50 && val.length < 300) {
          specifications.push(`${key}: ${val}`);
        }
      }
    });

    // Check definition lists
    if (specifications.length === 0) {
      $('dl').each((i, el) => {
        const dts = $(el).find('dt');
        const dds = $(el).find('dd');
        for (let j = 0; j < Math.min(dts.length, dds.length); j++) {
          const key = $(dts[j]).text().replace(/\s+/g, ' ').trim();
          const val = $(dds[j]).text().replace(/\s+/g, ' ').trim();
          if (key && val && key.length < 50) {
            specifications.push(`${key}: ${val}`);
          }
        }
      });
    }

    // Fallback list items containing colons
    if (specifications.length === 0) {
      $('li').each((i, el) => {
        const text = $(el).text().trim();
        if (text.includes(':') && text.length > 5 && text.length < 150) {
          specifications.push(text);
        }
      });
    }

    // Ensure we don't return hundreds of specifications
    const trimmedSpecs = specifications.slice(0, 12);

    // Extract dates
    const dates = [];
    $('time').each((i, el) => {
      const dateTime = $(el).attr('datetime');
      const text = $(el).text().trim();
      if (dateTime) dates.push(dateTime);
      else if (text) dates.push(text);
    });

    $('meta[property*="date"], meta[name*="date"]').each((i, el) => {
      const content = $(el).attr('content');
      if (content) dates.push(content);
    });

    // Deduplicate dates
    const uniqueDates = [...new Set(dates)].slice(0, 5);
    if (uniqueDates.length === 0) {
      uniqueDates.push(new Date().toLocaleDateString());
    }

    // Extract metadata
    const metadata = {
      domain: new URL(url).hostname,
      author: $('meta[name="author"]').attr('content') || $('[rel="author"]').first().text().trim() || 'Unknown Author',
      keywords: $('meta[name="keywords"]').attr('content') || 'data migration, extracted content',
      category: $('meta[property="article:section"]').attr('content') || 'Web Extraction'
    };

    // Extract Images
    const images = [];
    // Prioritize OpenGraph image
    const ogImage = $('meta[property="og:image"]').attr('content');
    if (ogImage) {
      try {
        images.push(new URL(ogImage, url).href);
      } catch(e){}
    }

    // Grab all standard images
    $('img').each((i, el) => {
      const src = $(el).attr('src') || $(el).attr('data-src') || $(el).attr('data-lazy-src');
      if (src && !src.startsWith('data:')) {
        try {
          const absUrl = new URL(src, url).href;
          // Filter out obvious trackers, social icons, spacers, etc.
          if (!absUrl.includes('tracker') && !absUrl.includes('logo') && !absUrl.includes('icon') && !absUrl.includes('spacer') && !absUrl.includes('advert')) {
            images.push(absUrl);
          }
        } catch(e){}
      }
    });

    // Deduplicate images
    const uniqueImages = [...new Set(images)].slice(0, 5);

    // If no quality images found, backfill using beautiful general placehold unsplash images
    if (uniqueImages.length === 0) {
      uniqueImages.push('https://images.unsplash.com/photo-1531297484001-80022131f5a1?auto=format&fit=crop&w=800&q=80');
      uniqueImages.push('https://images.unsplash.com/photo-1485827404703-89b55fcc595e?auto=format&fit=crop&w=800&q=80');
    }

    // Post processing check
    if (!title || title.trim().length === 0) {
      await addActivityLog('extraction', 'error', `Target website has no valid title elements.`);
      throw new Error('Extraction failed: Could not retrieve a valid page title from the DOM.');
    }

    const lowerTitle = title.toLowerCase();
    if (lowerTitle.includes('access denied') || lowerTitle.includes('403 forbidden') || lowerTitle.includes('404 not found') || lowerTitle.includes('page not found') || lowerTitle.includes('site block') || lowerTitle.includes('error')) {
      await addActivityLog('extraction', 'error', `Target page returned an error or access restriction: "${title}"`);
      throw new Error(`Extraction failed: Target page returned an error or access restriction ("${title}").`);
    }

    if (!description || description.trim().length === 0) {
      description = `Automatically migrated contents from ${url}. The extraction was processed on ${new Date().toLocaleString()}.`;
    }

    await addActivityLog('extraction', 'success', `Data extraction completed successfully. Title parsed: "${title.substr(0, 40)}..."`);

    return {
      title,
      description,
      specifications: trimmedSpecs,
      dates: uniqueDates,
      metadata,
      images: uniqueImages
    };
  } catch (err) {
    await addActivityLog('extraction', 'error', `Failed during content parsing: ${err.message}`);
    throw err;
  }
}

module.exports = {
  extractFromUrl,
  generateSmartMockData
};
