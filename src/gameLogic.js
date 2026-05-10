export const MAX_TURNS = 10;
export const FORECAST_HORIZON = 3;
export const RETREATMENT_COOLDOWN_TURNS = 2;

export const EVENT_LABELS = {
  heatwave: '猛暑',
  frost: '遅霜',
  flood: '冠水',
  drought: '乾燥',
  rain: '雨',
  clear: '晴れ',
  warm: '高温傾向',
  warning: '注意報',
  cloudy: 'くもり',
};

export const ITEM_LIBRARY = {
  heatShield: {
    key: 'heatShield',
    name: '猛暑対策液',
    cost: 220,
    delay: 2,
    duration: 4,
    timingLabel: '事前処理型',
    description: '猛暑の数週間前に使うと強く効く。猛暑のあとに使っても遅い。',
  },
  frostGuard: {
    key: 'frostGuard',
    name: '低温・凍霜害対策液',
    cost: 180,
    delay: 0,
    duration: 1,
    timingLabel: '直前処理型',
    description: '遅霜の直前散布に向く。早すぎると効果が切れる。',
  },
  rootBooster: {
    key: 'rootBooster',
    name: '根の回復促進剤',
    cost: 200,
    delay: 0,
    duration: 2,
    timingLabel: '回復処理型',
    description: '冠水中の被害を少し抑え、冠水後の回復を早める。',
  },
};

export const STAGES = [
  {
    id: 'rice-summer',
    name: 'ステージ1：水稲の夏',
    shortName: '水稲の夏',
    crop: 'rice',
    mission: '猛暑を読む。事前処理で無処理区との差を作る。',
    primaryItemKey: 'heatShield',
    lessonType: 'preemptive',
    lessonSummary: '猛暑対策液は、猛暑の前に仕込めた区ほど差が出る。',
    seasonLabels: ['7/1週', '7/8週', '7/15週', '7/22週', '7/29週', '8/5週', '8/12週', '8/19週', '8/26週', '9/2週'],
    timeline: [
      { forecast: 'warm', actual: 'warm' },
      { forecast: 'warning', actual: 'clear' },
      { forecast: 'heatwave', actual: 'heatwave' },
      { forecast: 'heatwave', actual: 'heatwave' },
      { forecast: 'rain', actual: 'rain' },
      { forecast: 'clear', actual: 'drought' },
      { forecast: 'warm', actual: 'warm' },
      { forecast: 'heatwave', actual: 'heatwave' },
      { forecast: 'cloudy', actual: 'clear' },
      { forecast: 'clear', actual: 'clear' },
    ],
  },
  {
    id: 'spring-orchard',
    name: 'ステージ2：春先の果樹園',
    shortName: '春先の果樹園',
    crop: 'orchard',
    mission: '遅霜を読む。直前処理で花芽を守る。',
    primaryItemKey: 'frostGuard',
    lessonType: 'justInTime',
    lessonSummary: '低温・凍霜害対策液は、遅霜の直前に入れた区ほど守れる。',
    seasonLabels: ['3/1週', '3/8週', '3/15週', '3/22週', '3/29週', '4/5週', '4/12週', '4/19週', '4/26週', '5/3週'],
    timeline: [
      { forecast: 'cloudy', actual: 'cloudy' },
      { forecast: 'warning', actual: 'frost' },
      { forecast: 'clear', actual: 'clear' },
      { forecast: 'frost', actual: 'frost' },
      { forecast: 'rain', actual: 'rain' },
      { forecast: 'warm', actual: 'warm' },
      { forecast: 'warning', actual: 'cloudy' },
      { forecast: 'frost', actual: 'frost' },
      { forecast: 'clear', actual: 'clear' },
      { forecast: 'warm', actual: 'warm' },
    ],
  },
  {
    id: 'long-rain-flood',
    name: 'ステージ3：長雨と冠水',
    shortName: '長雨と冠水',
    crop: 'flood',
    mission: '冠水後の立て直しを比べる。回復の速さで差を作る。',
    primaryItemKey: 'rootBooster',
    lessonType: 'recovery',
    lessonSummary: '根の回復促進剤は、冠水の直後に使うと最も差が出る。',
    seasonLabels: ['6/1週', '6/8週', '6/15週', '6/22週', '6/29週', '7/6週', '7/13週', '7/20週', '7/27週', '8/3週'],
    timeline: [
      { forecast: 'rain', actual: 'rain' },
      { forecast: 'rain', actual: 'rain' },
      { forecast: 'flood', actual: 'flood' },
      { forecast: 'cloudy', actual: 'rain' },
      { forecast: 'flood', actual: 'flood' },
      { forecast: 'clear', actual: 'clear' },
      { forecast: 'rain', actual: 'rain' },
      { forecast: 'flood', actual: 'flood' },
      { forecast: 'cloudy', actual: 'cloudy' },
      { forecast: 'clear', actual: 'clear' },
    ],
  },
];

