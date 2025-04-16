import * as cheerio from 'cheerio';
import axios from 'axios';

interface UrlMetadata {
  title: string | null;
  description: string | null;
  imageUrl: string | null;
}

export async function getUrlMetadata(url: string): Promise<UrlMetadata> {
  try {
    const response = await axios.get(url, {
      headers: {
        'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/91.0.4472.124 Safari/537.36'
      }
    });
    const html = response.data;
    
    const $ = cheerio.load(html);
    
    // Пытаемся получить метаданные из разных источников
    const title = 
      $('meta[property="og:title"]').attr('content') || 
      $('meta[name="twitter:title"]').attr('content') || 
      $('title').text() || 
      null;
    
    const description = 
      $('meta[property="og:description"]').attr('content') || 
      $('meta[name="twitter:description"]').attr('content') || 
      $('meta[name="description"]').attr('content') || 
      null;
    
    let imageUrl = 
      $('meta[property="og:image"]').attr('content') || 
      $('meta[name="twitter:image"]').attr('content') || 
      null;

    // Если у нас есть относительная ссылка на изображение, сделаем её абсолютной
    if (imageUrl && !imageUrl.startsWith('http')) {
      const urlObj = new URL(url);
      const baseUrl = `${urlObj.protocol}//${urlObj.host}`;
      imageUrl = imageUrl.startsWith('/') 
        ? baseUrl + imageUrl 
        : baseUrl + '/' + imageUrl;
    }
    
    return {
      title,
      description,
      imageUrl
    };
  } catch (error) {
    console.error('Error fetching URL metadata:', error);
    return {
      title: null,
      description: null,
      imageUrl: null
    };
  }
} 