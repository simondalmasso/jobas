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

const HIGH_RISK = [
  /registration fee/i,/application fee/i,/training fee/i,/pay.*before.*start/i,/deposit.*required/i,
  /buy.*equipment.*from us/i,/gift card/i,/crypto wallet/i,/telegram only/i,/whatsapp only/i,/send.*money/i,/wire transfer/i
];

const ARGENTINA_NEGATIVE = /us only|usa only|united states only|canada only|europe only|uk only|north america(?: only|\b)|united states(?:,| and) canada|us(?:,| and) canada|must be based in the us|u\.s\. residents only|remote \(us|remote \(usa|remote \(north america/i;

export function classifyCategory(job){
  const title=String(job.title||"");
  for(const [id,rx] of TITLE_RULES)if(rx.test(title))return id;
  const body=String(job.description||"")+" "+(job.tags||[]).join(" ");
  for(const [id,rx] of BODY_RULES)if(rx.test(body))return id;
  return"other";
}

export function argentinaEligibility(job){
  const title=String(job.title||""),location=String(job.location||""),description=String(job.description||"");
  const positive=`${location} ${description}`;
  const hardRestriction=/us only|usa only|united states only|canada only|europe only|uk only|north america|must be based in the us|u\.s\. residents only/i;
  if(hardRestriction.test(title)||((/united states|usa|u\.s\.|canada|north america|europe|united kingdom|\buk\b/i.test(location))&&!/argentina|latam|latin america|south america/i.test(location)))return{score:5,label:"No compatible",reason:"La publicación restringe la ubicación fuera de Argentina."};
  if(ARGENTINA_NEGATIVE.test(`${title} ${location} ${description}`)||
     /(?:except|excluding|exclude|not (?:available|hiring|eligible) in|outside of)\s+(?:the\s+)?argentina|argentina\s+(?:excluded|not eligible)/i.test(`${title} ${location} ${description}`))
    return{score:5,label:"No compatible",reason:"La publicación restringe la ubicación."};
  if(/argentina/i.test(positive))return{score:100,label:"Argentina",reason:"Menciona Argentina explícitamente."};
  if(/latam|latin america|south america|americas/i.test(positive))return{score:92,label:"LatAm",reason:"Admite LatAm/Américas."};
  if(/worldwide|anywhere|global/i.test(positive)||job.worldwide)return{score:82,label:"Worldwide",reason:"Publicación global/remota."};
  return{score:48,label:"A verificar",reason:"No publica una restricción geográfica concluyente."};
}

export function scamAssessment(job){
  const text=String(job.title||"")+" "+String(job.company||"")+" "+String(job.description||"");
  const hits=HIGH_RISK.filter(rx=>rx.test(text)).map(rx=>rx.source);
  const sourceTrust=Number(job.sourceTrust||60);
  const score=Math.max(0,Math.min(100,sourceTrust-hits.length*35));
  return{score,label:hits.length?"Revisar":score>=80?"Buena señal":"Sin señales fuertes",reasons:hits};
}

export function normalizeMonthlyPay({min,max,currency="USD",period="annual",raw=""}={}){
  const nmin=min==null||min===""?null:Number(min);
  const nmax=max==null||max===""?null:Number(max);
  if(!Number.isFinite(nmin)&&!Number.isFinite(nmax))return{raw:raw||"No publicado",monthlyMin:null,monthlyMax:null,currency};
  const factor=period==="hourly"?160:period==="weekly"?4.33:period==="monthly"?1:period==="annual"?1/12:1;
  return{
    raw,
    monthlyMin:Number.isFinite(nmin)?Math.round(nmin*factor):null,
    monthlyMax:Number.isFinite(nmax)?Math.round(nmax*factor):null,
    currency,period,
    estimateBasis:period==="hourly"?"160 h/mes":period==="weekly"?"4,33 semanas/mes":null
  };
}

/**
 * Generic server-side quality signal.
 * This is intentionally NOT a candidate/job fit score.
 * Personal relevance belongs in the browser and is derived from the user's local profile.
 */
export function qualityBreakdown(job,now=Date.now()){
  const argentina=argentinaEligibility(job);
  const scam=scamAssessment(job);
  const compensation=job.pay?.monthlyMin!=null||job.pay?.monthlyMax!=null?100:45;
  const noWorkerFee=job.workerFee===false?100:job.workerFee===true?0:55;
  const published=job.publishedAt?new Date(job.publishedAt).getTime():NaN;
  const ageDays=Number.isFinite(published)?Math.max(0,(now-published)/86400000):10;
  const freshness=Math.max(20,100-Math.min(30,ageDays)*2.5);
  const score=Math.round(Math.max(0,Math.min(100,
    argentina.score*.25+
    scam.score*.30+
    compensation*.15+
    noWorkerFee*.10+
    freshness*.20
  )));
  return{
    score,
    components:{
      locationCompatibility:argentina.score,
      sourceAndRisk:scam.score,
      compensationTransparency:compensation,
      noWorkerFee,
      freshness:Math.round(freshness)
    }
  };
}

export function finalizeJob(job){
  const {priority:_priority,priorityComponents:_priorityComponents,rank:_rank,rankReason:_rankReason,...publicJob}=job||{};
  const category=publicJob.category||classifyCategory(publicJob);
  const base={...publicJob,category};
  const quality=qualityBreakdown(base);
  return{
    ...base,
    argentina:argentinaEligibility(base),
    scam:scamAssessment(base),
    qualityScore:quality.score,
    qualityComponents:quality.components
  };
}
