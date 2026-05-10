import React, { useEffect, useMemo, useState } from 'react';
import AgriThreeView from './AgriThreeView.jsx';
import {
  ITEM_LIBRARY,
  STAGES,
  advanceTurn,
  applyTreatment,
  createInitialGameState,
  getComparisonRows,
  getCurrentPeriodLabel,
  getEventLabel,
  getForecast,
  getItem,
  getPrimaryItem,
  getSelectedItem,
  getSelectedPlot,
  getStageById,
  runAgriSurviveSelfCheck,
} from './gameLogic.js';
import { ITEM_VISUALS, STAGE_VISUALS } from './uiAssets.js';

const FORECAST_PANEL_HORIZON = 4;
const DEFAULT_STAGE = STAGES[0];

export default function App() {
  const [setupOpen, setSetupOpen] = useState(true);
  const [hasStarted, setHasStarted] = useState(false);
  const [setupSelection, setSetupSelection] = useState({
    stageId: DEFAULT_STAGE.id,
    itemKey: DEFAULT_STAGE.primaryItemKey,
  });
  const [game, setGame] = useState(() => createInitialGameState(DEFAULT_STAGE.id, DEFAULT_STAGE.primaryItemKey));
  const [selectedPlotId, setSelectedPlotId] = useState('plot-a');

  const stage = getStageById(game.stageId);
  const currentItem = getSelectedItem(game);
  const comparisonRows = getComparisonRows(game);
  const selectedPlot = getSelectedPlot(game, selectedPlotId);
  const selectedRow = comparisonRows.find((plot) => plot.id === selectedPlot?.id) || comparisonRows[1] || comparisonRows[0] || null;
  const forecast = getForecast(stage, game.turn, FORECAST_PANEL_HORIZON);
  const currentPeriod = getCurrentPeriodLabel(stage, game.turn);
  const trialPlots = comparisonRows.filter((plot) => plot.role === 'trial');
  const controlRow = comparisonRows.find((plot) => plot.role === 'control') || comparisonRows[0] || null;
  const activeTreatment = Array.isArray(selectedPlot?.treatments) ? selectedPlot.treatments[0] || null : null;
  const setupStage = getStageById(setupSelection.stageId);
  const setupItem = getItem(setupSelection.itemKey) || getPrimaryItem(setupStage);
  const canTreat = !game.finished && !game.turnActionUsed && game.remainingUses > 0;
  const usedCount = Math.max(0, game.maxUses - game.remainingUses);
  const settlement = game.settlement;
  const bestTrialRow = settlement
    ? comparisonRows.find((plot) => plot.name === settlement.bestPlotName) || trialPlots[0] || null
    : null;
  const currentStageIndex = STAGES.findIndex((entry) => entry.id === game.stageId);
  const nextStage = currentStageIndex >= 0 ? STAGES[currentStageIndex + 1] || null : null;
  const currentItemVisual = ITEM_VISUALS[currentItem?.key];
  const setupItemVisual = ITEM_VISUALS[setupItem?.key];
  const stageVisual = STAGE_VISUALS[stage.id];

  const selfCheck = useMemo(() => {
    try {
      return runAgriSurviveSelfCheck();
    } catch (error) {
      return { ok: false, failures: [error instanceof Error ? error.message : '自己確認に失敗しました。'] };
    }
  }, []);

  useEffect(() => {
    if (!selectedPlot && game.plots[1]?.id) {
      setSelectedPlotId(game.plots[1].id);
    }
  }, [game.plots, selectedPlot]);

  const handleSetupStageChange = (stageId) => {
    const nextStage = getStageById(stageId);
    setSetupSelection({
      stageId: nextStage.id,
      itemKey: nextStage.primaryItemKey,
    });
  };

  const handleSetupItemChange = (itemKey) => {
    setSetupSelection((current) => ({ ...current, itemKey }));
  };

  const handleStart = () => {
    const nextState = createInitialGameState(setupSelection.stageId, setupSelection.itemKey);
    setGame(nextState);
    setSelectedPlotId('plot-a');
    setSetupOpen(false);
    setHasStarted(true);
  };

  const handleOpenSetup = () => {
    setSetupSelection({
      stageId: game.stageId,
      itemKey: game.selectedItemKey || getPrimaryItem(game.stageId)?.key || DEFAULT_STAGE.primaryItemKey,
    });
    setSetupOpen(true);
  };

  const handleTreat = (plotId) => {
    setGame((current) => applyTreatment(current, plotId));
    setSelectedPlotId(plotId);
  };

  const handleAdvanceTurn = () => {
    setGame((current) => advanceTurn(current));
  };

  const handleRetry = () => {
    const itemKey = game.selectedItemKey || currentItem?.key || stage.primaryItemKey;
    setGame(createInitialGameState(game.stageId, itemKey));
    setSelectedPlotId('plot-a');
    setSetupOpen(false);
    setHasStarted(true);
  };

  const handleNextStage = () => {
    if (!nextStage) {
      handleOpenSetup();
      return;
    }

    setSetupSelection({
      stageId: nextStage.id,
      itemKey: nextStage.primaryItemKey,
    });
    setGame(createInitialGameState(nextStage.id, nextStage.primaryItemKey));
    setSelectedPlotId('plot-a');
    setSetupOpen(false);
    setHasStarted(true);
  };

  const handleStageSelect = () => {
    setSetupSelection({
      stageId: game.stageId,
      itemKey: game.selectedItemKey || currentItem?.key || stage.primaryItemKey,
    });
    setSetupOpen(true);
  };

  return (
    <main className="app-shell">
      <section className="experience-shell">
        <AgriThreeView
          stage={stage}
          plots={game.plots}
          selectedPlotId={selectedPlot?.id}
          onSelectPlot={setSelectedPlotId}
          lastEvent={game.lastEvent}
        />
        <div className="scene-vignette" />

        <div className={`hud-overlay ${setupOpen || game.finished ? 'is-muted' : ''}`}>
          <header className="hud-top">
            <section className="brand-compact hud-panel">
              <div className="brand-mark" aria-hidden="true">
                農
              </div>
              <div className="brand-copy">
                <strong>アグリ・サバイブ</strong>
                <span>{stage.shortName}</span>
              </div>
              <div className="brand-meta">
                <span>{currentItem?.name || '資材未設定'}</span>
                <button type="button" className="setup-link" onClick={handleOpenSetup}>
                  条件変更
                </button>
              </div>
            </section>

            <div className="metric-rack">
              <MetricTile icon="投" label={game.finished ? '投入回数' : '投入可能数'} value={game.finished ? `${usedCount} / ${game.maxUses}` : `${game.remainingUses} / ${game.maxUses}`} />
              <MetricTile icon="週" label={game.finished ? '最終週' : '現在週'} value={`${game.turn}週目 / ${game.maxTurns}週`} />
            </div>
          </header>

          <section className="forecast-ribbon hud-panel">
            <div className="forecast-summary">
              <span className="section-tag">予報</span>
              <div className="forecast-summary-copy">
                <strong>{currentPeriod} から先を読む</strong>
                <span>{stage.lessonSummary}</span>
              </div>
            </div>

            <div className="forecast-strip">
              {forecast.map((entry) => (
                <ForecastCard key={`${entry.turn}-${entry.forecast}`} entry={entry} />
              ))}
            </div>

            <EffectInline
              plot={selectedPlot}
              treatment={activeTreatment}
              primaryItem={currentItem}
              forecast={forecast}
            />
          </section>

          <aside className="game-dock">
            <section className="plot-card hud-panel">
              <div className="panel-head">
                <div>
                  <div className="panel-kicker">選択中の区画</div>
                  <h2>{selectedPlot?.name || '試験区'}</h2>
                  <p>{selectedPlot?.role === 'control' ? '無処理区' : '試験区'}</p>
                </div>
                <span className={`visual-chip ${selectedPlot?.visualState || 'steady'}`}>{visualStateLabel(selectedPlot?.visualState)}</span>
              </div>

              <div className="meta-inline">
                <span>直近の天候: {getEventLabel(game.lastEvent)}</span>
                <span>冠水残り: {selectedPlot?.waterlogged || 0}</span>
              </div>

              <div className="stat-grid">
                <StatMini label="品質" value={selectedPlot?.quality} accent="quality" />
                <StatMini label="収量" value={selectedPlot?.yield} accent="yield" />
                <StatMini label="体力" value={selectedPlot?.stamina} accent="stamina" />
                <StatMini label="生育" value={selectedPlot?.growth} accent="growth" />
              </div>

              <div className="delta-grid">
                <DeltaPill label="品質差" value={selectedRow?.deltaQuality || 0} />
                <DeltaPill label="収量差" value={selectedRow?.deltaYield || 0} />
                <DeltaPill label="体力差" value={selectedRow?.deltaStamina || 0} />
                <DeltaPill label="生育差" value={selectedRow?.deltaGrowth || 0} />
              </div>
            </section>

            <section className="action-card hud-panel">
              <div className="item-row">
                {currentItemVisual ? (
                  <img className="item-art" src={currentItemVisual} alt={currentItem?.name || '資材'} />
                ) : (
                  <span className="item-badge">{getItemMonogram(currentItem?.key)}</span>
                )}
                <div>
                  <strong>{currentItem?.name || '資材未設定'}</strong>
                  <span>{currentItem?.delay || 0}週間後に発効 / {currentItem?.duration || 0}週間継続</span>
                </div>
              </div>

              <TreatmentTag treatment={activeTreatment} plot={selectedPlot} />

              <div className="trial-action-row">
                {trialPlots.map((plot) => (
                  <button
                    key={plot.id}
                    type="button"
                    className={`trial-chip ${plot.id === selectedPlot?.id ? 'selected' : ''}`}
                    onClick={() => handleTreat(plot.id)}
                    disabled={!canTreat || plot.treatmentUsed}
                  >
                    <span>{plot.name}に投入</span>
                    <small>{plot.treatmentUsed ? '投入済み' : '今週使用'}</small>
                  </button>
                ))}
              </div>

              {game.settlement ? (
                <div className="settlement-inline">
                  <strong>{game.settlement.grade}</strong>
                  <span>
                    {game.settlement.bestPlotName} が無処理区比で {formatDelta(game.settlement.improvementRate)}%
                  </span>
                </div>
              ) : null}

              <button type="button" className="advance-button" onClick={handleAdvanceTurn} disabled={game.finished}>
                <span className="advance-copy">
                  <strong>{game.finished ? '決算表示中' : '1週間進める'}</strong>
                  <small>{game.turnActionUsed ? '今週の投入は完了' : '投入しない場合は次週へ進行'}</small>
                </span>
                <span className="advance-arrow" aria-hidden="true">
                  »
                </span>
              </button>
            </section>
          </aside>

          <section className="log-card hud-panel">
            <div className="panel-kicker">ログ</div>
            <div className="log-list">
              {game.logs.slice(0, 4).map((log, index) => (
                <div key={`${log}-${index}`} className="log-row">
                  <span className="log-dot" aria-hidden="true" />
                  <p>{log}</p>
                </div>
              ))}
            </div>
          </section>
        </div>

        {setupOpen ? (
          <div className="setup-overlay">
            <section className="setup-dialog hud-panel">
              <div className="setup-hero-art">
                <div className="setup-hero-shade" />
                <div className="setup-hero">
                  <div className="setup-brand-mark" aria-hidden="true">
                    農
                  </div>
                  <div className="setup-hero-copy">
                    <h1>アグリ・サバイブ</h1>
                    <p>気象予測とバイオの戦略</p>
                    <span>最初に作物と主役資材を選び、無処理区との差がどれだけ出るかを比べます。</span>
                  </div>
                </div>
              </div>

              <div className="setup-grid">
                <section className="setup-section">
                  <div className="setup-label">1. 作物 / ステージ</div>
                  <div className="setup-choice-grid setup-stage-grid">
                    {STAGES.map((entry) => (
                      <button
                        key={entry.id}
                        type="button"
                        className={`choice-card stage-card ${entry.id === setupStage.id ? 'selected' : ''}`}
                        onClick={() => handleSetupStageChange(entry.id)}
                      >
                        <div className="choice-card-copy">
                          <strong>{entry.shortName}</strong>
                          <span>{entry.mission}</span>
                        </div>
                      </button>
                    ))}
                  </div>
                </section>

                <section className="setup-section">
                  <div className="setup-label">2. 資材</div>
                  <div className="setup-choice-grid setup-item-grid">
                    {Object.values(ITEM_LIBRARY).map((item) => (
                      <button
                        key={item.key}
                        type="button"
                        className={`choice-card item-card ${item.key === setupItem?.key ? 'selected' : ''}`}
                        onClick={() => handleSetupItemChange(item.key)}
                      >
                        {ITEM_VISUALS[item.key] ? (
                          <img className="item-card-art" src={ITEM_VISUALS[item.key]} alt={item.name} />
                        ) : null}
                        <div className="item-card-copy">
                          <div className="choice-card-head">
                            <strong>{item.name}</strong>
                            {setupStage.primaryItemKey === item.key ? <span className="recommended-chip">推奨</span> : null}
                          </div>
                          <span>{item.timingLabel}</span>
                          <small>{item.description}</small>
                        </div>
                      </button>
                    ))}
                  </div>
                </section>
              </div>

              <div className="setup-summary">
                <div className="summary-chip">{setupStage.shortName}</div>
                <div className="summary-chip">{setupItem?.name || '資材未設定'}</div>
                <div className="summary-copy">{setupStage.lessonSummary}</div>
                {setupItemVisual ? <img className="setup-summary-art" src={setupItemVisual} alt={setupItem?.name || '資材'} /> : null}
              </div>

              <div className="setup-actions">
                {!selfCheck.ok ? <div className="warning-chip">自己確認: {selfCheck.failures.join(' / ')}</div> : <span className="selfcheck-ok">自己確認済み</span>}
                <div className="setup-action-buttons">
                  {hasStarted ? (
                    <button type="button" className="setup-cancel" onClick={() => setSetupOpen(false)}>
                      戻る
                    </button>
                  ) : null}
                  <button type="button" className="setup-start" onClick={handleStart}>
                    この条件で開始
                  </button>
                </div>
              </div>
            </section>
          </div>
        ) : null}

        {game.finished && settlement ? (
          <ResultOverlay
            stage={stage}
            settlement={settlement}
            controlRow={controlRow}
            bestTrialRow={bestTrialRow}
            currentItem={currentItem}
            currentItemVisual={currentItemVisual}
            stageVisual={stageVisual}
            usedCount={usedCount}
            maxUses={game.maxUses}
            hasNextStage={Boolean(nextStage)}
            onNextStage={handleNextStage}
            onRetry={handleRetry}
            onStageSelect={handleStageSelect}
          />
        ) : null}
      </section>
    </main>
  );
}