const EVENT_DAMAGE = {
  heatwave: { quality: 14, yield: 11, stamina: 17, waterlogged: 0 },
  frost: { quality: 16, yield: 18, stamina: 11, waterlogged: 0 },
  flood: { quality: 10, yield: 18, stamina: 18, waterlogged: 3 },
  drought: { quality: 8, yield: 12, stamina: 15, waterlogged: 0 },
  rain: { quality: 1, yield: 2, stamina: 3, waterlogged: 0 },
  warm: { quality: 1, yield: 1, stamina: 4, waterlogged: 0 },
  warning: { quality: 0, yield: 0, stamina: 2, waterlogged: 0 },
  cloudy: { quality: 0, yield: 0, stamina: 2, waterlogged: 0 },
  clear: { quality: 0, yield: 0, stamina: 1, waterlogged: 0 },
};

const clamp = (value, min = 0, max = 120) => Math.max(min, Math.min(max, Number.isFinite(value) ? value : min));
const clampGrowth = (value) => clamp(value, 0, 100);

export const getStageById = (stageId) => STAGES.find((stage) => stage.id === stageId) || STAGES[0];
export const getItem = (key) => ITEM_LIBRARY[key] || null;
export const getEventLabel = (eventKey) => EVENT_LABELS[eventKey] || '不明';

export function getPrimaryItem(stageOrId) {
  const stage = typeof stageOrId === 'string' ? getStageById(stageOrId) : stageOrId;
  return getItem(stage?.primaryItemKey);
}

export function getSelectedItem(state) {
  return getItem(state?.selectedItemKey) || getPrimaryItem(state?.stageId);
}

export function createPlots() {
  return [
    createPlot('plot-control', '無処理区', 'control', true),
    createPlot('plot-a', '試験区', 'trial', false),
  ];
}

export function createInitialGameState(stageId = STAGES[0].id, itemKey) {
  const stage = getStageById(stageId);
  const item = getItem(itemKey) || getPrimaryItem(stage);
  const maxUses = 4;

  return {
    stageId: stage.id,
    selectedItemKey: item?.key || stage.primaryItemKey,
    turn: 1,
    maxTurns: Math.min(MAX_TURNS, stage.timeline.length),
    budget: (item?.cost || 0) * maxUses,
    spent: 0,
    maxUses,
    remainingUses: maxUses,
    turnActionUsed: false,
    plots: createPlots(),
    logs: [
      `${stage.name}を開始。`,
      `比較対象は無処理区。主役資材は${item?.name || '未設定'}。`,
      stage.lessonSummary,
    ],
    finished: false,
    settlement: null,
    lastEvent: 'clear',
  };
}

export function getSelectedPlot(state, selectedPlotId) {
  const plots = Array.isArray(state?.plots) ? state.plots : [];
  return plots.find((plot) => plot.id === selectedPlotId) || plots.find((plot) => !plot.locked) || plots[0] || null;
}

