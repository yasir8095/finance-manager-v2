// Price service - uses main process IPC for all API calls
export const PriceService = {
  fetchGoldPrice: async () => {
    return await (window as any).electronAPI.fetchGoldPrice()
  },
  
  fetchETFPrice: async (ticker: string) => {
    return await (window as any).electronAPI.fetchETFPrice(ticker)
  },
  
  fetchCryptoPrice: async (coinId: string) => {
    return await (window as any).electronAPI.fetchCryptoPrice(coinId)
  },
  
  fetchFXRate: async (fromCurrency: string, toCurrency: string = 'AED') => {
    return await (window as any).electronAPI.fetchFXRate(fromCurrency, toCurrency)
  }
}