function MetricTile({ icon, label, value }) {
  return (
    <div className="metric-tile hud-panel">
      <div className="metric-icon" aria-hidden="true">
        {icon}
      </div>
      <div>
        <span>{label}</span>
        <strong>{value}</strong>
      </div>
    </div>
  );
}

function ForecastCard({ entry }) {
  return (
    <article className={`forecast-card weather-${entry.forecast}`}>
      <div className="forecast-card-top">
        <span className="forecast-turn">第{entry.turn}週</span>
        <span className="forecast-period">{entry.periodLabel}</span>
      </div>
      <strong>{getEventLabel(entry.forecast)}</strong>
      <small>{getForecastDescriptor(entry.forecast)}</small>
    </article>
  );
}

function EffectInline({ plot, treatment, primaryItem, forecast }) {
  const points = Array.isArray(forecast) ? forecast : [];
  const maxIndex = Math.max(1, points.length - 1);
  const label = plot?.locked ? '無処理区は比較用' : treatment ? `${plot?.name} に投入済み` : `${primaryItem?.name || '資材'} は未投入`;

  let startIndex = -1;
  let endIndex = -1;
  let status = primaryItem?.timingLabel || '効果条件を確認';

  if (treatment) {
    const startOffset = treatment.state === 'active' ? 0 : Math.max(0, treatment.pending || 0);
    const remaining =
      treatment.state === 'active'
        ? Math.max(0, treatment.remaining || 0)
        : Math.max(0, treatment.remaining || primaryItem?.duration || 0);
    startIndex = Math.min(points.length - 1, startOffset);
    endIndex = Math.min(points.length - 1, startOffset + Math.max(0, remaining - 1));
    status =
      treatment.state === 'active'
        ? `有効 ${Math.max(0, treatment.remaining || 0)}週`
        : `${Math.max(0, treatment.pending || 0)}週後に発効`;
  }

  const left = startIndex >= 0 ? `${(startIndex / maxIndex) * 100}%` : '0%';
  const width = startIndex >= 0 && endIndex >= startIndex ? `${((endIndex - startIndex) / maxIndex) * 100}%` : '0%';

  return (
    <div className="effect-inline">
      <div className="effect-inline-label">
        <span className="effect-icon">{getItemMonogram(primaryItem?.key)}</span>
        <div>
          <strong>{primaryItem?.name || '資材未設定'}</strong>
          <span>{label}</span>
        </div>
      </div>

      <div className="effect-rail">
        <div className="effect-rail-base" />
        {startIndex >= 0 ? (
          <>
            <div className="effect-rail-active" style={{ left, width }} />
            <div className="effect-rail-start" style={{ left }} />
            <div className="effect-rail-end" style={{ left: `calc(${left} + ${width})` }} />
          </>
        ) : null}
        <div className="effect-nodes" style={{ gridTemplateColumns: `repeat(${Math.max(1, points.length)}, minmax(0, 1fr))` }}>
          {points.map((entry, index) => (
            <span
              key={`${entry.turn}-node`}
              className={`effect-node ${index >= startIndex && index <= endIndex ? 'active' : ''}`}
            />
          ))}
        </div>
      </div>

      <div className="effect-status">{status}</div>
    </div>
  );
}

