const TITLE_RULES = [
  ["data-ai", /ai trainer|ai response|data annotat|data label|evaluator|rlhf|prompt engineer/i],
  ["tech", /developer|engineer|software|devops|cybersecurity|qa\b|programmer|architect/i],
  ["finance", /accountant|accounting|finance|bookkeeper|controller/i],
  ["travel", /travel|reservation|booking|tourism/i],
  ["admin-va", /virtual assistant|executive assistant|administrative assistant|admin assistant|personal assistant/i],
  ["sales", /sales|\bsdr\b|business development|account executive|appointment setter|closer/i],
  ["customer-success", /customer success|client success|customer experience|account manager/i],
  ["support", /customer support|technical support|support specialist|support agent|help desk|helpdesk/i],
  ["marketing", /marketing|media buyer|paid media|growth|seo|sem|demand generation/i],
  ["content-social", /content|social media|community manager|copywriter|video editor|creator/i],
  ["operations", /operations|coordinator|program manager|project manager/i]
];
const BODY_RULES = [
  ["customer-success", /customer success|client success|customer experience|customer lifecycle/i],
  ["support", /customer support|technical support|support specialist|support agent|help desk|helpdesk|chat support/i],
  ["travel", /travel assistant|travel operations|reservations?|booking agent|tourism|travel coordinator/i],
  ["admin-va", /virtual assistant|executive assistant|administrative assistant|admin assistant|personal assistant/i],
  ["operations", /operations|coordinator|project coordinator|business operations|ops coordinator/i],
  ["sales", /sales development|\bsdr\b|business development|account executive|sales representative|appointment setter|closer/i],
  ["marketing", /marketing|media buyer|paid media|growth|seo|sem|performance marketing|demand generation/i],
  ["ecommerce-crm", /e-?commerce|shopify|woocommerce|mercado libre|crm|salesforce|hubspot/i],
  ["content-social", /content|social media|community manager|copywriter|video editor|creator/i],
  ["data-ai", /data annotat|ai trainer|rlhf|prompt|data entry|data labeling|research assistant/i],
  ["tech", /software engineering|software development|devops|cybersecurity|quality assurance|data engineering/i],
  ["finance", /accounting|bookkeeping|financial operations/i]
];
const HIGH_RISK = [/registration fee/i,/application fee/i,/training fee/i,/pay.*before.*start/i,/deposit.*required/i,/buy.*equipment.*from us/i,/gift card/i,/crypto wallet/i,/telegram only/i,/whatsapp only/i,/send.*money/i,/wire transfer/i];
const ARGENTINA_NEGATIVE = /us only|usa only|united states only|canada only|europe only|uk only|north america(?: only|\b)|united states(?:,| and) canada|us(?:,| and) canada|must be based in the us|u\.s\. residents only|remote \(us|remote \(usa|remote \(north america/i;
export function classifyCategory(job){const title=String(job.title||"");for(const [id,rx] of TITLE_RULES)if(rx.test(title))return id;const body=String(job.description||"")+" "+(job.tags||[]).join(" ");for(const [id,rx] of BODY_RULES)if(rx.test(body))return id;return"other";}
export function argentinaEligibility(job){const title=String(job.title||""),location=String(job.location||""),description=String(job.description||""),positive=`${location} ${description}`,hardRestriction=/us only|usa only|united states only|canada only|europe only|uk only|north america|must be based in the us|u\.s\. residents only/i;if(hardRestriction.test(title)||((/united states|usa|u\.s\.|canada|north america|europe|united kingdom|\buk\b/i.test(location))&&!/argentina|latam|latin america|south america/i.test(location)))return{score:5,label:"No compatible",reason:"La publicación restringe la ubicación fuera de Argentina."};if(ARGENTINA_NEGATIVE.test(`${title} ${location} ${description}`))return{score:5,label:"No compatible",reason:"La publicación restringe la ubicación."};if(/argentina/i.test(positive))return{score:100,label:"Argentina",reason:"Menciona Argentina explícitamente."};if(/latam|latin america|south america|americas/i.test(positive))return{score:92,label:"LatAm",reason:"Admite LatAm/Américas."};if(/worldwide|anywhere|global/i.test(positive)||job.worldwide)return{score:82,label:"Worldwide",reason:"Publicación global/remota."};return{score:48,label:"A verificar",reason:"No publica una restricción geográfica concluyente."};}
export function scamAssessment(job){const text=String(job.title||"")+" "+String(job.company||"")+" "+String(job.description||"");const hits=HIGH_RISK.filter(rx=>rx.test(text)).map(rx=>rx.source);const sourceTrust=Number(job.sourceTrust||60);const score=Math.max(0,Math.min(100,sourceTrust-hits.length*35));return{score,label:hits.length?"Revisar":score>=80?"Buena señal":"Sin señales fuertes",reasons:hits};}
export function normalizeMonthlyPay({min,max,currency="USD",period="annual",raw=""}={}){const nmin=Number(min),nmax=Number(max);if(!Number.isFinite(nmin)&&!Number.isFinite(nmax))return{raw:raw||"No publicado",monthlyMin:null,monthlyMax:null,currency};const factor=period==="hourly"?160:period==="weekly"?4.33:period==="monthly"?1:period==="annual"?1/12:1;return{raw,monthlyMin:Number.isFinite(nmin)?Math.round(nmin*factor):null,monthlyMax:Number.isFinite(nmax)?Math.round(nmax*factor):null,currency,period,estimateBasis:period==="hourly"?"160 h/mes":period==="weekly"?"4,33 semanas/mes":null};}
export function priorityBreakdown(job){const argentina=argentinaEligibility(job),scam=scamAssessment(job),pay=job.pay?.monthlyMin||job.pay?.monthlyMax?100:45,noFee=job.workerFee===false?100:job.workerFee===true?0:55,freshDays=job.publishedAt?Math.max(0,(Date.now()-new Date(job.publishedAt).getTime())/86400000):10,freshness=Math.max(20,100-Math.min(30,freshDays)*2.5),preferred=["customer-success","support","travel","admin-va","operations","sales","marketing","ecommerce-crm","content-social","data-ai"],role=preferred.includes(job.category)?100:68,score=Math.round(Math.max(0,Math.min(100,argentina.score*.30+scam.score*.23+pay*.14+noFee*.13+freshness*.10+role*.10)));return{score,components:{argentina:argentina.score,sourceAndScam:scam.score,payKnown:pay,noWorkerFee:noFee,freshness:Math.round(freshness),preferredRole:role}};}
export function finalizeJob(job){const category=job.category||classifyCategory(job),base={...job,category},priority=priorityBreakdown(base);return{...base,argentina:argentinaEligibility(base),scam:scamAssessment(base),priority:priority.score,priorityComponents:priority.components};}
