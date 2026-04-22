//+------------------------------------------------------------------+
//|                                              TradeAI_Bridge.mq5  |
//|                         Copyright 2026, TradeAI - himdeunn.my.id |
//|                              https://trade-ai.himdeunn.my.id     |
//+------------------------------------------------------------------+
#property copyright "Copyright 2026, TradeAI"
#property link      "https://trade-ai.himdeunn.my.id"
#property version   "1.10"
#property strict
#property description "TradeAI EA Bridge - Syncs live trade data to your TradeAI dashboard."

//--- Input Parameters
input string   InpApiKey    = "";                                   // EA API Key (from Settings page)
input string   InpServerUrl = "https://trade-ai.himdeunn.my.id";   // TradeAI Server URL
input int      InpSyncIntervalSeconds = 300;                        // Auto-sync interval in seconds (0 = disable)

//--- Global Variables
string   g_webhookUrl;
datetime g_lastSyncTime = 0;
int      g_timerSeconds;

//+------------------------------------------------------------------+
//| Expert initialization function                                   |
//+------------------------------------------------------------------+
int OnInit()
  {
   if(InpApiKey == "")
     {
      Alert("TradeAI Bridge: API Key is empty! Please set your EA Key in the input parameters.");
      Print("ERROR: API Key is empty. Please copy your EA Key from the TradeAI Settings page.");
      return(INIT_PARAMETERS_INCORRECT);
     }

   g_webhookUrl = InpServerUrl + "/api/webhooks/ea";
   g_timerSeconds = (InpSyncIntervalSeconds > 0) ? InpSyncIntervalSeconds : 0;

   Print("==============================================");
   Print("TradeAI Bridge v1.10 - Initialized");
   Print("Server: ", g_webhookUrl);
   Print("Account: ", AccountInfoInteger(ACCOUNT_LOGIN));
   Print("==============================================");

   if(g_timerSeconds > 0)
      EventSetTimer(g_timerSeconds);

   SyncData("init");
   return(INIT_SUCCEEDED);
  }

//+------------------------------------------------------------------+
//| Expert deinitialization function                                 |
//+------------------------------------------------------------------+
void OnDeinit(const int reason)
  {
   EventKillTimer();
   Print("TradeAI Bridge: Stopped. Reason code: ", reason);
  }

//+------------------------------------------------------------------+
//| OnTrade - Fires on every trade event (open, close, modify)       |
//+------------------------------------------------------------------+
void OnTrade()
  {
   Print("TradeAI: Trade event detected, syncing...");
   SyncData("trade_event");
  }

//+------------------------------------------------------------------+
//| OnTimer - Periodic background sync                               |
//+------------------------------------------------------------------+
void OnTimer()
  {
   Print("TradeAI: Periodic sync...");
   SyncData("timer");
  }

