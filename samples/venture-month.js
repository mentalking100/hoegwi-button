const life385PriorAfterMonth=life38GameplayAfterMonth;life38GameplayAfterMonth=function(s,date,cmd){
const out=life385PriorAfterMonth(s,date,cmd);life385RestoreCivilianLife(s);
const g=life38EnsureGameplay(s),v=g.careers.venture,records=life38Root(s).records;records.economy??={};
if(v){
const rec=records.economy.ventures??={};
// The first settled month can be a loss. No prior record means this month's
// actual profit is the first peak, not a fictitious zero or a missing object.
const profit=BigInt(v.profit),previousPeak=BigInt(rec[v.id]?.peakMonthlyProfit??v.profit);
rec[v.id]={id:v.id,kind:v.kind,status:v.status,opened:v.started,months:v.months,peakMonthlyProfit:String(previousPeak>profit?previousPeak:profit),breakthroughYear:v.breakthroughYear||null,saleProceeds:v.saleProceeds||'0'};
if(profit>=100000000n)life38Record(s,'venture-profit',null,'사업의 월 순이익이 1억 원을 넘어섰다.');
}return out;};