function StatMini({ label, value, accent }) {
  const safeValue = Math.max(0, Math.min(120, Number(value) || 0));
  return (
    <div className="stat-mini">
      <div className="stat-mini-head">
        <span>{label}</span>
        <strong>{Math.round(safeValue)}</strong>
      </div>
      <div className="stat-track compact">
        <div className={`stat-fill ${accent || ''}`} style={{ width: `${Math.min(100, safeValue)}%` }} />
      </div>
    </div>
  );
}

function DeltaPill({ label, value }) {
  return (
    <div className={`delta-pill ${value > 0 ? 'positive' : value < 0 ? 'negative' : 'neutral'}`}>
      <span>{label}</span>
      <strong>{formatDelta(value)}</strong>
    </div>
  );
}

function ResultOverlay({
  stage,
  settlement,
  controlRow,
  bestTrialRow,
  currentItem,
  currentItemVisual,
  stageVisual,
  usedCount,
  maxUses,
  hasNextStage,
  onNextStage,
  onRetry,
  onStageSelect,
}) {
  const rank = getResultRank(settlement?.grade);
  const clear = isStageClear(settlement);
  const achievement = getResultAchievement(stage, bestTrialRow, settlement);
  const insight = getResultInsight(stage, settlement, currentItem);
  const cropCloseupLabel = stage.crop === 'orchard' ? '花芽の状態' : '稲の状態';
  const comparisonMetrics = [
    { key: 'quality', label: '品質', accent: 'quality', delta: settlement?.qualityGain || 0 },
    { key: 'yield', label: '収量', accent: 'yield', delta: settlement?.yieldGain || 0 },
    { key: 'stamina', label: '体力', accent: 'stamina', delta: (bestTrialRow?.stamina || 0) - (controlRow?.stamina || 0) },
    { key: 'growth', label: '生育', accent: 'growth', delta: settlement?.growthGain || 0 },
  ];

  return (
    <div className="result-overlay">
      <div className="result-backdrop" />
      <section className="result-main hud-panel">
        <div className="result-kicker">リザルト</div>
        <div className="result-hero">
          <span className={`result-status ${clear ? 'clear' : 'retry'}`}>{clear ? 'ステージクリア' : '再挑戦'}</span>
          <div className="result-medal" aria-hidden="true">
            {rank}
          </div>
          <div className="result-hero-copy">
            <strong>{getResultHeadline(stage, settlement)}</strong>
            <span>{settlement?.bestPlotName} が最終的に最も安定しました。</span>
          </div>
        </div>

        <div className="result-focus-grid">
          <div className="result-crop-closeup">
            {stageVisual ? <img src={stageVisual} alt={`${stage.shortName}の作物アップ`} /> : null}
            <div className="result-crop-caption">
              <span>{cropCloseupLabel}</span>
              <strong>{bestTrialRow?.visualState ? visualStateLabel(bestTrialRow.visualState) : '比較中'}</strong>
            </div>
          </div>

          <div className="result-comparison">
            <div className="result-comparison-head">
              <span>比較結果</span>
              <strong>無処理区との差 {formatDelta(settlement?.improvementRate || 0)}%</strong>
            </div>
            <div className="result-comparison-grid">
              <ResultComparisonColumn title={settlement?.controlName || '無処理区'} row={controlRow} metrics={comparisonMetrics} />
              <div className="result-difference-column">
                <span>差</span>
                {comparisonMetrics.map((metric) => (
                  <strong key={metric.key} className={metric.delta >= 0 ? 'positive' : 'negative'}>
                    {formatDelta(metric.delta)}
                  </strong>
                ))}
              </div>
              <ResultComparisonColumn title={settlement?.bestPlotName || '試験区'} row={bestTrialRow} metrics={comparisonMetrics} highlight />
            </div>
          </div>
        </div>

        <div className="result-metrics">
          <ResultMetric label="品質差" value={settlement?.qualityGain || 0} accent="quality" signed />
          <ResultMetric label="収量差" value={settlement?.yieldGain || 0} accent="yield" signed />
          <ResultMetric label="生育差" value={settlement?.growthGain || 0} accent="growth" signed />
          <ResultGradeCard rank={rank} label={settlement?.grade || '評価待ち'} />
        </div>

        <div className="result-summary-line">
          <strong>{achievement.title}</strong>
          <span>{insight}</span>
        </div>
      </section>

      <aside className="result-side hud-panel">
        <div className="result-side-head">使用した資材</div>
        <div className="result-side-card">
          {currentItemVisual ? (
            <img className="result-item-art" src={currentItemVisual} alt={currentItem?.name || '資材'} />
          ) : (
            <span className="result-item-badge">{getItemMonogram(currentItem?.key)}</span>
          )}
          <div className="result-item-copy">
            <strong>{currentItem?.name || '資材未設定'}</strong>
            <div className="result-item-meta">
              <span>投入回数</span>
              <b>
                {usedCount} / {maxUses}
              </b>
            </div>
            <small>
              {currentItem?.delay || 0}週間後から効く
              <br />
              {currentItem?.duration || 0}週間継続
            </small>
          </div>
        </div>

        <div className="result-delta-stack">
          <DeltaPill label="品質差" value={settlement?.qualityGain || 0} />
          <DeltaPill label="収量差" value={settlement?.yieldGain || 0} />
          <DeltaPill label="生育差" value={settlement?.growthGain || 0} />
          <DeltaPill label="改善率" value={settlement?.improvementRate || 0} />
        </div>
      </aside>

      <div className="result-actions">
        <button type="button" className="result-primary" onClick={onNextStage}>
          {hasNextStage ? '次のステージへ' : 'ステージ選択へ'}
        </button>
        <button type="button" className="result-secondary" onClick={onRetry}>
          もう一度挑戦
        </button>
        {hasNextStage ? (
          <button type="button" className="result-secondary" onClick={onStageSelect}>
            ステージ選択へ
          </button>
        ) : null}
      </div>
    </div>
  );
}