export function getForecast(stage, turn, horizon = FORECAST_HORIZON) {
  const timeline = Array.isArray(stage?.timeline) ? stage.timeline : [];
  const seasonLabels = Array.isArray(stage?.seasonLabels) ? stage.seasonLabels : [];
  const start = Math.max(0, (turn || 1) - 1);
  return timeline.slice(start, start + horizon).map((entry, offset) => ({
    turn: start + offset + 1,
    periodLabel: seasonLabels[start + offset] || `第${start + offset + 1}週`,
    forecast: entry?.forecast || 'clear',
  }));
}

export function getCurrentPeriodLabel(stage, turn) {
  const labels = Array.isArray(stage?.seasonLabels) ? stage.seasonLabels : [];
  return labels[Math.max(0, (turn || 1) - 1)] || `第${turn || 1}週`;
}

export function applyTreatment(state, plotId) {
  if (!state || state.finished) {
    return state;
  }

  const stage = getStageById(state.stageId);
  const item = getSelectedItem(state);
  if (!item) {
    return appendLog(state, '主役資材の設定が見つかりません。');
  }

  const plots = Array.isArray(state.plots) ? state.plots : createPlots();
  const target = plots.find((plot) => plot.id === plotId) || plots.find((plot) => !plot.locked) || plots[0];
  if (!target) {
    return appendLog(state, '対象圃場が見つかりません。');
  }
  if (target.locked || target.role === 'control') {
    return appendLog(state, '無処理区には資材を投入できません。');
  }
  if (state.turnActionUsed) {
    return appendLog(state, '今週はすでに処理を行いました。');
  }
  if (state.remainingUses <= 0) {
    return appendLog(state, 'このステージで使える処理回数を使い切りました。');
  }
  if (false && target.treatmentUsed) {
    return appendLog(state, `${target.name}にはすでに${item.name}を使用済みです。`);
  }
  const retreatmentCooldown = getRetreatmentCooldownRemaining(target, state.turn);
  if (retreatmentCooldown > 0) {
    return appendLog(state, `${target.name} は再投入まであと ${retreatmentCooldown} 週間必要です。`);
  }
  if (state.budget < item.cost) {
    return appendLog(state, `${item.name}を使う予算が足りません。`);
  }

  const treatment = {
    key: item.key,
    name: item.name,
    state: item.delay > 0 ? 'pending' : 'active',
    pending: item.delay,
    remaining: item.duration,
    usedTurn: state.turn,
  };

  const nextPlots = plots.map((plot) =>
    plot.id === target.id
      ? {
          ...plot,
          treatmentUsed: true,
          lastTreatmentTurn: state.turn,
          treatments: [...safeTreatments(plot.treatments), treatment],
        }
      : plot,
  );

  const timing =
    treatment.state === 'pending'
      ? `発効まで${treatment.pending}週間`
      : `${item.timingLabel} / ${treatment.remaining}週間有効`;

  return {
    ...state,
    budget: state.budget - item.cost,
    spent: state.spent + item.cost,
    remainingUses: Math.max(0, state.remainingUses - 1),
    turnActionUsed: true,
    plots: nextPlots,
    logs: [`${target.name}に${item.name}を使用（${timing}）。`, ...safeLogs(state.logs)].slice(0, 80),
  };
}

