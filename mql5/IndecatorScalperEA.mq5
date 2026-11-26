//+------------------------------------------------------------------+
//|                                           IndecatorScalperEA.mq5 |
//|                     Copyright 2026, Indecator Institutional SMC  |
//|                 Autonomous 1m/3m High-Speed Scalping Robot       |
//|                    STRICTLY LOCKED TO XAUUSDc (GOLD ONLY)        |
//+------------------------------------------------------------------+
#property copyright "Indecator SMC Terminal"
#property link      "http://localhost:3000"
#property version   "1.30"
#property strict

#include <Trade\Trade.mqh>
#include <Trade\PositionInfo.mqh>

CTrade         m_trade;
CPositionInfo  m_position;

enum ENUM_LOT_MODE
{
   LOT_FIXED,        // Fixed Lot Size (e.g. 0.01)
   LOT_RISK_PERCENT  // Risk % of Equity (e.g. 0.5% per trade)
};

input group "--- Execution Settings (XAUUSDc Gold Only) ---"
input string         InpServerUrl       = "http://127.0.0.1:3000/api/scalp";  // Indecator Scalper API
input ENUM_LOT_MODE  InpLotMode         = LOT_FIXED;                          // Lot Sizing Mode
input double         InpFixedLot        = 0.01;                               // Fixed Lot Size (0.01)
input double         InpRiskPercent     = 0.5;                                // Risk % per trade (if Risk Mode selected)
input int            InpMinScore        = 50;                                 // Minimum Confluence Score (50 = Trades Every 1m Confirmation)
input int            InpMaxOpenTrades   = 5;                                  // Max Concurrent Trades (5 Entries Max)
input double         InpMinSpacing      = 0.20;                               // Spacing Between Entries ($0.20)
input ulong          InpMagicNumber     = 992601;                             // Magic Number

input group "--- Trade Management ---"
input bool           InpAutoBreakeven   = true;                               // Move SL to Breakeven in Profit
input double         InpBeProfitTrigger = 0.10;                               // Fast BE Trigger ($0.10 profit)
input double         InpBeBuffer        = 0.05;                               // Guaranteed Profit on BE ($0.05)
input int            InpPollingSec      = 1;                                  // Fast Polling (1 Second)

datetime lastPollTime = 0;
datetime lastOrderTime = 0;

string GetTfString(ENUM_TIMEFRAMES tf)
{
   switch(tf)
   {
      case PERIOD_M1:  return "1m";
      case PERIOD_M3:  return "3m";
      case PERIOD_M5:  return "5m";
      case PERIOD_M15: return "15m";
      default:         return "1m";
   }
}

int OnInit()
{
   // STRICT SYMBOL GUARD: ONLY ALLOW GOLD (XAUUSD / XAUUSDc / GOLD)
   string symUpper = _Symbol;
   StringToUpper(symUpper);
   if(StringFind(symUpper, "XAU") == -1 && StringFind(symUpper, "GOLD") == -1)
   {
      PrintFormat("[GUARD REJECTED] Indecator Scalper is locked strictly to Gold (XAUUSDc only). Symbol '%s' is BLOCKED!", _Symbol);
      Alert(StringFormat("Indecator Scalper only runs on XAUUSDc (Gold). '%s' rejected!", _Symbol));
      return(INIT_FAILED);
   }

   m_trade.SetExpertMagicNumber(InpMagicNumber);
   m_trade.SetDeviationInPoints(20);
   m_trade.SetTypeFillingBySymbol(_Symbol);

   PrintFormat("[INIT] Indecator Autonomous Scalper (5 Entries Max) locked to %s [%s] | Lot: %.2f | Magic: %d", _Symbol, GetTfString(_Period), InpFixedLot, InpMagicNumber);
   return(INIT_SUCCEEDED);
}

void OnDeinit(const int reason)
{
   Print("[STOP] Indecator Scalper stopped.");
}

int CountOpenPositions()
{
   int count = 0;
   int total = PositionsTotal();
   for(int i = 0; i < total; i++)
   {
      ulong ticket = PositionGetTicket(i);
      if(ticket <= 0) continue;
      if(PositionGetString(POSITION_SYMBOL) == _Symbol && PositionGetInteger(POSITION_MAGIC) == InpMagicNumber)
      {
         count++;
      }
   }
   return count;
}

bool IsFarEnoughFromExistingTrades(double targetEntry, double minSpacing)
{
   int total = PositionsTotal();
   for(int i = 0; i < total; i++)
   {
      ulong ticket = PositionGetTicket(i);
      if(ticket <= 0) continue;
      if(PositionGetString(POSITION_SYMBOL) == _Symbol && PositionGetInteger(POSITION_MAGIC) == InpMagicNumber)
      {
         double openPrice = PositionGetDouble(POSITION_PRICE_OPEN);
         if(MathAbs(targetEntry - openPrice) < minSpacing)
         {
            return false; // Already have a position close to this price
         }
      }
   }
   return true;
}