function ResultComparisonColumn({ title, row, metrics, highlight = false }) {
  return (
    <div className={`result-comparison-column ${highlight ? 'highlight' : ''}`}>
      <span>{title}</span>
      {metrics.map((metric) => {
        const value = Math.round(Number(row?.[metric.key]) || 0);
        return (
          <div key={metric.key} className="comparison-value">
            <small>{metric.label}</small>
            <strong>{value}</strong>
          </div>
        );
      })}
    </div>
  );
}

function ResultMetric({ label, value, accent, signed = false }) {
  const numericValue = Number(value) || 0;
  const safeValue = Math.max(0, Math.min(120, signed ? Math.abs(numericValue) : numericValue));
  return (
    <div className={`result-metric ${signed && numericValue >= 0 ? 'positive' : signed ? 'negative' : ''}`}>
      <span>{label}</span>
      <strong>{signed ? formatDelta(numericValue) : Math.round(safeValue)}</strong>
      <div className="stat-track">
        <div className={`stat-fill ${accent || ''}`} style={{ width: `${Math.min(100, safeValue)}%` }} />
      </div>
    </div>
  );
}

function ResultGradeCard({ rank, label }) {
  return (
    <div className="result-grade-card">
      <span>総合評価</span>
      <strong>{rank}</strong>
      <small>{label}</small>
    </div>
  );
}