export function advanceTurn(state) {
  if (!state || state.finished) {
    return state;
  }

  const stage = getStageById(state.stageId);
  const timelineEntry = stage.timeline[state.turn - 1] || { actual: 'clear', forecast: 'clear' };
  const actualEvent = timelineEntry.actual || 'clear';
  const eventLabel = getEventLabel(actualEvent);
  const periodLabel = getCurrentPeriodLabel(stage, state.turn);
  const eventLogs = [`${periodLabel}：実際の天候は${eventLabel}。`];

  const previewTurn = state.turn + 1;
  const nextPlots = (Array.isArray(state.plots) ? state.plots : createPlots()).map((plot) =>
    resolvePlotTurn(plot, actualEvent, eventLogs, previewTurn),
  );

  const comparisons = getComparisonRowsFromPlots(nextPlots);
  comparisons
    .filter((row) => row.role === 'trial')
    .forEach((row) => {
      eventLogs.push(
        `${row.name}は無処理比で 品質${formatSigned(row.deltaQuality)} / 収量${formatSigned(row.deltaYield)} / 体力${formatSigned(row.deltaStamina)} / 生育${formatSigned(row.deltaGrowth)}。`,
      );
    });

  const nextTurn = state.turn + 1;
  const finished = nextTurn > state.maxTurns;
  const baseState = {
    ...state,
    turn: finished ? state.maxTurns : nextTurn,
    plots: nextPlots,
    turnActionUsed: false,
    logs: [...eventLogs, ...safeLogs(state.logs)].slice(0, 80),
    finished,
    lastEvent: actualEvent,
  };

  if (!finished) {
    return baseState;
  }

  const settlement = calculateSettlement(baseState);
  return {
    ...baseState,
    settlement,
    logs: [`全${state.maxTurns}週間が終了。比較結果を決算にまとめます。`, ...baseState.logs].slice(0, 80),
  };
}

export function calculateProtection(plot, eventKey) {
  const activeTreatments = safeTreatments(plot?.treatments).filter((treatment) => treatment.state === 'active');
  let protection = 0;

  for (const treatment of activeTreatments) {
    if (!getItem(treatment.key)) {
      continue;
    }
    if (treatment.key === 'heatShield' && eventKey === 'heatwave') protection += 0.72;
    if (treatment.key === 'heatShield' && eventKey === 'drought') protection += 0.25;
    if (treatment.key === 'frostGuard' && eventKey === 'frost') protection += 0.78;
    if (treatment.key === 'rootBooster' && eventKey === 'flood') protection += 0.28;
    if (treatment.key === 'rootBooster' && eventKey === 'rain') protection += 0.1;
  }

  return Math.max(0, Math.min(0.85, protection));
}

export function calculateEventImpact(plot, eventKey) {
  const damage = EVENT_DAMAGE[eventKey] || EVENT_DAMAGE.clear;
  const protection = calculateProtection(plot, eventKey);
  return {
    protection,
    quality: Math.round(damage.quality * (1 - protection)),
    yield: Math.round(damage.yield * (1 - protection)),
    stamina: Math.round(damage.stamina * (1 - protection)),
    waterlogged: damage.waterlogged || 0,
  };
}

export function getComparisonRows(state) {
  return getComparisonRowsFromPlots(Array.isArray(state?.plots) ? state.plots : []);
}

export function getBestTrial(state) {
  const comparisons = getComparisonRows(state).filter((row) => row.role === 'trial');
  return comparisons.sort((left, right) => right.deltaTotal - left.deltaTotal)[0] || null;
}

export function calculateSettlement(state) {
  const stage = getStageById(state?.stageId);
  const comparisons = getComparisonRows(state);
  const control = comparisons.find((row) => row.role === 'control') || comparisons[0] || null;
  const trials = comparisons.filter((row) => row.role === 'trial');
  const bestTrial = trials.sort((left, right) => calculatePlotValue(right) - calculatePlotValue(left))[0] || null;

  const controlValue = control ? calculatePlotValue(control) : 0;
  const bestTrialValue = bestTrial ? calculatePlotValue(bestTrial) : 0;
  const improvementRate = controlValue > 0 ? Math.round(((bestTrialValue - controlValue) / controlValue) * 100) : 0;
  const qualityGain = Math.round((bestTrial?.quality || 0) - (control?.quality || 0));
  const yieldGain = Math.round((bestTrial?.yield || 0) - (control?.yield || 0));
  const growthGain = Math.round((bestTrial?.growth || 0) - (control?.growth || 0));
  const grade = getGrade(improvementRate, bestTrial?.quality || 0);

  return {
    stageName: stage.name,
    itemName: getSelectedItem(state)?.name || getPrimaryItem(stage)?.name || '未設定',
    controlName: control?.name || '無処理区',
    bestPlotName: bestTrial?.name || '試験区',
    controlValue,
    bestTrialValue,
    improvementRate,
    qualityGain,
    yieldGain,
    growthGain,
    grade,
    spent: state?.spent || 0,
    lesson: stage.lessonSummary,
    treatmentTurn: bestTrial?.lastTreatmentTurn || null,
  };
}