//+------------------------------------------------------------------+
//| Main Sync Function                                               |
//+------------------------------------------------------------------+
void SyncData(string triggerSource)
  {
   string accountJson = StringFormat(
                           "\"accountInfo\":{\"balance\":%.2f,\"equity\":%.2f,\"margin\":%.2f,\"freeMargin\":%.2f,\"currency\":\"%s\",\"leverage\":%d,\"login\":%d,\"broker\":\"%s\"}",
                           AccountInfoDouble(ACCOUNT_BALANCE),
                           AccountInfoDouble(ACCOUNT_EQUITY),
                           AccountInfoDouble(ACCOUNT_MARGIN),
                           AccountInfoDouble(ACCOUNT_MARGIN_FREE),
                           AccountInfoString(ACCOUNT_CURRENCY),
                           (int)AccountInfoInteger(ACCOUNT_LEVERAGE),
                           (int)AccountInfoInteger(ACCOUNT_LOGIN),
                           AccountInfoString(ACCOUNT_COMPANY)
                        );

   HistorySelect(TimeCurrent() - 86400 * 7, TimeCurrent());
   int    totalHistory = HistoryDealsTotal();
   string tradesJson   = "\"trades\":[";
   int    added        = 0;

   for(int i = totalHistory - 1; i >= 0; i--)
     {
      ulong ticket = HistoryDealGetTicket(i);
      if(ticket == 0) continue;

      long dealType = HistoryDealGetInteger(ticket, DEAL_TYPE);
      if(dealType != DEAL_TYPE_BUY && dealType != DEAL_TYPE_SELL) continue;

      long     positionId = HistoryDealGetInteger(ticket, DEAL_POSITION_ID);
      double   openPrice  = 0;
      datetime openTime   = 0;

      for(int j = 0; j < totalHistory; j++)
        {
         ulong checkTicket = HistoryDealGetTicket(j);
         if(HistoryDealGetInteger(checkTicket, DEAL_POSITION_ID) == positionId &&
            HistoryDealGetInteger(checkTicket, DEAL_ENTRY) == DEAL_ENTRY_IN)
           {
            openPrice = HistoryDealGetDouble(checkTicket, DEAL_PRICE);
            openTime  = (datetime)HistoryDealGetInteger(checkTicket, DEAL_TIME);
            break;
           }
        }

      datetime closeTime  = (datetime)HistoryDealGetInteger(ticket, DEAL_TIME);
      string   symbol     = HistoryDealGetString(ticket, DEAL_SYMBOL);
      double   closePrice = HistoryDealGetDouble(ticket, DEAL_PRICE);
      double   profit     = HistoryDealGetDouble(ticket, DEAL_PROFIT);
      double   commission = HistoryDealGetDouble(ticket, DEAL_COMMISSION);
      double   swap       = HistoryDealGetDouble(ticket, DEAL_SWAP);
      double   volume     = HistoryDealGetDouble(ticket, DEAL_VOLUME);
      string   typeStr    = (dealType == DEAL_TYPE_BUY) ? "buy" : "sell";

      if(added > 0) tradesJson += ",";

      tradesJson += StringFormat(
                      "{\"ticket\":%d,\"symbol\":\"%s\",\"type\":\"%s\",\"volume\":%.2f,\"openPrice\":%.5f,\"closePrice\":%.5f,\"profit\":%.2f,\"commission\":%.2f,\"swap\":%.2f,\"openTime\":\"%s\",\"closeTime\":\"%s\"}",
                      (int)ticket, symbol, typeStr, volume,
                      openPrice, closePrice, profit, commission, swap,
                      TimeToString(openTime, TIME_DATE | TIME_SECONDS),
                      TimeToString(closeTime, TIME_DATE | TIME_SECONDS)
                   );
      added++;
      if(added >= 20) break;
     }
   tradesJson += "]";

   int    totalPositions = PositionsTotal();
   string openPosJson    = "\"openPositions\":[";

   for(int i = 0; i < totalPositions; i++)
     {
      ulong posTicket = PositionGetTicket(i);
      if(posTicket == 0) continue;

      string   posSymbol    = PositionGetString(POSITION_SYMBOL);
      long     posType      = PositionGetInteger(POSITION_TYPE);
      double   posVolume    = PositionGetDouble(POSITION_VOLUME);
      double   posOpenPrice = PositionGetDouble(POSITION_PRICE_OPEN);
      double   posProfit    = PositionGetDouble(POSITION_PROFIT);
      double   posSwap      = PositionGetDouble(POSITION_SWAP);
      datetime posTime      = (datetime)PositionGetInteger(POSITION_TIME);
      string   posTypeStr   = (posType == POSITION_TYPE_BUY) ? "buy" : "sell";

      if(i > 0) openPosJson += ",";

      openPosJson += StringFormat(
                       "{\"ticket\":%d,\"symbol\":\"%s\",\"type\":\"%s\",\"volume\":%.2f,\"openPrice\":%.5f,\"currentProfit\":%.2f,\"swap\":%.2f,\"openTime\":\"%s\"}",
                       (int)posTicket, posSymbol, posTypeStr, posVolume,
                       posOpenPrice, posProfit, posSwap,
                       TimeToString(posTime, TIME_DATE | TIME_SECONDS)
                    );
     }
   openPosJson += "]";

   string fullJson = StringFormat("{%s,%s,%s,\"trigger\":\"%s\"}",
                                  accountJson, tradesJson, openPosJson, triggerSource);

   char   postData[];
   char   resultData[];
   string resultHeaders;
   string requestHeaders = "Content-Type: application/json\r\nx-api-key: " + InpApiKey + "\r\n";

   StringToCharArray(fullJson, postData, 0, StringLen(fullJson), CP_UTF8);

   int statusCode = WebRequest(
                       "POST",
                       g_webhookUrl,
                       requestHeaders,
                       10000,
                       postData,
                       resultData,
                       resultHeaders
                    );

   if(statusCode == 200 || statusCode == 201)
     {
      g_lastSyncTime = TimeCurrent();
      Print("TradeAI: Sync SUCCESS [", triggerSource, "] - Closed trades: ", added, " | Open positions: ", totalPositions);
     }
   else if(statusCode == 401)
     {
      Print("TradeAI: FAILED - Invalid API Key. Check your key in EA inputs.");
      Alert("TradeAI: Invalid API Key! Please update your EA Key.");
     }
   else if(statusCode == -1)
     {
      Print("TradeAI: FAILED - URL not whitelisted. Go to: Tools > Options > Expert Advisors > Allow WebRequest");
      Print("TradeAI: Add this URL: https://trade-ai.himdeunn.my.id");
      Alert("TradeAI: URL not whitelisted! See MT5 Journal for instructions.");
     }
   else
     {
      string resultStr = CharArrayToString(resultData);
      Print("TradeAI: FAILED - HTTP ", statusCode, " | ", resultStr);
     }
  }
//+------------------------------------------------------------------+