void ManageAllPositions()
{
   int total = PositionsTotal();
   int digits = (int)SymbolInfoInteger(_Symbol, SYMBOL_DIGITS);

   for(int i = total - 1; i >= 0; i--)
   {
      ulong ticket = PositionGetTicket(i);
      if(ticket <= 0) continue;
      if(PositionGetString(POSITION_SYMBOL) != _Symbol) continue;
      if(PositionGetInteger(POSITION_MAGIC) != InpMagicNumber) continue;

      double curPrice  = PositionGetDouble(POSITION_PRICE_CURRENT);
      double openPrice = PositionGetDouble(POSITION_PRICE_OPEN);
      double curSl     = PositionGetDouble(POSITION_SL);
      double curTp     = PositionGetDouble(POSITION_TP);
      ENUM_POSITION_TYPE type = (ENUM_POSITION_TYPE)PositionGetInteger(POSITION_TYPE);

      if(InpAutoBreakeven)
      {
         double targetSl = 0;

         if(type == POSITION_TYPE_BUY)
         {
            double gain = curPrice - openPrice;
            if(gain >= 0.50)
            {
               targetSl = openPrice + 0.20; // +0.50 profit -> SL to +0.20
            }
            else if(gain >= 0.15)
            {
               targetSl = openPrice + 0.10; // +0.15 profit -> SL to +0.10
            }
            else if(gain >= 0.10)
            {
               targetSl = openPrice + 0.05; // +0.10 profit -> SL to +0.05
            }

            if(targetSl > 0)
            {
               targetSl = NormalizeDouble(targetSl, digits);
               if(targetSl > curSl + 0.005)
               {
                  if(m_trade.PositionModify(ticket, targetSl, curTp))
                  {
                     PrintFormat("[TIER-BE] BUY #%d Gain: +$%.2f -> SL moved to %.3f (+%.2f locked)",
                        ticket, gain, targetSl, targetSl - openPrice);
                  }
               }
            }
         }
         else if(type == POSITION_TYPE_SELL)
         {
            double gain = openPrice - curPrice;
            if(gain >= 0.50)
            {
               targetSl = openPrice - 0.20; // +0.50 profit -> SL to +0.20
            }
            else if(gain >= 0.15)
            {
               targetSl = openPrice - 0.10; // +0.15 profit -> SL to +0.10
            }
            else if(gain >= 0.10)
            {
               targetSl = openPrice - 0.05; // +0.10 profit -> SL to +0.05
            }

            if(targetSl > 0)
            {
               targetSl = NormalizeDouble(targetSl, digits);
               if(curSl == 0 || targetSl < curSl - 0.005)
               {
                  if(m_trade.PositionModify(ticket, targetSl, curTp))
                  {
                     PrintFormat("[TIER-BE] SELL #%d Gain: +$%.2f -> SL moved to %.3f (+%.2f locked)",
                        ticket, gain, targetSl, openPrice - targetSl);
                  }
               }
            }
         }
      }
   }
}

void OnTick()
{
   ManageAllPositions();

   datetime now = TimeCurrent();
   if(now - lastPollTime < InpPollingSec) return;
   lastPollTime = now;

   // Only evaluate entry if fewer than InpMaxOpenTrades are open (Max 5 entries)
   int openCount = CountOpenPositions();
   if(openCount >= InpMaxOpenTrades) return;

   // Instant zero-delay for Entry #1; 3-second rapid spacing for scale-in entries (#2 to #5)
   if(openCount > 0 && now - lastOrderTime < 3) return;

   PollAndExecuteSignal();
}

string ExtractJsonValue(const string &json, const string &key)
{
   string search = "\"" + key + "\":";
   int pos = StringFind(json, search);
   if(pos == -1) return "";

   pos += StringLen(search);
   while(pos < StringLen(json) && (StringGetCharacter(json, pos) == ' ' || StringGetCharacter(json, pos) == '\"'))
   {
      pos++;
   }

   int end = pos;
   while(end < StringLen(json))
   {
      ushort c = StringGetCharacter(json, end);
      if(c == '\"' || c == ',' || c == '}' || c == ']' || c == '\r' || c == '\n') break;
      end++;
   }

   return StringSubstr(json, pos, end - pos);
}