export function runAgriSurviveSelfCheck() {
  const failures = [];
  const assert = (condition, label) => {
    if (!condition) failures.push(label);
  };

  let state = createInitialGameState('rice-summer');
  assert(state.plots.length === 2, '初期化で2圃場ができる');
  assert(state.plots[0]?.locked === true, '無処理区がロックされている');

  const untouched = applyTreatment(state, 'plot-control');
  assert(untouched.remainingUses === state.remainingUses, '無処理区には処理できない');

  const beforeBudget = state.budget;
  state = applyTreatment(state, 'plot-a');
  assert(state.budget === beforeBudget - ITEM_LIBRARY.heatShield.cost, '資材を使うと予算が減る');
  assert(state.plots[1].treatments[0]?.state === 'pending', '猛暑対策液はpendingになる');

  assert(state.maxUses === 4, '投入可能数が4になる');
  assert(state.remainingUses === 3, '初回投入で残り回数が1減る');

  let cooldownState = advanceTurn(state);
  assert(getRetreatmentCooldownRemaining(cooldownState.plots[1], cooldownState.turn) === 1, '1週間後はまだ再投入できない');
  cooldownState = advanceTurn(cooldownState);
  const retried = applyTreatment(cooldownState, 'plot-a');
  assert(retried.remainingUses === cooldownState.remainingUses - 1, '2週間後は再投入できる');

  const frostNoGuard = calculateEventImpact({ treatments: [] }, 'frost');
  const frostWithGuard = calculateEventImpact({ treatments: [{ key: 'frostGuard', state: 'active', remaining: 1, pending: 0 }] }, 'frost');
  assert(frostWithGuard.yield < frostNoGuard.yield, '低温対策液あり/なしで遅霜ダメージに差が出る');

  let floodState = createInitialGameState('long-rain-flood');
  floodState = advanceTurn(floodState);
  floodState = advanceTurn(floodState);
  floodState = advanceTurn(floodState);
  assert(floodState.plots.some((plot) => plot.waterlogged > 0), '冠水でwaterloggedが付く');

  const settlement = calculateSettlement(floodState);
  assert(Number.isFinite(settlement.improvementRate) && settlement.grade, '比較決算が返る');

  return {
    ok: failures.length === 0,
    failures,
  };
}

function createPlot(id, name, role, locked) {
  const basePlot = {
    id,
    name,
    role,
    locked,
    quality: 100,
    yield: 100,
    stamina: 100,
    growth: 42,
    waterlogged: 0,
    treatments: [],
    treatmentUsed: false,
    lastTreatmentTurn: null,
    visualState: 'steady',
  };
  return {
    ...basePlot,
    visualState: getVisualState(basePlot),
  };
}

