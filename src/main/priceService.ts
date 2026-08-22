import fetch from 'node-fetch'

export class MainPriceService {
  // Gold price fetching with fallback
  static async fetchGoldPrice(): Promise<{ price24ct: number, price22ct: number, source: string } | null> {
    const usdToAED = 3.67
    
    // Primary: Yahoo Finance GC=F
    try {
      const response = await fetch('https://query1.finance.yahoo.com/v8/finance/chart/GC=F', {
        headers: { 'User-Agent': 'Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7)' }
      })
      if (response.ok) {
        const data: any = await response.json()
        const usdPerOunce = data?.chart?.result?.[0]?.meta?.regularMarketPrice
        
        if (usdPerOunce && usdPerOunce > 0) {
          const pricePerGram24ct = (usdPerOunce * usdToAED) / 31.1035
          const pricePerGram22ct = pricePerGram24ct * (0.916 / 0.999)
          return {
            price24ct: Math.round(pricePerGram24ct * 100) / 100,
            price22ct: Math.round(pricePerGram22ct * 100) / 100,
            source: 'Yahoo Finance'
          }
        }
      }
    } catch (error) {
      console.warn('Yahoo Finance gold fetch failed:', error)
    }
    
    // Fallback: gold-api.com
    try {
      const response = await fetch('https://api.gold-api.com/price/XAU')
      if (response.ok) {
        const data: any = await response.json()
        const usdPerOunce = data?.price
        
        if (usdPerOunce && usdPerOunce > 0) {
          const pricePerGram24ct = (usdPerOunce * usdToAED) / 31.1035
          const pricePerGram22ct = pricePerGram24ct * (0.916 / 0.999)
          return {
            price24ct: Math.round(pricePerGram24ct * 100) / 100,
            price22ct: Math.round(pricePerGram22ct * 100) / 100,
            source: 'Gold-API'
          }
        }
      }
    } catch (error) {
      console.warn('Gold-API fallback failed:', error)
    }
    
    return null
  }
  
  // ETF/Stock price fetching
  static async fetchETFPrice(ticker: string): Promise<{ price: number, source: string } | null> {
    try {
      const response = await fetch(`https://query1.finance.yahoo.com/v8/finance/chart/${ticker}`, {
        headers: { 'User-Agent': 'Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7)' }
      })
      if (response.ok) {
        const data: any = await response.json()
        const price = data?.chart?.result?.[0]?.meta?.regularMarketPrice
        
        if (price && price > 0) {
          return { price, source: 'Yahoo Finance' }
        }
      }
    } catch (error) {
      console.warn(`Yahoo Finance fetch failed for ${ticker}:`, error)
    }
    
    return null
  }
  
  // Crypto price fetching with fallback
  static async fetchCryptoPrice(coinId: string): Promise<{ priceAED: number, priceUSD: number, source: string } | null> {
    // Primary: CoinGecko
    try {
      const response = await fetch(`https://api.coingecko.com/api/v3/simple/price?ids=${coinId}&vs_currencies=aed,usd`, {
        headers: { 'User-Agent': 'Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7)' }
      })
      if (response.ok) {
        const data: any = await response.json()
        const priceAED = data?.[coinId]?.aed
        const priceUSD = data?.[coinId]?.usd
        
        if (priceAED && priceAED > 0) {
          return { priceAED, priceUSD: priceUSD || 0, source: 'CoinGecko' }
        }
      }
    } catch (error) {
      console.warn(`CoinGecko fetch failed for ${coinId}:`, error)
    }
    
    // Fallback: CoinCap
    try {
      const response = await fetch(`https://api.coincap.io/v2/assets/${coinId}`)
      if (response.ok) {
        const data: any = await response.json()
        const priceUSD = parseFloat(data?.data?.priceUsd)
        
        if (priceUSD && priceUSD > 0) {
          const usdToAED = 3.67
          const priceAED = priceUSD * usdToAED
          return { priceAED, priceUSD, source: 'CoinCap' }
        }
      }
    } catch (error) {
      console.warn(`CoinCap fallback failed for ${coinId}:`, error)
    }
    
    return null
  }
  
  // FX Rate fetching
  static async fetchFXRate(fromCurrency: string, toCurrency: string = 'AED'): Promise<{ rate: number, source: string } | null> {
    // Primary: ExchangeRate API
    try {
      const response = await fetch(`https://open.er-api.com/v6/latest/${fromCurrency}`)
      if (response.ok) {
        const data: any = await response.json()
        const rate = data?.rates?.[toCurrency]
        
        if (rate && rate > 0) {
          return { rate: 1 / rate, source: 'ExchangeRate API' }
        }
      }
    } catch (error) {
      console.warn(`ExchangeRate API failed for ${fromCurrency}:`, error)
    }
    
    // Fallback: exchangerate.host
    try {
      const response = await fetch(`https://api.frankfurter.dev/v1/latest?base=${fromCurrency}&symbols=${toCurrency}`)
      if (response.ok) {
        const data: any = await response.json()
        const rate = data?.rates?.[toCurrency]
        
        if (rate && rate > 0) {
          return { rate: 1 / rate, source: 'exchangerate.host' }
        }
      }
    } catch (error) {
      console.warn(`exchangerate.host fallback failed for ${fromCurrency}:`, error)
    }
    
    return null
  }
}