function TreatmentTag({ treatment, plot }) {
  if (plot?.locked) {
    return <div className="treatment-tag muted-tag">無処理区は比較の基準です。ここには投入できません。</div>;
  }
  if (!treatment) {
    return <div className="treatment-tag muted-tag">この区画にはまだ資材を投入していません。</div>;
  }
  if (treatment.state === 'pending') {
    return <div className="treatment-tag pending-tag">{treatment.name}: あと {treatment.pending} 週間で発効</div>;
  }
  return <div className="treatment-tag active-tag">{treatment.name}: 効果中 残り {treatment.remaining} 週間</div>;
}

function visualStateLabel(state) {
  if (state === 'thriving') return '良好';
  if (state === 'steady') return '安定';
  if (state === 'stressed') return '弱り';
  if (state === 'withered') return '枯れ込み';
  return '変化待ち';
}

function getForecastDescriptor(eventKey) {
  if (eventKey === 'heatwave') return '強い熱ストレス';
  if (eventKey === 'frost') return '花芽や生育に大打撃';
  if (eventKey === 'flood') return '冠水で根が苦しくなる';
  if (eventKey === 'drought') return '乾きで消耗';
  if (eventKey === 'rain') return 'やや湿る';
  if (eventKey === 'warning') return '備えが必要';
  if (eventKey === 'warm') return '育ちやすい温度';
  if (eventKey === 'cloudy') return '穏やかな推移';
  return '通常推移';
}