function resolvePlotTurn(plot, eventKey, logs, currentTurn) {
  const safePlot = {
    ...plot,
    quality: clamp(plot?.quality ?? 100),
    yield: clamp(plot?.yield ?? 100),
    stamina: clamp(plot?.stamina ?? 100),
    growth: clampGrowth(plot?.growth ?? 42),
    waterlogged: Math.max(0, plot?.waterlogged || 0),
    treatments: safeTreatments(plot?.treatments),
    treatmentUsed: getRetreatmentCooldownRemaining(plot, currentTurn) > 0,
  };

  let next = {
    ...safePlot,
    stamina: clamp(safePlot.stamina - 3, 0, 120),
  };

  const rootBoostActive = hasActiveTreatment(next, 'rootBooster');
  if (next.waterlogged > 0) {
    const waterStress = rootBoostActive ? 0.55 : 1;
    next = {
      ...next,
      quality: clamp(next.quality - Math.round(2 * waterStress)),
      yield: clamp(next.yield - Math.round(4 * waterStress)),
      stamina: clamp(next.stamina - Math.round(5 * waterStress)),
      growth: clampGrowth(next.growth - Math.round(6 * waterStress)),
      waterlogged: Math.max(0, next.waterlogged - (rootBoostActive ? 2 : 1)),
    };
    if (rootBoostActive) {
      logs.push(`${next.name}は根の回復促進剤で冠水後の回復が早まった。`);
    }
  }

  const impact = calculateEventImpact(next, eventKey);
  next = {
    ...next,
    quality: clamp(next.quality - impact.quality),
    yield: clamp(next.yield - impact.yield),
    stamina: clamp(next.stamina - impact.stamina),
    waterlogged: Math.max(0, next.waterlogged + impact.waterlogged),
  };

  if (impact.protection > 0) {
    logs.push(`${next.name}は資材で${Math.round(impact.protection * 100)}%被害を軽減。`);
  }

  const growthChange = calculateGrowthChange(next, eventKey);
  next = {
    ...next,
    growth: clampGrowth(next.growth + growthChange),
  };

  if (next.growth <= 18 || next.stamina <= 22) {
    next = {
      ...next,
      quality: clamp(next.quality - 3),
      yield: clamp(next.yield - 5),
    };
    logs.push(`${next.name}は枯れ込みが進み、収量が落ちた。`);
  } else if (next.growth >= 82 && next.stamina >= 72 && ['clear', 'warm', 'cloudy'].includes(eventKey)) {
    next = {
      ...next,
      quality: clamp(next.quality + 1),
      yield: clamp(next.yield + 2),
    };
    logs.push(`${next.name}は順調に生育し、収量見込みが伸びた。`);
  }

  next = tickTreatments(next, logs);
  return {
    ...next,
    visualState: getVisualState(next),
  };
}

function calculateGrowthChange(plot, eventKey) {
  let delta = 0;

  if (plot.stamina >= 85) delta += 5;
  else if (plot.stamina >= 65) delta += 3;
  else if (plot.stamina >= 45) delta += 1;
  else if (plot.stamina >= 25) delta -= 2;
  else delta -= 5;

  if (eventKey === 'clear') delta += 3;
  if (eventKey === 'warm') delta += 2;
  if (eventKey === 'cloudy') delta += 1;
  if (eventKey === 'rain') delta += 1;
  if (eventKey === 'heatwave') delta -= 8;
  if (eventKey === 'frost') delta -= 10;
  if (eventKey === 'flood') delta -= 12;
  if (eventKey === 'drought') delta -= 7;

  if (plot.waterlogged > 0) {
    delta -= Math.min(7, plot.waterlogged * 2);
  }

  if (hasActiveTreatment(plot, 'heatShield') && eventKey === 'heatwave') delta += 6;
  if (hasActiveTreatment(plot, 'frostGuard') && eventKey === 'frost') delta += 8;
  if (hasActiveTreatment(plot, 'rootBooster') && ['flood', 'rain'].includes(eventKey)) delta += 5;
  if (hasActiveTreatment(plot, 'rootBooster') && plot.waterlogged > 0) delta += 4;

  return Math.round(delta);
}