void PollAndExecuteSignal()
{
   string sym = "XAUUSD";
   string tf = GetTfString(_Period);
   string url = StringFormat("%s?symbol=%s&tf=%s", InpServerUrl, sym, tf);

   char postData[];
   char result[];
   string resultHeaders;
   string headers = "Content-Type: application/json\r\n";

   int res = WebRequest("GET", url, headers, 1500, postData, result, resultHeaders);
   if(res == -1)
   {
      int err = GetLastError();
      if(err == 4060)
      {
         Print("[WARN] WebRequest Error 4060: Add 'http://127.0.0.1:3000' and 'http://localhost:3000' to MT5 Allowed URLs!");
      }
      return;
   }

   string jsonStr = CharArrayToString(result, 0, WHOLE_ARRAY, CP_UTF8);
   if(StringLen(jsonStr) < 20) return;

   // Parse clean /api/scalp response
   string canExecute   = ExtractJsonValue(jsonStr, "canExecute");
   string isActionable = ExtractJsonValue(jsonStr, "isActionable");
   string timingState  = ExtractJsonValue(jsonStr, "timingState");
   string direction    = ExtractJsonValue(jsonStr, "direction");
   string scoreStr     = ExtractJsonValue(jsonStr, "score");
   string entryStr     = ExtractJsonValue(jsonStr, "entry");
   string slStr        = ExtractJsonValue(jsonStr, "stopLoss");
   string tp1Str       = ExtractJsonValue(jsonStr, "tp1");
   string tp2Str       = ExtractJsonValue(jsonStr, "tp2");

   int score = (int)StringToInteger(scoreStr);
   if(canExecute != "true" || score < InpMinScore) return;

   double targetEntry = StringToDouble(entryStr);
   double targetSl    = StringToDouble(slStr);
   double targetTp1   = StringToDouble(tp1Str);
   double targetTp2   = StringToDouble(tp2Str);

   if(targetSl <= 0 || targetTp1 <= 0) return;

   // Check minimum spacing between existing entries
   if(!IsFarEnoughFromExistingTrades(targetEntry, InpMinSpacing)) return;

   double lots = InpFixedLot;
   if(InpLotMode == LOT_RISK_PERCENT)
   {
      double equity = AccountInfoDouble(ACCOUNT_EQUITY);
      double riskUsd = equity * (InpRiskPercent / 100.0);
      double slDist = MathAbs(targetEntry - targetSl);
      if(slDist > 0)
      {
         double tickVal = SymbolInfoDouble(_Symbol, SYMBOL_TRADE_TICK_VALUE);
         double tickSize = SymbolInfoDouble(_Symbol, SYMBOL_TRADE_TICK_SIZE);
         if(tickVal > 0 && tickSize > 0)
         {
            double calculatedLot = riskUsd / ((slDist / tickSize) * tickVal);
            double step = SymbolInfoDouble(_Symbol, SYMBOL_VOLUME_STEP);
            lots = MathFloor(calculatedLot / step) * step;
         }
      }
      double minLot = SymbolInfoDouble(_Symbol, SYMBOL_VOLUME_MIN);
      double maxLot = SymbolInfoDouble(_Symbol, SYMBOL_VOLUME_MAX);
      lots = MathMax(minLot, MathMin(maxLot, lots));
   }

   int digits = (int)SymbolInfoInteger(_Symbol, SYMBOL_DIGITS);
   targetSl  = NormalizeDouble(targetSl, digits);
   targetTp1 = NormalizeDouble(targetTp1, digits);
   targetTp2 = NormalizeDouble(targetTp2, digits);

   int openCount = CountOpenPositions();

   if(direction == "LONG" || direction == "BUY")
   {
      PrintFormat("[SCALPER GOLD #%d/5] BUY Triggered! Entry: %.2f | SL: %.2f | TP: %.2f | Lots: %.2f",
         openCount + 1, targetEntry, targetSl, targetTp2, lots);
      if(m_trade.Buy(lots, _Symbol, 0, targetSl, targetTp2, StringFormat("Indecator Scalp #%d", openCount + 1)))
      {
         lastOrderTime = TimeCurrent();
         PrintFormat("[SUCCESS] Buy Order #%d/5 Executed Successfully on Gold!", openCount + 1);
      }
   }
   else if(direction == "SHORT" || direction == "SELL")
   {
      PrintFormat("[SCALPER GOLD #%d/5] SELL Triggered! Entry: %.2f | SL: %.2f | TP: %.2f | Lots: %.2f",
         openCount + 1, targetEntry, targetSl, targetTp2, lots);
      if(m_trade.Sell(lots, _Symbol, 0, targetSl, targetTp2, StringFormat("Indecator Scalp #%d", openCount + 1)))
      {
         lastOrderTime = TimeCurrent();
         PrintFormat("[SUCCESS] Sell Order #%d/5 Executed Successfully on Gold!", openCount + 1);
      }
   }
}