function getItemMonogram(itemKey) {
  if (itemKey === 'heatShield') return '暑';
  if (itemKey === 'frostGuard') return '霜';
  if (itemKey === 'rootBooster') return '根';
  return '資';
}

function formatDelta(value) {
  const safeValue = Number.isFinite(value) ? Math.round(value) : 0;
  return safeValue > 0 ? `+${safeValue}` : `${safeValue}`;
}

function getResultRank(grade) {
  if (grade === '大成功') return 'A';
  if (grade === '成功') return 'B';
  if (grade === '差を確認') return 'C';
  return 'D';
}

function isStageClear(settlement) {
  return Number(settlement?.improvementRate || 0) >= 5;
}

function getResultHeadline(stage, settlement) {
  if (!settlement) return '比較結果をまとめました';
  if (stage.crop === 'rice') {
    return settlement.qualityGain >= 0 ? '猛暑を読み、品質差を確保' : '猛暑対応の差が小さかった';
  }
  if (stage.crop === 'orchard') {
    return settlement.qualityGain >= 0 ? '遅霜を読み、花芽を守った' : '霜害対策の再調整が必要';
  }
  return settlement.growthGain >= 0 ? '冠水後の立て直しに成功' : '回復のタイミングを見直したい';
}

function getResultAchievement(stage, bestTrialRow, settlement) {
  if (stage.crop === 'rice') {
    if ((bestTrialRow?.quality || 0) >= 85) {
      return { icon: '穂', title: '一等米判定', description: '白未熟粒を抑え、猛暑の中でも品質を保てました。' };
    }
    return { icon: '穂', title: '品質維持', description: '品質は守れましたが、一等米にはもう一歩でした。' };
  }
  if (stage.crop === 'orchard') {
    if ((settlement?.qualityGain || 0) >= 8) {
      return { icon: '花', title: '花芽保護', description: '遅霜の直前対応で、花芽の被害を大きく抑えました。' };
    }
    return { icon: '花', title: '霜害差の確認', description: '直前散布の効き方は見えましたが、差はまだ小さめです。' };
  }
  if ((settlement?.growthGain || 0) >= 8) {
    return { icon: '根', title: '根の回復', description: '冠水後の立て直しが早く、無処理区との差が出ました。' };
  }
  return { icon: '根', title: '回復比較', description: '回復速度の差は見えましたが、投入時期の調整余地があります。' };
}

function getResultInsight(stage, settlement, item) {
  const turnText = settlement?.treatmentTurn ? `第${settlement.treatmentTurn}週` : '未投入';
  if (!settlement?.treatmentTurn) {
    return `${item?.name || '資材'}を使わなかったため、無処理区との差は限定的でした。予報を見て、どの週で仕込むかを決めることが重要です。`;
  }
  if (stage.lessonType === 'preemptive') {
    return `${turnText} に ${item?.name || '資材'} を投入したことで、猛暑の前に効果が立ち上がりました。先回りした判断が品質維持につながっています。`;
  }
  if (stage.lessonType === 'justInTime') {
    return `${turnText} の直前対応で、遅霜が来たときに効果が残りました。早すぎず遅すぎない投入が、花芽保護の差になっています。`;
  }
  return `${turnText} に ${item?.name || '資材'} を入れたことで、冠水後の回復が前倒しされました。被害後の立て直し速度が無処理区との差を生んでいます。`;
}