function tickTreatments(plot, logs) {
  const nextTreatments = [];

  for (const treatment of safeTreatments(plot.treatments)) {
    const item = getItem(treatment.key);
    if (!item) {
      continue;
    }
    if (treatment.state === 'pending') {
      const pending = Math.max(0, (treatment.pending || 0) - 1);
      if (pending === 0) {
        logs.push(`${plot.name}の${item.name}が有効化。`);
        nextTreatments.push({ ...treatment, state: 'active', pending: 0, remaining: item.duration });
      } else {
        nextTreatments.push({ ...treatment, pending });
      }
      continue;
    }
    if (treatment.state === 'active') {
      const remaining = Math.max(0, (treatment.remaining || 0) - 1);
      if (remaining > 0) {
        nextTreatments.push({ ...treatment, remaining });
      } else {
        logs.push(`${plot.name}の${item.name}の効果が終了。`);
      }
      continue;
    }
    nextTreatments.push(treatment);
  }

  return {
    ...plot,
    treatments: nextTreatments,
  };
}

function hasActiveTreatment(plot, itemKey) {
  return safeTreatments(plot?.treatments).some((treatment) => treatment.key === itemKey && treatment.state === 'active');
}

function getComparisonRowsFromPlots(plots) {
  const safePlots = Array.isArray(plots) ? plots.filter(Boolean) : [];
  const control = safePlots.find((plot) => plot.role === 'control') || safePlots[0] || null;

  return safePlots.map((plot) => ({
    ...plot,
    deltaQuality: Math.round((plot?.quality || 0) - (control?.quality || 0)),
    deltaYield: Math.round((plot?.yield || 0) - (control?.yield || 0)),
    deltaStamina: Math.round((plot?.stamina || 0) - (control?.stamina || 0)),
    deltaGrowth: Math.round((plot?.growth || 0) - (control?.growth || 0)),
    deltaTotal:
      Math.round((plot?.quality || 0) - (control?.quality || 0)) +
      Math.round((plot?.yield || 0) - (control?.yield || 0)) +
      Math.round((plot?.stamina || 0) - (control?.stamina || 0)) +
      Math.round((plot?.growth || 0) - (control?.growth || 0)),
  }));
}

function calculatePlotValue(plot) {
  const quality = clamp(plot?.quality, 0, 120);
  const yieldValue = clamp(plot?.yield, 0, 120);
  const stamina = clamp(plot?.stamina, 0, 120);
  const growth = clampGrowth(plot?.growth, 0, 100);
  return Math.round(yieldValue * (0.75 + quality / 100) + stamina * 1.2 + growth * 1.5);
}

function getGrade(improvementRate, quality) {
  if (improvementRate >= 30 && quality >= 85) return '大成功';
  if (improvementRate >= 15 && quality >= 75) return '成功';
  if (improvementRate >= 5) return '差を確認';
  return '要再試験';
}

function getVisualState(plot) {
  const vitality = (clampGrowth(plot?.growth) * 0.55) + (clamp(plot?.stamina, 0, 100) * 0.45) - Math.max(0, (plot?.waterlogged || 0) * 4);
  if (vitality >= 80) return 'thriving';
  if (vitality >= 55) return 'steady';
  if (vitality >= 30) return 'stressed';
  return 'withered';
}

function safeTreatments(treatments) {
  return Array.isArray(treatments) ? treatments.filter((treatment) => treatment && typeof treatment === 'object') : [];
}

function safeLogs(logs) {
  return Array.isArray(logs) ? logs : [];
}

function appendLog(state, message) {
  return {
    ...state,
    logs: [message, ...safeLogs(state.logs)].slice(0, 80),
  };
}

function getRetreatmentCooldownRemaining(plot, currentTurn) {
  const lastTreatmentTurn = Number.isFinite(plot?.lastTreatmentTurn) ? plot.lastTreatmentTurn : null;
  if (!lastTreatmentTurn) return 0;
  const turnsSinceTreatment = Math.max(0, currentTurn - lastTreatmentTurn);
  return Math.max(0, RETREATMENT_COOLDOWN_TURNS - turnsSinceTreatment);
}

function formatSigned(value) {
  const safeValue = Number.isFinite(value) ? Math.round(value) : 0;
  return safeValue > 0 ? `+${safeValue}` : `${safeValue}`;
}
